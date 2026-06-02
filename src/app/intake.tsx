import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const TOTAL_STEPS = 6;

const FITNESS_LEVELS = ["Beginner", "Intermediate", "Advanced"];

const RECOVERY_OPTIONS = [
  { id: "injury", label: "Recovering from injury", emoji: "🤕" },
  { id: "maintenance", label: "General maintenance", emoji: "💪" },
];

const BODY_AREAS = [
  { id: "neck", label: "Neck", top: 8, left: "42%" },
  { id: "shoulder_l", label: "L Shoulder", top: 18, left: "18%" },
  { id: "shoulder_r", label: "R Shoulder", top: 18, left: "62%" },
  { id: "upper_back", label: "Upper Back", top: 22, left: "42%" },
  { id: "chest", label: "Chest", top: 26, left: "42%" },
  { id: "lower_back", label: "Lower Back", top: 38, left: "42%" },
  { id: "hip", label: "Hip", top: 46, left: "42%" },
  { id: "knee_l", label: "L Knee", top: 62, left: "24%" },
  { id: "knee_r", label: "R Knee", top: 62, left: "58%" },
  { id: "ankle_l", label: "L Ankle", top: 80, left: "24%" },
  { id: "ankle_r", label: "R Ankle", top: 80, left: "58%" },
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

  const next = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
    else router.push("/");
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
      {/* Header */}
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

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* STEP 1 — Name */}
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

        {/* STEP 2 — Age */}
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

        {/* STEP 3 — Fitness level */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>What's your fitness level?</Text>
            <Text style={styles.subtitle}>Be honest — no wrong answers</Text>
            <View style={styles.optionList}>
              {FITNESS_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.optionCard,
                    form.fitnessLevel === level && styles.optionCardSelected,
                  ]}
                  onPress={() => setForm({ ...form, fitnessLevel: level })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      form.fitnessLevel === level && styles.optionTextSelected,
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* STEP 4 — Recovery or maintenance */}
        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>What brings you here?</Text>
            <Text style={styles.subtitle}>
              This shapes the type of exercises we give you
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
                  <Text
                    style={[
                      styles.optionText,
                      form.recoveryType === opt.id && styles.optionTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* STEP 5 — Body map */}
        {step === 5 && (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>Where does it hurt?</Text>
            <Text style={styles.subtitle}>Tap the area on your body</Text>
            <View style={styles.bodyMap}>
              <View style={styles.bodyFigure}>
                <View style={styles.head} />
                <View style={styles.torso} />
                <View style={[styles.arm, styles.armLeft]} />
                <View style={[styles.arm, styles.armRight]} />
                <View style={[styles.leg, styles.legLeft]} />
                <View style={[styles.leg, styles.legRight]} />
              </View>
              {BODY_AREAS.map((area) => (
                <TouchableOpacity
                  key={area.id}
                  style={[
                    styles.bodyDot,
                    { top: `${area.top}%` as `${number}%`, left: area.left as `${number}%` },
                    form.bodyArea === area.id && styles.bodyDotSelected,
                  ]}
                  onPress={() => setForm({ ...form, bodyArea: area.id })}
                />
              ))}
            </View>
            {form.bodyArea && (
              <Text style={styles.selectedArea}>
                Selected: {BODY_AREAS.find((a) => a.id === form.bodyArea)?.label}
              </Text>
            )}
          </View>
        )}

        {/* STEP 6 — Pain level */}
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
                  ⚠️ High pain level detected. Please consult a medical
                  professional before starting any exercise program.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Next button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
          onPress={next}
          disabled={!canProceed()}
        >
          <Text style={styles.nextBtnText}>
            {step === TOTAL_STEPS ? "Generate My Plan →" : "Continue →"}
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
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 120 },
  stepContainer: { flex: 1 },
  question: { fontSize: 28, fontWeight: "800", color: "#fff", marginBottom: 8, lineHeight: 36 },
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
  optionText: { color: "#aaa", fontSize: 16, fontWeight: "600" },
  optionTextSelected: { color: "#4F8EF7" },
  optionEmoji: { fontSize: 24, marginRight: 14 },
  bodyMap: { height: 320, alignItems: "center", position: "relative", marginBottom: 16 },
  bodyFigure: { width: 120, height: 300, position: "relative", alignItems: "center" },
  head: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#2a2a2a", marginBottom: 4 },
  torso: { width: 70, height: 100, backgroundColor: "#2a2a2a", borderRadius: 10, marginBottom: 4 },
  arm: { width: 22, height: 90, backgroundColor: "#2a2a2a", borderRadius: 11, position: "absolute", top: 48 },
  armLeft: { left: 4 },
  armRight: { right: 4 },
  leg: { width: 28, height: 110, backgroundColor: "#2a2a2a", borderRadius: 14, position: "absolute", top: 152 },
  legLeft: { left: 20 },
  legRight: { right: 20 },
  bodyDot: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#333",
    borderWidth: 2,
    borderColor: "#555",
  },
  bodyDotSelected: { backgroundColor: "#4F8EF7", borderColor: "#4F8EF7" },
  selectedArea: { color: "#4F8EF7", fontSize: 15, fontWeight: "600", textAlign: "center", marginTop: 8 },
  painNumber: { fontSize: 72, fontWeight: "800", color: "#fff", textAlign: "center", marginBottom: 16 },
  slider: { width: "100%", height: 40 },
  sliderLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
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
  nextBtn: { backgroundColor: "#4F8EF7", paddingVertical: 18, borderRadius: 14, alignItems: "center" },
  nextBtnDisabled: { backgroundColor: "#1a1a1a" },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
