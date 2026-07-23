import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useCameraPermissions } from "expo-camera";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { supabase } from "../../../.lib/supabase";

type PlanExercise = {
  name: string;
};

type Photo = {
  uri: string;
  base64: string;
};

type FormFeedback = {
  overallForm: string;
  corrections?: string[];
  positives?: string[];
  imageIssue?: string;
};

const CHECK_FORM_URL =
  "https://us-central1-cove-app-499119.cloudfunctions.net/check-form";

function formColor(overallForm: string) {
  if (overallForm === "Good") return "#4ADE80";
  if (overallForm === "Needs Work") return "#FBBF24";
  if (overallForm === "Stop — Safety Risk") return "#F87171";
  return "#fff";
}

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  const [exercises, setExercises] = useState<PlanExercise[]>([]);
  const [exercisesLoading, setExercisesLoading] = useState(true);
  const [exercisesError, setExercisesError] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const [photo1, setPhoto1] = useState<Photo | null>(null);
  const [photo2, setPhoto2] = useState<Photo | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");
  const [feedback, setFeedback] = useState<FormFeedback | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        setExercisesLoading(true);
        setExercisesError("");
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            if (!cancelled) setExercisesError("Not signed in.");
            return;
          }

          const { data, error } = await supabase
            .from("plans")
            .select("exercises")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1);

          if (error) throw error;

          const raw = data?.[0]?.exercises;
          const parsed: PlanExercise[] = raw
            ? typeof raw === "string"
              ? JSON.parse(raw)
              : raw
            : [];

          if (!cancelled) setExercises(parsed);
        } catch (e) {
          if (!cancelled) {
            setExercisesError(
              e instanceof Error ? e.message : "Failed to load exercises."
            );
          }
        } finally {
          if (!cancelled) setExercisesLoading(false);
        }
      }

      load();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const capture = async (position: 1 | 2) => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      base64: true,
      quality: 0.5,
    });

    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset?.base64) return;

    const photo: Photo = { uri: asset.uri, base64: asset.base64 };
    if (position === 1) setPhoto1(photo);
    else setPhoto2(photo);
  };

  const analyze = async () => {
    if (selectedIndex === null || !photo1 || !photo2) return;

    setAnalyzing(true);
    setAnalyzeError("");
    try {
      const response = await fetch(CHECK_FORM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise: exercises[selectedIndex].name,
          image1: photo1.base64,
          image2: photo2.base64,
        }),
      });
      const json = await response.json();
      setFeedback(json);
    } catch (e) {
      setAnalyzeError(
        e instanceof Error ? e.message : "Failed to analyze your form."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const tryAgain = () => {
    setPhoto1(null);
    setPhoto2(null);
    setFeedback(null);
    setAnalyzeError("");
  };

  const canAnalyze =
    selectedIndex !== null && !!photo1 && !!photo2 && !analyzing;

  const permissionBlocked =
    permission !== null && !permission.granted && !permission.canAskAgain;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Form Coach</Text>
          <Text style={styles.headerSub}>
            Get AI feedback on your exercise form
          </Text>
        </View>

        {/* Exercise selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Select an exercise</Text>
          {exercisesLoading && (
            <ActivityIndicator color="#4F8EF7" style={{ marginTop: 8 }} />
          )}
          {!exercisesLoading && exercisesError !== "" && (
            <Text style={styles.errorText}>{exercisesError}</Text>
          )}
          {!exercisesLoading && exercisesError === "" && exercises.length === 0 && (
            <Text style={styles.emptyText}>
              No plan found yet. Generate a plan first.
            </Text>
          )}
          {!exercisesLoading && exercises.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {exercises.map((ex, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.chip,
                    selectedIndex === i && styles.chipActive,
                  ]}
                  onPress={() => setSelectedIndex(i)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedIndex === i && styles.chipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {ex.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Permission blocked message */}
        {permissionBlocked && (
          <View style={styles.section}>
            <View style={styles.permissionCard}>
              <Text style={styles.permissionText}>
                Cove needs camera access to capture photos of your exercise
                form. Please enable camera permissions in Settings to
                continue.
              </Text>
              <TouchableOpacity
                style={styles.permissionBtn}
                onPress={() => Linking.openSettings()}
              >
                <Text style={styles.permissionBtnText}>Open Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Capture buttons */}
        {!permissionBlocked && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Capture your form</Text>
            <View style={styles.captureGrid}>
              <View style={styles.captureCol}>
                <TouchableOpacity
                  style={styles.captureBtn}
                  onPress={() => capture(1)}
                >
                  <Text style={styles.captureBtnText}>Capture Position 1</Text>
                </TouchableOpacity>
                {photo1 && (
                  <View style={styles.thumbWrap}>
                    <Image source={{ uri: photo1.uri }} style={styles.thumb} />
                    <Text style={styles.thumbLabel}>Position 1</Text>
                  </View>
                )}
              </View>

              <View style={styles.captureCol}>
                <TouchableOpacity
                  style={styles.captureBtn}
                  onPress={() => capture(2)}
                >
                  <Text style={styles.captureBtnText}>Capture Position 2</Text>
                </TouchableOpacity>
                {photo2 && (
                  <View style={styles.thumbWrap}>
                    <Image source={{ uri: photo2.uri }} style={styles.thumb} />
                    <Text style={styles.thumbLabel}>Position 2</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Analyze button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.analyzeBtn, !canAnalyze && styles.analyzeBtnDisabled]}
            onPress={analyze}
            disabled={!canAnalyze}
          >
            {analyzing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.analyzeBtnText}>Analyze My Form →</Text>
            )}
          </TouchableOpacity>
          {analyzeError !== "" && (
            <Text style={styles.errorText}>{analyzeError}</Text>
          )}
        </View>

        {/* Feedback display */}
        {feedback && (
          <View style={styles.section}>
            <View style={styles.feedbackCard}>
              <Text
                style={[
                  styles.overallForm,
                  { color: formColor(feedback.overallForm) },
                ]}
              >
                {feedback.overallForm}
              </Text>

              {feedback.imageIssue ? (
                <View style={styles.warningBox}>
                  <Text style={styles.warningTitle}>⚠ Image Issue</Text>
                  <Text style={styles.warningText}>{feedback.imageIssue}</Text>
                </View>
              ) : (
                feedback.corrections &&
                feedback.corrections.length > 0 && (
                  <View style={styles.feedbackGroup}>
                    <Text style={styles.feedbackGroupTitle}>
                      Corrections
                    </Text>
                    {feedback.corrections.map((item, i) => (
                      <Text key={i} style={styles.bulletText}>
                        •  {item}
                      </Text>
                    ))}
                  </View>
                )
              )}

              {feedback.positives && feedback.positives.length > 0 && (
                <View style={styles.feedbackGroup}>
                  <Text style={styles.feedbackGroupTitle}>What's working</Text>
                  {feedback.positives.map((item, i) => (
                    <Text key={i} style={styles.bulletText}>
                      •  {item}
                    </Text>
                  ))}
                </View>
              )}

              <TouchableOpacity style={styles.tryAgainBtn} onPress={tryAgain}>
                <Text style={styles.tryAgainBtnText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  scroll: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    color: "#666",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionLabel: {
    color: "#888",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  errorText: {
    color: "#F87171",
    fontSize: 13,
    marginTop: 8,
  },
  emptyText: {
    color: "#555",
    fontSize: 14,
  },
  chipRow: {
    gap: 8,
  },
  chip: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  chipActive: {
    backgroundColor: "#0d1f3c",
    borderColor: "#4F8EF7",
  },
  chipText: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#4F8EF7",
  },
  permissionCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 14,
  },
  permissionText: {
    color: "#bbb",
    fontSize: 14,
    lineHeight: 20,
  },
  permissionBtn: {
    backgroundColor: "#4F8EF7",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  permissionBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  captureGrid: {
    flexDirection: "row",
    gap: 12,
  },
  captureCol: {
    flex: 1,
    gap: 10,
  },
  captureBtn: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  captureBtnText: {
    color: "#4F8EF7",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  thumbWrap: {
    alignItems: "center",
    gap: 6,
  },
  thumb: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  thumbLabel: {
    color: "#666",
    fontSize: 12,
    fontWeight: "600",
  },
  analyzeBtn: {
    backgroundColor: "#4F8EF7",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
  },
  analyzeBtnDisabled: {
    backgroundColor: "#1a1a1a",
  },
  analyzeBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  feedbackCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 16,
  },
  overallForm: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  warningBox: {
    backgroundColor: "#3c1f0d",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#6e3a1e",
    gap: 4,
  },
  warningTitle: {
    color: "#FBBF24",
    fontSize: 13,
    fontWeight: "700",
  },
  warningText: {
    color: "#ddd",
    fontSize: 14,
    lineHeight: 20,
  },
  feedbackGroup: {
    gap: 6,
  },
  feedbackGroupTitle: {
    color: "#888",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bulletText: {
    color: "#ccc",
    fontSize: 14,
    lineHeight: 20,
  },
  tryAgainBtn: {
    backgroundColor: "#0d1f3c",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1e3a6e",
  },
  tryAgainBtnText: {
    color: "#4F8EF7",
    fontSize: 14,
    fontWeight: "700",
  },
});
