 require('dotenv').config();
 const { createClient } = require('@supabase/supabase-js');
 const OpenAI = require('openai')
 
 // loading in each of the packages we installed
    // dto env tells it to find the env folder and the secret keys in it

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    realtime: { enabled: false },
    global: { fetch: fetch }
  }
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
    const { body_part, pain_level, condition, goals } = req.body;
    // pulls out the specific fields from wtv app sent
    // "pull these four fields out of req.body"

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

        // ask claire about sets and reps in the exercise table
    const exerciseList = exercises.map(e =>
  `- ${e.name}: ${e.instructions} (contraindications: ${e.contradictions})`
    ).join('\n');

    const prompt = `You are a physical therapy assistant.
You MUST select exercises ONLY from the list provided below. Do not invent or suggest any exercises that are not in the list.

A patient has the following profile:
- Body part: ${body_part}
- Pain level: ${pain_level}/10
- Condition: ${condition}
- Goals: ${goals}

From the following exercises, select the best 3 for this patient and explain why each is appropriate.
Return ONLY a JSON object with a field "exercises" containing an array of 3 objects, each with fields: name, instructions, and rationale.

Available exercises (choose ONLY from these):
${exerciseList}`;

    const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    // sends prompt to OpenAI and waits for the response 
    // "JSON.parse" makes it so that GPT is forced to return a valid JSON
        // parses response to an actual javascript object

        return res.status(200).json(result);
        // sends 3 exercies back to the app 

    // error handling
} catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to generate plan'});
}
};