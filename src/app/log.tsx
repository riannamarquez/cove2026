import { StyleSheet, Text, View } from "react-native";

export default function LogScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progress Log</Text>
      <Text style={styles.subtitle}>Your sessions will be tracked here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#888",
  },
});
