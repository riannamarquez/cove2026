import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Exercise = {
  name: string;
  sets: number;
  reps: number;
  body_area: string;
  instructions: string;
  rationale: string;
  gif_url?: string | null;
};

const CARD_HEIGHT = 240;

function FlipCard({ exercise }: { exercise: Exercise }) {
  const rotation = useSharedValue(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${interpolate(rotation.value, [0, 1], [0, 180])}deg` },
    ],
    opacity: interpolate(rotation.value, [0, 0.5, 0.5, 1], [1, 1, 0, 0]),
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${interpolate(rotation.value, [0, 1], [180, 360])}deg` },
    ],
    opacity: interpolate(rotation.value, [0, 0.5, 0.5, 1], [0, 0, 1, 1]),
  }));

  const flip = () => {
    const next = isFlipped ? 0 : 1;
    rotation.value = withTiming(next, { duration: 400 });
    setIsFlipped((prev) => !prev);
  };

  return (
    <>
      <View style={{ height: CARD_HEIGHT, marginBottom: 16 }}>
        {/* Front face */}
        <Animated.View
          style={[StyleSheet.absoluteFillObject, styles.card, frontStyle]}
          pointerEvents={isFlipped ? "none" : "auto"}
        >
          <TouchableOpacity
            style={styles.cardInner}
            onPress={flip}
            activeOpacity={0.9}
          >
            {exercise.gif_url ? (
              <Image
                source={{ uri: exercise.gif_url }}
                style={styles.exerciseGif}
                resizeMode="contain"
              />
            ) : null}
            <View style={styles.muscleTag}>
              <Text style={styles.muscleTagText}>{exercise.body_area}</Text>
            </View>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <Text style={styles.flipHint}>Tap to see plan →</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Back face */}
        <Animated.View
          style={[StyleSheet.absoluteFillObject, styles.card, styles.cardBack, backStyle]}
          pointerEvents={isFlipped ? "auto" : "none"}
        >
          {/* Top half: GIF area */}
          <TouchableOpacity style={styles.gifArea} onPress={flip} activeOpacity={0.9}>
            <Text style={styles.gifIcon}>▶</Text>
            <Text style={styles.gifLabel}>Exercise Preview</Text>
            <Text style={styles.gifSub}>Tap to flip back</Text>
          </TouchableOpacity>

          {/* Bottom half: rep plan */}
          <View style={styles.repArea}>
            <View style={styles.repRow}>
              <View style={styles.repStat}>
                <Text style={styles.repStatNum}>{exercise.sets}</Text>
                <Text style={styles.repStatLabel}>sets</Text>
              </View>
              <View style={styles.repDivider} />
              <View style={styles.repStat}>
                <Text style={styles.repStatNum}>{exercise.reps}</Text>
                <Text style={styles.repStatLabel}>reps</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.instructionsBtn}
              onPress={() => setShowInstructions(true)}
            >
              <Text style={styles.instructionsBtnText}>View Instructions</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

      {/* Instructions modal */}
      <Modal
        visible={showInstructions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInstructions(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowInstructions(false)}
        >
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{exercise.name}</Text>
            {exercise.gif_url ? (
              <Image
                source={{ uri: exercise.gif_url }}
                style={{ width: '100%', height: 180, borderRadius: 14 }}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.modalGif}>
                <Text style={styles.modalGifIcon}>🎬</Text>
                <Text style={styles.modalGifText}>GIF coming soon</Text>
              </View>
            )}
            <Text style={styles.modalInstructions}>{exercise.instructions}</Text>
            <Text style={styles.modalRationale}>Why this exercise: {exercise.rationale}</Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowInstructions(false)}
            >
              <Text style={styles.modalCloseBtnText}>Got it</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export default function PlanScreen() {
  const router = useRouter();
  const { plan } = useLocalSearchParams<{ plan: string }>();

  const parsed = plan ? JSON.parse(plan) : null;
  console.log('plan data:', parsed);
  const exercises: Exercise[] = parsed?.exercises ?? [];

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/home")} style={styles.backHomeBtn}>
          <Text style={styles.backHomeBtnText}>← Back to Home</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Exercise Plan</Text>
        <Text style={styles.headerSub}>Tap a card to see your reps</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {exercises.map((ex, i) => (
          <FlipCard key={i} exercise={ex} />
        ))}
        <Text style={styles.planDisclaimer}>
          This plan was generated by AI and is not a substitute for
          professional physical therapy. If pain increases, stop and consult
          a licensed PT.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#1a2e1a",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
    fontFamily: "InstrumentSerif_400Regular",
  },
  headerSub: {
    fontSize: 14,
    color: "#8fa88f",
    fontFamily: "InstrumentSerif_400Regular",
  },
  backHomeBtn: {
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  backHomeBtnText: {
    color: "#7bc67e",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "InstrumentSerif_400Regular",
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  planDisclaimer: {
    fontSize: 12,
    color: "#4a5e4a",
    textAlign: "center",
    padding: 16,
    fontFamily: "InstrumentSerif_400Regular",
  },
  card: {
    borderRadius: 16,
    backgroundColor: "#243324",
    borderWidth: 1,
    borderColor: "#2d3f2d",
    overflow: "hidden",
  },
  cardInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 12,
  },
  cardBack: {
    backgroundColor: "#1a2e1a",
  },
  muscleTag: {
    backgroundColor: "#1e3d1e",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#2d3f2d",
  },
  muscleTagText: {
    color: "#7bc67e",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: "InstrumentSerif_400Regular",
  },
  exerciseGif: {
    width: "100%",
    height: 200,
  },
  exerciseName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    fontFamily: "InstrumentSerif_400Regular",
  },
  flipHint: {
    fontSize: 13,
    color: "#6b856b",
    marginTop: 4,
    fontFamily: "InstrumentSerif_400Regular",
  },
  gifArea: {
    height: "50%",
    backgroundColor: "#1a2e1a",
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#2d3f2d",
    gap: 4,
  },
  gifIcon: {
    fontSize: 28,
    color: "#2d3f2d",
    fontFamily: "InstrumentSerif_400Regular",
  },
  gifLabel: {
    color: "#6b856b",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "InstrumentSerif_400Regular",
  },
  gifSub: {
    color: "#4a5e4a",
    fontSize: 11,
    fontFamily: "InstrumentSerif_400Regular",
  },
  repArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
    justifyContent: "space-around",
  },
  repRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  repStat: {
    alignItems: "center",
    flex: 1,
  },
  repStatNum: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    fontFamily: "InstrumentSerif_400Regular",
  },
  repStatLabel: {
    fontSize: 11,
    color: "#8fa88f",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
    fontFamily: "InstrumentSerif_400Regular",
  },
  repDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#2d3f2d",
  },
  instructionsBtn: {
    backgroundColor: "#1e3d1e",
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2d3f2d",
    marginTop: 4,
  },
  instructionsBtnText: {
    color: "#7bc67e",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "InstrumentSerif_400Regular",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#243324",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#3d4f3d",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    fontFamily: "InstrumentSerif_400Regular",
  },
  modalGif: {
    height: 180,
    backgroundColor: "#1a2e1a",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#2d3f2d",
  },
  modalGifIcon: { fontSize: 36, fontFamily: "InstrumentSerif_400Regular" },
  modalGifText: { color: "#6b856b", fontSize: 14, fontFamily: "InstrumentSerif_400Regular" },
  modalInstructions: {
    color: "#bbb",
    fontSize: 15,
    lineHeight: 24,
    fontFamily: "InstrumentSerif_400Regular",
  },
  modalRationale: {
    color: "#6b856b",
    fontSize: 13,
    lineHeight: 20,
    fontStyle: "italic",
    fontFamily: "InstrumentSerif_400Regular_Italic",
  },
  modalCloseBtn: {
    backgroundColor: "#7bc67e",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalCloseBtnText: {
    color: "#1a2e1a",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "InstrumentSerif_400Regular",
  },
});
