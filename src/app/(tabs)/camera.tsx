import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const EXERCISES = [
  "Straight Leg Raises",
  "Quad Sets",
  "Terminal Knee Extension",
];

const MOCK_FEEDBACKS = [
  "Your back looks flat — great core position! Try raising the leg a bit higher for full range of motion.",
  "Watch your hip — it's tilting slightly on the raise. Keep both hips level on the mat.",
  "Good alignment overall. Slow down the lowering phase for more eccentric control.",
];

type Message = {
  role: "ai" | "user";
  text: string;
};

export default function CameraScreen() {
  const [selectedExercise, setSelectedExercise] = useState(0);
  const [feedbackIndex, setFeedbackIndex] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: MOCK_FEEDBACKS[0] },
  ]);
  const [inputText, setInputText] = useState("");

  const captureFeedback = () => {
    const next = (feedbackIndex + 1) % MOCK_FEEDBACKS.length;
    setFeedbackIndex(next);
    setMessages((prev) => [
      ...prev,
      { role: "ai", text: MOCK_FEEDBACKS[next] },
    ]);
  };

  const sendMessage = () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText("");
    setMessages((prev) => [
      ...prev,
      { role: "user", text },
      {
        role: "ai",
        text: "Good question! Focus on the muscle engagement rather than speed — quality reps matter more than quantity here.",
      },
    ]);
  };

  const latestFeedback = messages.filter((m) => m.role === "ai").slice(-1)[0]?.text ?? "";

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Form Coach</Text>
        <Text style={styles.headerSub}>Get real-time AI feedback on your form</Text>
      </View>

      {/* Exercise selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.selectorScroll}
        contentContainerStyle={styles.selectorContent}
      >
        {EXERCISES.map((ex, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.selectorChip,
              selectedExercise === i && styles.selectorChipActive,
            ]}
            onPress={() => setSelectedExercise(i)}
          >
            <Text
              style={[
                styles.selectorChipText,
                selectedExercise === i && styles.selectorChipTextActive,
              ]}
              numberOfLines={1}
            >
              {ex}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Camera view placeholder */}
      <View style={styles.cameraContainer}>
        <View style={styles.cameraPlaceholder}>
          <Text style={styles.cameraIcon}>📷</Text>
          <Text style={styles.cameraText}>Camera Feed</Text>
          <Text style={styles.cameraSubtext}>
            Install expo-camera to enable live feed
          </Text>
        </View>
        {/* Corner guides */}
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
      </View>

      {/* Capture button */}
      <View style={styles.captureRow}>
        <TouchableOpacity style={styles.captureBtn} onPress={captureFeedback}>
          <View style={styles.captureInner} />
        </TouchableOpacity>
      </View>

      {/* Feedback bar / Chat */}
      {isChatOpen ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.chatContainer}
        >
          <View style={styles.chatHeader}>
            <View style={styles.chatHandle} />
            <View style={styles.chatHeaderRow}>
              <Text style={styles.chatHeaderTitle}>AI Feedback</Text>
              <TouchableOpacity onPress={() => setIsChatOpen(false)}>
                <Text style={styles.chatCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView
            style={styles.chatMessages}
            contentContainerStyle={styles.chatMessagesContent}
          >
            {messages.map((msg, i) => (
              <View
                key={i}
                style={[
                  styles.bubble,
                  msg.role === "user" ? styles.userBubble : styles.aiBubble,
                ]}
              >
                {msg.role === "ai" && (
                  <Text style={styles.bubbleRole}>AI</Text>
                )}
                <Text
                  style={[
                    styles.bubbleText,
                    msg.role === "user" && styles.userBubbleText,
                  ]}
                >
                  {msg.text}
                </Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.chatInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask a question..."
              placeholderTextColor="#555"
              multiline
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={sendMessage}
              disabled={!inputText.trim()}
            >
              <Text style={styles.sendBtnText}>↑</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <TouchableOpacity style={styles.feedbackBar} onPress={() => setIsChatOpen(true)}>
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
          <Text style={styles.feedbackBarText} numberOfLines={1}>
            {latestFeedback}
          </Text>
          <Text style={styles.expandHint}>↑ expand</Text>
        </TouchableOpacity>
      )}
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
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    color: "#666",
  },
  selectorScroll: {
    flexGrow: 0,
    marginBottom: 12,
  },
  selectorContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  selectorChip: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  selectorChipActive: {
    backgroundColor: "#0d1f3c",
    borderColor: "#4F8EF7",
  },
  selectorChipText: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
  },
  selectorChipTextActive: {
    color: "#4F8EF7",
  },
  cameraContainer: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#050505",
    borderWidth: 1,
    borderColor: "#1e1e1e",
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  cameraIcon: { fontSize: 40 },
  cameraText: { color: "#444", fontSize: 16, fontWeight: "600" },
  cameraSubtext: { color: "#2a2a2a", fontSize: 12, textAlign: "center" },
  corner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: "#4F8EF7",
  },
  cornerTL: {
    top: 12,
    left: 12,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 12,
    right: 12,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 12,
    left: 12,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 12,
    right: 12,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 4,
  },
  captureRow: {
    alignItems: "center",
    paddingVertical: 16,
  },
  captureBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  captureInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff",
  },
  feedbackBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    marginHorizontal: 20,
    marginBottom: 80,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 10,
  },
  aiBadge: {
    backgroundColor: "#0d1f3c",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#1e3a6e",
  },
  aiBadgeText: {
    color: "#4F8EF7",
    fontSize: 11,
    fontWeight: "700",
  },
  feedbackBarText: {
    flex: 1,
    color: "#ccc",
    fontSize: 13,
  },
  expandHint: {
    color: "#4F8EF7",
    fontSize: 12,
    fontWeight: "600",
  },
  chatContainer: {
    backgroundColor: "#141414",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "55%",
    borderTopWidth: 1,
    borderColor: "#2a2a2a",
  },
  chatHeader: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  chatHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 10,
  },
  chatHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatHeaderTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  chatCloseText: {
    color: "#666",
    fontSize: 18,
  },
  chatMessages: {
    flex: 1,
  },
  chatMessagesContent: {
    padding: 16,
    gap: 10,
  },
  bubble: {
    maxWidth: "85%",
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#1e1e1e",
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#1e3a6e",
  },
  bubbleRole: {
    color: "#4F8EF7",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bubbleText: {
    color: "#ccc",
    fontSize: 14,
    lineHeight: 20,
  },
  userBubbleText: {
    color: "#fff",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4F8EF7",
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    backgroundColor: "#1e1e1e",
  },
  sendBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
