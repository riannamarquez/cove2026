import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import { supabase } from "../services/supabase";
import { useState, useEffect } from "react";
//useEffect needed to check Supabase for existing profile data 

import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const TOTAL_STEPS = 6;

const FITNESS_LEVELS = [
  {
    id: "inactive",
    label: "Inactive",
    desc: "Little to no regular exercise",
  },
  {
    id: "moderate",
    label: "Moderately Active",
    desc: "Light exercise 2–3 days/week",
  },
  {
    id: "active",
    label: "Highly Active",
    desc: "Intense exercise 4+ days/week",
  },
];

const RECOVERY_OPTIONS = [
  {
    id: "injury",
    label: "Active Injury",
    desc: "Currently experiencing pain",
    emoji: "🤕",
  },
  {
    id: "recovery",
    label: "Recovery",
    desc: "Post-injury, building back up",
    emoji: "💪",
  },
];

function painDescription(level: number) {
  if (level <= 2) return "Minimal";
  if (level <= 4) return "Mild — manageable";
  if (level <= 6) return "Moderate — noticeable";
  if (level <= 8) return "Significant";
  return "Severe";
}

const BODY_AREAS = [
  { id: "neck", label: "Neck" },
  { id: "shoulder", label: "Shoulder" },
  { id: "upper_back", label: "Upper Back" },
  { id: "lower_back", label: "Lower Back" },
  { id: "chest", label: "Chest" },
  { id: "hip", label: "Hip" },
  { id: "knee", label: "Knee" },
  { id: "ankle", label: "Ankle" },
  { id: "elbow", label: "Elbow" },
  { id: "wrist", label: "Wrist" },
];

export default function IntakeScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    age: "",
    fitnessLevel: "",
    recoveryType: "",
    bodyArea: "",
    painLevel: 5,
  });

  const [profileLoaded, setProfileLoaded] = useState(false);
useEffect(() => {
  const checkProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('users')
        .select('name, age')
        .eq('id', user.id)
        .single();
      
      if (data?.name && data?.age) {
        setForm(prev => ({ ...prev, name: data.name, age: String(data.age) }));
        setStep(3); // skip name and age steps
      }
    }
    setProfileLoaded(true);
  };
  checkProfile();
}, []);

  const progress = step / TOTAL_STEPS;

  const next = async () => {
  if (step === 3) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase.from('users').upsert({
        id: user.id,
        email: user.email,
        name: form.name,
        age: parseInt(form.age),
        fitness_level: form.fitnessLevel,
      });
      console.log('upsert result', data, 'error', error)
    }
  }

  const { data: { user } } = await supabase.auth.getUser();
console.log('user id being sent:', user?.id);

  if (step < TOTAL_STEPS) {
    setStep(step + 1);
  } else {
    try {
      console.log('sending to GCP:', {
        body_part: form.bodyArea,
        pain_level: form.painLevel,
        condition: form.recoveryType,
        goals: form.fitnessLevel,
      });
      const { data: { user } } = await supabase.auth.getUser();
      const response = await fetch('https://us-central1-cove-app-499119.cloudfunctions.net/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          body_part: form.bodyArea,
          pain_level: form.painLevel,
          condition: form.recoveryType,
          goals: form.fitnessLevel,
        }),
      });
      const plan = await response.json();

// Save plan to Supabase
if (user) {
  const { error: planError } = await supabase.from('plans').insert({
    user_id: user.id,
    exercises: JSON.stringify(plan.exercises),
    body_area: form.bodyArea,
    pain_level: form.painLevel,
    recovery_stage: form.recoveryType,
    fitness_level: form.fitnessLevel,
    plan_data: plan,
  });
  console.log('plan save error:', planError);
}

router.push({ pathname: '/(tabs)/plan', params: { plan: JSON.stringify(plan) } });
    
      router.push({ pathname: '/(tabs)/plan', params: { plan: JSON.stringify(plan) } });
    } catch (e) {
      console.error('Failed to generate plan:', e);
    }
  }
};

  const back = () => {
    if (step > 1) setStep(step - 1);
  };

  const canProceed = () => {
    if (step === 1) return form.name.trim().length > 0;
    if (step === 2) return form.age.trim().length > 0;
    if (step === 3) return form.fitnessLevel !== "";
    if (step === 4) return form.recoveryType !== "";
    if (step === 5) return form.bodyArea !== "";
    return true;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {step > 1 && (
          <TouchableOpacity onPress={back} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.stepLabel}>
          {step} of {TOTAL_STEPS}
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>What's your name?</Text>
            <Text style={styles.subtitle}>So we can personalize your plan</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor="#4a5e4a"
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
              autoFocus
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>How old are you?</Text>
            <Text style={styles.subtitle}>Helps us tailor exercise intensity</Text>
            <TextInput
              style={styles.input}
              placeholder="Your age"
              placeholderTextColor="#4a5e4a"
              keyboardType="numeric"
              value={form.age}
              onChangeText={(v) => setForm({ ...form, age: v })}
              autoFocus
            />
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>What's your fitness level?</Text>
            <Text style={styles.subtitle}>
              This determines exercise intensity in your plan
            </Text>
            <View style={styles.optionList}>
              {FITNESS_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.optionCard,
                    form.fitnessLevel === level.id && styles.optionCardSelected,
                  ]}
                  onPress={() => setForm({ ...form, fitnessLevel: level.id })}
                >
                  <View style={styles.optionTextGroup}>
                    <Text
                      style={[
                        styles.optionText,
                        form.fitnessLevel === level.id && styles.optionTextSelected,
                      ]}
                    >
                      {level.label}
                    </Text>
                    <Text style={styles.optionDesc}>{level.desc}</Text>
                  </View>
                  {form.fitnessLevel === level.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>Recovery or injury?</Text>
            <Text style={styles.subtitle}>
              This shapes the type of exercises in your plan
            </Text>
            <View style={styles.optionList}>
              {RECOVERY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.optionCard,
                    styles.optionCardLarge,
                    form.recoveryType === opt.id && styles.optionCardSelected,
                  ]}
                  onPress={() => setForm({ ...form, recoveryType: opt.id })}
                >
                  <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                  <View style={styles.optionTextGroup}>
                    <Text
                      style={[
                        styles.optionText,
                        form.recoveryType === opt.id && styles.optionTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    <Text style={styles.optionDesc}>{opt.desc}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 5 && (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>Where are we working?</Text>
            <Text style={styles.subtitle}>Select the area of focus</Text>
            <View style={styles.bodyGrid}>
              {BODY_AREAS.map((area) => (
                <TouchableOpacity
                  key={area.id}
                  style={[
                    styles.bodyChip,
                    form.bodyArea === area.id && styles.bodyChipSelected,
                  ]}
                  onPress={() => setForm({ ...form, bodyArea: area.id })}
                >
                  <Text
                    style={[
                      styles.bodyChipText,
                      form.bodyArea === area.id && styles.bodyChipTextSelected,
                    ]}
                  >
                    {area.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.multiAreaNote}>
              If there are multiple body parts that need physical therapy,
              please generate <Text style={styles.multiAreaNoteEmphasis}>separate plans</Text> for
              each. You can view all your past plans from the home screen.
              Enjoy!
            </Text>
          </View>
        )}

        {step === 6 && (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>How much pain are you in?</Text>
            <Text style={styles.subtitle}>1 = no pain, 10 = severe</Text>
            <Text style={styles.painNumber}>{Math.round(form.painLevel)}</Text>
            <Text style={styles.painDescription}>
              {painDescription(form.painLevel)}
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={form.painLevel}
              onValueChange={(v) => setForm({ ...form, painLevel: v })}
              minimumTrackTintColor="#7bc67e"
              maximumTrackTintColor="#2d3f2d"
              thumbTintColor="#7bc67e"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>No pain</Text>
              <Text style={styles.sliderLabel}>Severe</Text>
            </View>
            {form.painLevel >= 7 && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ⚠️ High pain level. Please consult a medical professional
                  before starting any exercise program.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
          onPress={next}
          disabled={!canProceed()}
        >
          <Text
            style={[
              styles.nextBtnText,
              !canProceed() && styles.nextBtnTextDisabled,
            ]}
          >
            {step === TOTAL_STEPS ? "Build My Plan →" : "Continue →"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a2e1a" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 72,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  backBtn: { position: "absolute", left: 24, padding: 8 },
  backText: { color: "#8fa88f", fontSize: 22, fontFamily: "InstrumentSerif_400Regular" },
  stepLabel: { color: "#8fa88f", fontSize: 13, fontWeight: "600", fontFamily: "InstrumentSerif_400Regular" },
  progressTrack: {
    height: 3,
    backgroundColor: "#2d3f2d",
    marginHorizontal: 24,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: { height: 3, backgroundColor: "#7bc67e", borderRadius: 2 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 52,
    paddingBottom: 120,
  },
  stepContainer: { flex: 1 },
  question: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
    lineHeight: 36,
    fontFamily: "InstrumentSerif_400Regular",
  },
  subtitle: { fontSize: 15, color: "#8fa88f", marginBottom: 36, fontFamily: "InstrumentSerif_400Regular" },
  input: {
    backgroundColor: "#243324",
    borderRadius: 14,
    padding: 18,
    fontSize: 18,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#2d3f2d",
  },
  optionList: { gap: 12 },
  optionCard: {
    backgroundColor: "#243324",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#2d3f2d",
    flexDirection: "row",
    alignItems: "center",
  },
  optionCardLarge: { padding: 22 },
  optionCardSelected: { borderColor: "#7bc67e", backgroundColor: "#1e3d1e" },
  optionTextGroup: { flex: 1 },
  optionText: { color: "#8fa88f", fontSize: 16, fontWeight: "600", fontFamily: "InstrumentSerif_400Regular" },
  optionTextSelected: { color: "#7bc67e" },
  optionDesc: { color: "#6b856b", fontSize: 13, marginTop: 2, fontFamily: "InstrumentSerif_400Regular" },
  optionEmoji: { fontSize: 24, marginRight: 14, fontFamily: "InstrumentSerif_400Regular" },
  checkmark: { color: "#7bc67e", fontSize: 18, fontWeight: "700", fontFamily: "InstrumentSerif_400Regular" },
  bodyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  bodyChip: {
    backgroundColor: "#243324",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#2d3f2d",
  },
  bodyChipSelected: {
    backgroundColor: "#1e3d1e",
    borderColor: "#7bc67e",
  },
  bodyChipText: { color: "#8fa88f", fontSize: 15, fontWeight: "600", fontFamily: "InstrumentSerif_400Regular" },
  bodyChipTextSelected: { color: "#7bc67e" },
  multiAreaNote: {
    fontSize: 13,
    color: "#8fa88f",
    marginTop: 20,
    lineHeight: 20,
    fontFamily: "InstrumentSerif_400Regular",
  },
  multiAreaNoteEmphasis: { color: "#7bc67e" },
  painNumber: {
    fontSize: 72,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 4,
    fontFamily: "InstrumentSerif_400Regular",
  },
  painDescription: {
    fontSize: 15,
    color: "#8fa88f",
    textAlign: "center",
    marginBottom: 16,
    fontFamily: "InstrumentSerif_400Regular",
  },
  slider: { width: "100%", height: 40 },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sliderLabel: { color: "#8fa88f", fontSize: 12, fontFamily: "InstrumentSerif_400Regular" },
  warningBox: {
    backgroundColor: "#3d1f1f",
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#e05252",
  },
  warningText: { color: "#e05252", fontSize: 14, lineHeight: 20, fontFamily: "InstrumentSerif_400Regular" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#1a2e1a",
    borderTopWidth: 1,
    borderTopColor: "#2d3f2d",
  },
  nextBtn: {
    backgroundColor: "#7bc67e",
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
  },
  nextBtnDisabled: { backgroundColor: "#2d3f2d" },
  nextBtnText: { color: "#1a2e1a", fontSize: 16, fontWeight: "700", fontFamily: "InstrumentSerif_400Regular" },
  nextBtnTextDisabled: { color: "#4a5e4a" },
});
