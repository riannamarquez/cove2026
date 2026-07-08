import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function DisclaimerScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.logo}>cove.</Text>
      </View>

      <Text style={styles.disclaimer}>
        Cove provides AI-generated exercise suggestions based on information
        you provide. It is not a substitute for professional medical advice,
        diagnosis, or treatment. Always consult a licensed physical therapist
        or physician before starting any exercise program, especially if you
        are recovering from an injury or surgery. If you experience increased
        pain, stop immediately and seek professional care.
      </Text>

      <TouchableOpacity
        style={styles.continueBtn}
        onPress={() => router.push("/intake")}
      >
        <Text style={styles.continueBtnText}>I Understand, Continue →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    paddingHorizontal: 24,
    justifyContent: "center",
    gap: 40,
  },
  top: { alignItems: "center" },
  logo: {
    fontSize: 48,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -1,
  },
  disclaimer: {
    color: "#bbb",
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
  },
  continueBtn: {
    backgroundColor: "#4F8EF7",
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
  },
  continueBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
