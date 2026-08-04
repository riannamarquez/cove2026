import { CameraView, useCameraPermissions } from "expo-camera";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { supabase } from "../../../.lib/supabase";

const FALLBACK_EXERCISES = [
  "Glute Bridge",
  "Clamshell",
  "Quad Sets",
  "Straight Leg Raise",
  "Wall Sit",
  "Bodyweight Squat",
  "Standing Hamstring Curl",
];

const CAPTURE_INTERVAL_MS = 3000;
const DEFAULT_FEEDBACK = "Start the camera to receive form feedback.";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [exercises, setExercises] = useState<string[]>(FALLBACK_EXERCISES);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState(FALLBACK_EXERCISES[0]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState(DEFAULT_FEEDBACK);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const isAnalyzingRef = useRef(false);
  const sessionIdRef = useRef(0);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function loadPlanExercises() {
        setLoadingPlan(true);
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) return;

          const { data, error } = await supabase
            .from("plans")
            .select("plan_data")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (error || cancelled) return;

          const planExercises = (
            data?.plan_data as { exercises?: { name: string }[] } | null
          )?.exercises;

          const names = (planExercises ?? [])
            .map((ex) => ex.name)
            .filter((name): name is string => Boolean(name));

          if (names.length > 0 && !cancelled) {
            setExercises(names);
            setSelectedExercise((prev) =>
              names.includes(prev) ? prev : names[0]
            );
          }
        } finally {
          if (!cancelled) setLoadingPlan(false);
        }
      }

      loadPlanExercises();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const captureAndAnalyze = useCallback(async () => {
    if (!cameraRef.current || isAnalyzingRef.current) return;

    const requestSessionId = sessionIdRef.current;
    isAnalyzingRef.current = true;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.4,
      });
      if (!photo?.base64) return;
      if (requestSessionId !== sessionIdRef.current) return;

      // On web, expo-camera returns a full data URL ("data:image/jpeg;base64,...")
      // instead of raw base64 — strip the prefix so the API's base64 decode doesn't fail.
      const rawBase64 = photo.base64.replace(/^data:image\/\w+;base64,/, "");

      setIsAnalyzing(true);
      setFeedback("Analyzing your form...");

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? "",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 300,
          system: `You are a physical therapy form coach. The user is performing a ${selectedExercise} exercise. Analyze their form in this image and give 1-2 sentences of specific, actionable feedback. Be encouraging but precise. Focus on the most important correction needed or confirm good form if it looks correct.`,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: "image/jpeg",
                    data: rawBase64,
                  },
                },
                { type: "text", text: "Analyze my form in this photo." },
              ],
            },
          ],
        }),
      });

      if (!response.ok) throw new Error(`Request failed: ${response.status}`);

      const data = await response.json();
      const textBlock = Array.isArray(data.content)
        ? data.content.find((block: { type: string }) => block.type === "text")
        : null;

      const result = textBlock?.text?.trim() || "Could not analyze frame. Keep going!";
      if (requestSessionId !== sessionIdRef.current) return;
      setFeedback(result);
      setHistory((prev) => [...prev, result]);
    } catch {
      const result = "Could not analyze frame. Keep going!";
      if (requestSessionId === sessionIdRef.current) {
        setFeedback(result);
        setHistory((prev) => [...prev, result]);
      }
    } finally {
      isAnalyzingRef.current = false;
      if (requestSessionId === sessionIdRef.current) setIsAnalyzing(false);
    }
  }, [selectedExercise]);

  const startSession = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }

    sessionIdRef.current += 1;
    setHistory([]);
    setIsSessionActive(true);
    captureAndAnalyze();
    intervalRef.current = setInterval(captureAndAnalyze, CAPTURE_INTERVAL_MS);
  };

  const stopSession = () => {
    sessionIdRef.current += 1;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsSessionActive(false);
    setIsAnalyzing(false);
    setFeedback("Session ended. Great work!");

    if (history.length > 0) {
      saveSessionFeedback(selectedExercise, history);
    }
    setHistory([]);
  };

  const saveSessionFeedback = async (exercise: string, feedbackNotes: string[]) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("camera_sessions").insert({
        user_id: user.id,
        exercise,
        feedback: feedbackNotes,
      });
    } catch {
      // Best-effort save — don't block the UI on failure.
    }
  };

  const toggleSession = () => {
    if (isSessionActive) stopSession();
    else startSession();
  };

  const permissionBlocked = permission !== null && !permission.granted && !permission.canAskAgain;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Form Coach</Text>
      </View>

      {loadingPlan ? (
        <View style={styles.selectorLoading}>
          <ActivityIndicator color="#4F8EF7" size="small" />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.selectorScroll}
          contentContainerStyle={styles.selectorContent}
        >
          {exercises.map((exercise) => (
            <TouchableOpacity
              key={exercise}
              style={[
                styles.chip,
                selectedExercise === exercise && styles.chipActive,
              ]}
              onPress={() => setSelectedExercise(exercise)}
              disabled={isSessionActive}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedExercise === exercise && styles.chipTextActive,
                ]}
              >
                {exercise}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.cameraContainer}>
        {permissionBlocked ? (
          <View style={styles.permissionCard}>
            <Text style={styles.permissionText}>
              Cove needs camera access to give you live feedback on your
              exercise form. Please enable camera permissions in Settings to
              continue.
            </Text>
            <TouchableOpacity
              style={styles.permissionBtn}
              onPress={() => Linking.openSettings()}
            >
              <Text style={styles.permissionBtnText}>Open Settings</Text>
            </TouchableOpacity>
          </View>
        ) : permission?.granted ? (
          <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        ) : (
          <View style={styles.permissionCard}>
            <Text style={styles.permissionText}>
              Cove needs camera access to give you live feedback on your
              exercise form.
            </Text>
            <TouchableOpacity
              style={styles.permissionBtn}
              onPress={() => requestPermission()}
            >
              <Text style={styles.permissionBtnText}>Grant Camera Access</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, isSessionActive && styles.actionBtnStop]}
          onPress={toggleSession}
        >
          <Text style={styles.actionBtnText}>
            {isSessionActive ? "Stop" : "Start"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.feedbackSection}>
        <View style={styles.feedbackCard}>
          {isAnalyzing && <ActivityIndicator color="#4F8EF7" style={styles.feedbackSpinner} />}
          <Text style={styles.feedbackText}>{feedback}</Text>
        </View>

        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => setShowHistory(true)}
        >
          <Text style={styles.historyBtnText}>View Session History</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showHistory}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Session History</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalList}>
              {history.length === 0 ? (
                <Text style={styles.modalEmptyText}>
                  No feedback yet this session.
                </Text>
              ) : (
                history.map((item, i) => (
                  <View key={i}>
                    <View style={styles.historyItem}>
                      <Text style={styles.historyIndex}>{i + 1}</Text>
                      <Text style={styles.historyText}>{item}</Text>
                    </View>
                    {i < history.length - 1 && (
                      <View style={styles.historyDivider} />
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0f0f0f",
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
  },
  selectorScroll: {
    flexGrow: 0,
    marginBottom: 12,
  },
  selectorLoading: {
    height: 37,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  selectorContent: {
    paddingHorizontal: 20,
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
  cameraContainer: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#050505",
    borderWidth: 1,
    borderColor: "#1e1e1e",
  },
  camera: {
    flex: 1,
  },
  permissionCard: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  permissionText: {
    color: "#bbb",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  permissionBtn: {
    backgroundColor: "#4F8EF7",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  permissionBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  actionRow: {
    alignItems: "center",
    paddingVertical: 16,
  },
  actionBtn: {
    backgroundColor: "#4F8EF7",
    borderRadius: 14,
    paddingHorizontal: 48,
    paddingVertical: 16,
  },
  actionBtnStop: {
    backgroundColor: "#3c1f1f",
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  feedbackSection: {
    marginHorizontal: 20,
    marginBottom: 100,
    gap: 10,
  },
  feedbackCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 10,
  },
  feedbackSpinner: {
    alignSelf: "flex-start",
  },
  feedbackText: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
  },
  historyBtn: {
    backgroundColor: "#0d1f3c",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1e3a6e",
  },
  historyBtnText: {
    color: "#4F8EF7",
    fontSize: 14,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  modalCloseText: {
    color: "#888",
    fontSize: 20,
    fontWeight: "600",
  },
  modalList: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalEmptyText: {
    color: "#555",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
  },
  historyItem: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 14,
  },
  historyIndex: {
    color: "#4F8EF7",
    fontSize: 14,
    fontWeight: "800",
    width: 20,
  },
  historyText: {
    flex: 1,
    color: "#ccc",
    fontSize: 14,
    lineHeight: 20,
  },
  historyDivider: {
    height: 1,
    backgroundColor: "#2a2a2a",
  },
});
