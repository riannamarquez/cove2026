import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import { useState } from "react";
import { supabase } from "../../.lib/supabase";

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

  const progress = step / TOTAL_STEPS;

  const next = async () => {
    if (step === 3) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('users').upsert({
          id: user.id,
          email: user.email,
          name: form.name,
          age: parseInt(form.age),
          fitness_level: form.fitnessLevel,
        });
      }
    }

    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      // call cloud func & nav to plan
      try {
        const response = await fetch('http://localhost:8000', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            body_part: form.bodyArea,
            pain_level: form.painLevel,
            condition: form.recoveryType,
            goals: form.fitnessLevel,
          }),
      });
      const plan = await response.json();
      router.push({ pathname: '/(tabs)/plan', params: { plan: JSON.stringify(plan) } });
    } catch (e) {
      console.error('Failed to generate plan:', e);
    } }
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
              placeholderTextColor="#555"
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
              placeholderTextColor="#555"
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
          </View>
        )}

        {step === 6 && (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>How much pain are you in?</Text>
            <Text style={styles.subtitle}>1 = no pain, 10 = severe</Text>
            <Text style={styles.painNumber}>{Math.round(form.painLevel)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={form.painLevel}
              onValueChange={(v) => setForm({ ...form, painLevel: v })}
              minimumTrackTintColor="#4F8EF7"
              maximumTrackTintColor="#333"
              thumbTintColor="#4F8EF7"
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
          <Text style={styles.nextBtnText}>
            {step === TOTAL_STEPS ? "Build My Plan →" : "Continue →"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  backBtn: { position: "absolute", left: 24, padding: 8 },
  backText: { color: "#fff", fontSize: 22 },
  stepLabel: { color: "#666", fontSize: 13, fontWeight: "600" },
  progressTrack: {
    height: 3,
    backgroundColor: "#222",
    marginHorizontal: 24,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: { height: 3, backgroundColor: "#4F8EF7", borderRadius: 2 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 120,
  },
  stepContainer: { flex: 1 },
  question: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
    lineHeight: 36,
  },
  subtitle: { fontSize: 15, color: "#666", marginBottom: 36 },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    padding: 18,
    fontSize: 18,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  optionList: { gap: 12 },
  optionCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    flexDirection: "row",
    alignItems: "center",
  },
  optionCardLarge: { padding: 22 },
  optionCardSelected: { borderColor: "#4F8EF7", backgroundColor: "#0d1f3c" },
  optionTextGroup: { flex: 1 },
  optionText: { color: "#aaa", fontSize: 16, fontWeight: "600" },
  optionTextSelected: { color: "#4F8EF7" },
  optionDesc: { color: "#555", fontSize: 13, marginTop: 2 },
  optionEmoji: { fontSize: 24, marginRight: 14 },
  checkmark: { color: "#4F8EF7", fontSize: 18, fontWeight: "700" },
  bodyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  bodyChip: {
    backgroundColor: "#1a1a1a",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  bodyChipSelected: {
    backgroundColor: "#0d1f3c",
    borderColor: "#4F8EF7",
  },
  bodyChipText: { color: "#aaa", fontSize: 15, fontWeight: "600" },
  bodyChipTextSelected: { color: "#4F8EF7" },
  painNumber: {
    fontSize: 72,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
  },
  slider: { width: "100%", height: 40 },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sliderLabel: { color: "#666", fontSize: 12 },
  warningBox: {
    backgroundColor: "#2a1500",
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#ff6b00",
  },
  warningText: { color: "#ff9940", fontSize: 14, lineHeight: 20 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: "#0f0f0f",
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
  },
  nextBtn: {
    backgroundColor: "#4F8EF7",
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
  },
  nextBtnDisabled: { backgroundColor: "#1a1a1a" },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
