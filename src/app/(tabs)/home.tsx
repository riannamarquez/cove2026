import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.logo}>cove.</Text>
        <Text style={styles.tagline}>injury recovery, guided by AI</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push("/intake")}
        >
          <Text style={styles.primaryBtnText}>Create New Plan →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push("/(tabs)/pastPlans")}
        >
          <Text style={styles.secondaryBtnText}>View Past Plans</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    paddingHorizontal: 24,
    justifyContent: "center",
    gap: 48,
  },
  top: { alignItems: "center", gap: 8 },
  logo: {
    fontSize: 56,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -1,
  },
  tagline: { fontSize: 15, color: "#555" },
  actions: { gap: 14 },
  primaryBtn: {
    backgroundColor: "#4F8EF7",
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondaryBtn: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  secondaryBtnText: { color: "#aaa", fontSize: 16, fontWeight: "600" },
});
