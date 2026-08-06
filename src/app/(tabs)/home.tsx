import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { supabase } from "../../../.lib/supabase";

function calcStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sessionDays = new Set(
    dates.map((d) => {
      const day = new Date(d);
      day.setHours(0, 0, 0, 0);
      return day.getTime();
    })
  );

  let streak = 0;
  const cursor = new Date(today);
  while (sessionDays.has(cursor.getTime())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default function HomeScreen() {
  const router = useRouter();
  const [streak, setStreak] = useState(0);
  const [streakLoading, setStreakLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function loadStreak() {
        setStreakLoading(true);
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) { setStreak(0); return; }

          const { data } = await supabase
            .from("sessions")
            .select("date")
            .eq("user_id", user.id)
            .order("date", { ascending: false });

          if (!cancelled) {
            setStreak(calcStreak((data ?? []).map((r: { date: string }) => r.date)));
          }
        } catch {
          if (!cancelled) setStreak(0);
        } finally {
          if (!cancelled) setStreakLoading(false);
        }
      }

      loadStreak();
      return () => { cancelled = true; };
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.logo}>cove.</Text>
        <Text style={styles.tagline}>injury recovery, guided by AI</Text>

        <View style={styles.streakBadge}>
          {streakLoading ? (
            <ActivityIndicator color="#7bc67e" size="small" />
          ) : (
            <View style={styles.streakRow}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakNum}>{streak}</Text>
              <Text style={styles.streakSuffix}>day streak</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/disclaimer")}
        >
          <Text style={styles.actionCardText}>Create New Plan</Text>
          <Text style={styles.actionCardArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/(tabs)/pastPlans")}
        >
          <Text style={styles.actionCardText}>View Past Plans</Text>
          <Text style={styles.actionCardArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/(tabs)/profile")}
        >
          <Text style={styles.actionCardText}>My Profile</Text>
          <Text style={styles.actionCardArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a2e1a",
    paddingHorizontal: 24,
    justifyContent: "center",
    gap: 48,
  },
  top: { alignItems: "center", gap: 12 },
  logo: {
    fontSize: 56,
    fontWeight: "800",
    color: "#7bc67e",
    letterSpacing: -1,
  },
  tagline: { fontSize: 15, color: "#8fa88f" },
  streakBadge: {
    backgroundColor: "#243324",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#2d3f2d",
    minWidth: 120,
    alignItems: "center",
    marginTop: 4,
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  streakEmoji: { fontSize: 15, color: "#f5a623" },
  streakNum: { color: "#fff", fontSize: 15, fontWeight: "800" },
  streakSuffix: { color: "#8fa88f", fontSize: 13, fontWeight: "600" },
  actions: { gap: 14 },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#243324",
    borderWidth: 1,
    borderColor: "#2d3f2d",
    borderRadius: 16,
    padding: 20,
  },
  actionCardText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  actionCardArrow: { color: "#7bc67e", fontSize: 18, fontWeight: "700" },
});
