 require('dotenv').config();
 const { createClient } = require('@supabase/supabase-js');
 const OpenAI = require('openai')
 
 // loading in each of the packages we installed
    // dto env tells it to find the env folder and the secret keys in it

const ws = require('ws');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { realtime: { transport: ws } }
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY})

// function gcp will run when someone hits endpoint
    // req: incoming request
    // res: response
// exports.generatePlan tells gcp "this is the function to run"
exports.generatePlan = async (req, res) => {
res.set('Access-Control-Allow-Origin', '*');
if (req.method === 'OPTIONS')
    { 
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(204).send('');
    }

try {
    const { body_part, pain_level, condition, goals, user_id } = req.body;
    // pulls out the specific fields from wtv app sent
    // "pull these four fields out of req.body"

    const { data: intake, error: intakeError } = await supabase
        .from('users')
        .select('age, fitness_level')
        .eq('id', user_id)
        .single();
    if (intakeError) throw intakeError;

    const age = intake?.age;
    const fitnessLevel = intake?.fitness_level;

    //rag step-- fetching relevant exercises from your database
    const { data: exercises, error } = await supabase
        .from('exercises') // picks the table (of exercise options)
        .select('*') // grabs all the columns (think sql)
        .ilike('body_area', `%${body_part}%`) // case-insensitive search
        .limit(10); // caps at ten results so it doesn't overflow
    if (error) throw error;

    //const exerciseList = (exercises || []).map(e =>
      //  `-${e.name}: ${e.description} (sets: ${e.sets}, reps: ${e.reps})`
    //).join('\n')
    // turning the array of exercise objects into a readable text list from suabase
    // quasiquotes let u embed variables directly with ${} 

    const exerciseList = exercises.map(e =>
  `- ${e.name}: ${e.instructions} (contraindications: ${e.contradictions})`
    ).join('\n');

    const prompt = `You are a physical therapy assistant.
You MUST select exercises ONLY from the list provided below. Do not invent or suggest any exercises that are not in the list.

A patient has the following profile:
- Age: ${age}
- Fitness level: ${fitnessLevel}
- Body part: ${body_part}
- Pain level: ${pain_level}/10
- Condition: ${condition}
- Goals: ${goals}

From the following exercises, select the best 3 for this patient to do daily and explain why each is appropriate.
Return ONLY a JSON object with a field "exercises" containing an array of 3 objects, each with fields: name and rationale.

Available exercises (choose ONLY from these):
${exerciseList}`;

    const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content);

    // merge GPT's picks with the full Supabase rows so sets/reps/instructions
    // always come from the database, not GPT
    const enriched = result.exercises.map(gptEx => {
        const dbEx = exercises.find(
            e => e.name.toLowerCase().trim() === gptEx.name.toLowerCase().trim()
        );
    console.log('gptEx name:', gptEx.name, '| dbEx found:', !!dbEx, '| gif_url:', dbEx?.gif_url)
        return { ...dbEx, rationale: gptEx.rationale };
    });

        return res.status(200).json({ exercises: enriched });
        // sends 3 exercies back to the app 

    // error handling
} catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to generate plan'});
}
};

exports.checkForm = async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }

  try {
    const { exercise, image1, image2 } = req.body;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a physical therapy form coach embedded in a mobile app called Cove. Your job is to evaluate a patient's exercise form from two photos and provide specific, actionable corrections.

You will receive:
1. The name of the exercise the patient is performing
2. Two photos of the patient. Photo 1 shows the starting or mid position, Photo 2 shows the end position of the movement. Together they show the arc of the exercise. Your job is to analyze both photos together to evaluate the patient's form across the full movement, not just a single frozen moment.

STRICT RULES:

1. SCOPE RULE
Only evaluate the exercise named. Do not comment on anything unrelated to form — the environment, clothing, equipment quality, or anything not directly about body position and movement mechanics.

2. SAFETY RULE
If the form you see poses a clear injury risk (e.g. severe knee caving, dangerous spinal flexion, joint hyperextension), flag it clearly and recommend stopping immediately.

3. FORMAT RULE
Always return a valid JSON object. No markdown, no code blocks, no preamble — raw JSON only.

4. HONESTY RULE
If the image is too blurry, too dark, or the patient is not visible enough to evaluate form accurately, say so honestly rather than guessing.

RESPONSE FORMAT:
{
  "exercise": "name of the exercise",
  "overallForm": "Good" | "Needs Work" | "Stop — Safety Risk",
  "corrections": [
    "Specific correction 1 — describe exactly what to fix and how",
    "Specific correction 2 — describe exactly what to fix and how",
    "Specific correction 3 — describe exactly what to fix and how"
  ],
  "positives": [
    "One thing they are doing well"
  ],
  "safetyFlag": false
}

If there is a safety risk, set safetyFlag to true and make the first correction a clear warning.

If the image is unclear:
{
  "exercise": "name of the exercise",
  "overallForm": "Unable to evaluate",
  "corrections": [],
  "positives": [],
  "safetyFlag": false,
  "imageIssue": "Brief description of why the image could not be evaluated"
}

TONE GUIDELINES:
- Specific and direct — name the exact body part and what it should do
- Encouraging but honest — acknowledge what is working before corrections
- Never alarming unless there is a genuine safety risk
- Write as if speaking directly to the patient, not about them
- Keep corrections concise — one clear instruction per bullet, not a paragraph`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Please evaluate my form for: ${exercise}`
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${image1}` }
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${image2}` }
            }
          ]
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return res.status(200).json(result);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to analyze form' });
  }
};