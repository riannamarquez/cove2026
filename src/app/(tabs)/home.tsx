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
            <ActivityIndicator color="#4F8EF7" size="small" />
          ) : (
            <Text style={styles.streakText}>🔥 {streak} day streak</Text>
          )}
        </View>
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

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push("/(tabs)/profile")}
        >
          <Text style={styles.secondaryBtnText}>My Profile</Text>
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
  top: { alignItems: "center", gap: 12 },
  logo: {
    fontSize: 56,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -1,
  },
  tagline: { fontSize: 15, color: "#555" },
  streakBadge: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    minWidth: 120,
    alignItems: "center",
    marginTop: 4,
  },
  streakText: { color: "#fff", fontSize: 15, fontWeight: "700" },
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
