import Slider from "@react-native-community/slider";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { supabase } from "../../../.lib/supabase";

const EXERCISES = [
  { id: "1", name: "Straight Leg Raises" },
  { id: "2", name: "Quad Sets" },
  { id: "3", name: "Terminal Knee Extension" },
];

type LogEntry = {
  date: string;
  painLevel: number;
  notes: string;
};

type CameraSession = {
  id: string;
  exercise: string;
  feedback: string[];
  created_at: string;
};

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function painColor(level: number) {
  if (level <= 3) return "#34C759";
  if (level <= 6) return "#FF9500";
  return "#FF3B30";
}

export default function LogScreen() {
  const [logs, setLogs] = useState<Record<string, LogEntry[]>>({});
  const [streak, setStreak] = useState(0);
  const [modalExercise, setModalExercise] = useState<(typeof EXERCISES)[0] | null>(null);
  const [painLevel, setPainLevel] = useState(5);
  const [notes, setNotes] = useState("");
  const [cameraSessions, setCameraSessions] = useState<CameraSession[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      (async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("camera_sessions")
          .select("id, exercise, feedback, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!cancelled) setCameraSessions((data ?? []) as CameraSession[]);
      })();

      return () => {
        cancelled = true;
      };
    }, [])
  );

  const openModal = (exercise: (typeof EXERCISES)[0]) => {
    setModalExercise(exercise);
    setPainLevel(5);
    setNotes("");
  };

  const saveEntry = () => {
    if (!modalExercise) return;
    const entry: LogEntry = {
      date: todayLabel(),
      painLevel,
      notes,
    };
    setLogs((prev) => ({
      ...prev,
      [modalExercise.id]: [...(prev[modalExercise.id] ?? []), entry],
    }));
    setStreak((s) => s + 1);
    setModalExercise(null);
  };

  const getLastEntry = (id: string) => {
    const entries = logs[id];
    return entries && entries.length > 0 ? entries[entries.length - 1] : null;
  };

  const allEntries = EXERCISES.flatMap((ex) =>
    (logs[ex.id] ?? []).map((entry) => ({ ...entry, exerciseName: ex.name }))
  ).reverse();

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Progress Log</Text>
        </View>

        {/* Streak card */}
        <View style={styles.streakCard}>
          <Text style={styles.streakEmoji}>{streak > 0 ? "🔥" : "✨"}</Text>
          <View>
            <Text style={styles.streakNum}>{streak}</Text>
            <Text style={styles.streakLabel}>sessions logged</Text>
          </View>
          <Text style={styles.streakMsg}>
            {streak === 0
              ? "Log a session to get started!"
              : streak < 5
              ? "Building momentum!"
              : "On a roll! Keep it up."}
          </Text>
        </View>

        {/* Exercise log cards */}
        <Text style={styles.sectionLabel}>Exercises</Text>
        {EXERCISES.map((ex) => {
          const last = getLastEntry(ex.id);
          return (
            <TouchableOpacity
              key={ex.id}
              style={styles.logCard}
              onPress={() => openModal(ex)}
              activeOpacity={0.8}
            >
              <View style={styles.logCardLeft}>
                <Text style={styles.logCardName}>{ex.name}</Text>
                {last ? (
                  <View style={styles.lastEntryRow}>
                    <Text style={styles.logCardMeta}>{last.date}</Text>
                    <View
                      style={[
                        styles.painPill,
                        { backgroundColor: `${painColor(last.painLevel)}22` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.painPillText,
                          { color: painColor(last.painLevel) },
                        ]}
                      >
                        Pain {last.painLevel}/10
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.logCardMeta}>No entries yet</Text>
                )}
              </View>
              <View style={styles.logCta}>
                <Text style={styles.logCtaText}>+ Log</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* History */}
        {allEntries.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>History</Text>
            {allEntries.map((entry, i) => (
              <View key={i} style={styles.historyItem}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyName}>{entry.exerciseName}</Text>
                  <Text style={styles.historyDate}>{entry.date}</Text>
                  {entry.notes ? (
                    <Text style={styles.historyNotes} numberOfLines={2}>
                      {entry.notes}
                    </Text>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.historyPainBadge,
                    { borderColor: painColor(entry.painLevel) },
                  ]}
                >
                  <Text
                    style={[
                      styles.historyPainNum,
                      { color: painColor(entry.painLevel) },
                    ]}
                  >
                    {entry.painLevel}
                  </Text>
                  <Text style={styles.historyPainLabel}>/10</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* AI form feedback from camera sessions */}
        {cameraSessions.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>AI Form Feedback</Text>
            {cameraSessions.map((session) => (
              <View key={session.id} style={styles.aiSessionCard}>
                <View style={styles.aiSessionHeader}>
                  <Text style={styles.historyName}>{session.exercise}</Text>
                  <Text style={styles.historyDate}>
                    {new Date(session.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>
                {session.feedback.map((note, i) => (
                  <Text key={i} style={styles.aiFeedbackNote}>
                    • {note}
                  </Text>
                ))}
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Log modal */}
      <Modal
        visible={modalExercise !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setModalExercise(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalExercise(null)}
        >
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{modalExercise?.name}</Text>
            <Text style={styles.modalDate}>{todayLabel()}</Text>

            <Text style={styles.modalLabel}>Pain Level</Text>
            <Text
              style={[styles.painNumber, { color: painColor(painLevel) }]}
            >
              {painLevel}
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={painLevel}
              onValueChange={setPainLevel}
              minimumTrackTintColor="#4F8EF7"
              maximumTrackTintColor="#333"
              thumbTintColor="#4F8EF7"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>No pain</Text>
              <Text style={styles.sliderLabel}>Severe</Text>
            </View>

            {/* Show previous pain for comparison */}
            {modalExercise && getLastEntry(modalExercise.id) && (
              <Text style={styles.previousPain}>
                Last session:{" "}
                {getLastEntry(modalExercise.id)?.painLevel}/10 pain
              </Text>
            )}

            <Text style={styles.modalLabel}>Notes</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="How did it feel? Any observations..."
              placeholderTextColor="#555"
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.saveBtn} onPress={saveEntry}>
              <Text style={styles.saveBtnText}>Save Entry</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0f0f0f" },
  scroll: { paddingBottom: 100 },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
  },
  streakCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    marginBottom: 24,
  },
  streakEmoji: { fontSize: 36 },
  streakNum: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 32,
  },
  streakLabel: { color: "#666", fontSize: 12, fontWeight: "600" },
  streakMsg: { flex: 1, color: "#888", fontSize: 13, lineHeight: 18 },
  sectionLabel: {
    color: "#555",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  logCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  logCardLeft: { flex: 1, gap: 6 },
  logCardName: { color: "#fff", fontSize: 16, fontWeight: "700" },
  lastEntryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  logCardMeta: { color: "#666", fontSize: 13 },
  painPill: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  painPillText: { fontSize: 12, fontWeight: "600" },
  logCta: {
    backgroundColor: "#0d1f3c",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#1e3a6e",
  },
  logCtaText: { color: "#4F8EF7", fontSize: 13, fontWeight: "700" },
  historyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#111",
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1e1e1e",
  },
  historyLeft: { flex: 1, gap: 3 },
  historyName: { color: "#ccc", fontSize: 14, fontWeight: "600" },
  historyDate: { color: "#555", fontSize: 12 },
  historyNotes: { color: "#444", fontSize: 12, marginTop: 2 },
  historyPainBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  historyPainNum: { fontSize: 18, fontWeight: "800" },
  historyPainLabel: { color: "#555", fontSize: 11 },
  aiSessionCard: {
    backgroundColor: "#111",
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1e1e1e",
    gap: 6,
  },
  aiSessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aiFeedbackNote: { color: "#888", fontSize: 13, lineHeight: 18 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 44,
    gap: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#444",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
  },
  modalDate: { color: "#666", fontSize: 13 },
  modalLabel: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 4,
  },
  painNumber: {
    fontSize: 56,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 64,
  },
  slider: { width: "100%", height: 40 },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -4,
  },
  sliderLabel: { color: "#666", fontSize: 12 },
  previousPain: {
    color: "#555",
    fontSize: 13,
    textAlign: "center",
    fontStyle: "italic",
  },
  notesInput: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    minHeight: 88,
  },
  saveBtn: {
    backgroundColor: "#4F8EF7",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
