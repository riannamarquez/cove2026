import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { supabase } from "../../../.lib/supabase";

type ProfileData = {
  name: string;
  age: number | null;
  fitness_level: string;
  recent_body_area: string | null;
  recent_pain_level: number | null;
};

const FITNESS_LABELS: Record<string, string> = {
  inactive: "Inactive",
  moderate: "Moderately Active",
  active: "Highly Active",
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || "—"}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        setLoading(true);
        setError("");
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) { setError("Not signed in."); return; }

          const [userRes, planRes] = await Promise.all([
            supabase
              .from("users")
              .select("name, age, fitness_level")
              .eq("id", user.id)
              .single(),
            supabase
              .from("plans")
              .select("exercises, pain_level")
              .eq("user_id", user.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);

          if (userRes.error) throw userRes.error;

          if (!cancelled) {
            setProfile({
              name: userRes.data?.name ?? "",
              age: userRes.data?.age ?? null,
              fitness_level: userRes.data?.fitness_level ?? "",
              recent_body_area: planRes.data?.exercises ?? null,
              recent_pain_level: planRes.data?.pain_level ?? null,
            });
          }
        } catch (e: unknown) {
          if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load profile.");
        } finally {
          if (!cancelled) setLoading(false);
        }
      }

      load();
      return () => { cancelled = true; };
    }, [])
  );

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      router.replace("/login");
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/home")} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back to Home</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Profile</Text>
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color="#4F8EF7" size="large" />
        </View>
      )}

      {!loading && error !== "" && (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && error === "" && profile && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <InfoRow label="Name" value={profile.name} />
            <View style={styles.divider} />
            <InfoRow label="Age" value={profile.age != null ? String(profile.age) : "—"} />
            <View style={styles.divider} />
            <InfoRow
              label="Fitness Level"
              value={FITNESS_LABELS[profile.fitness_level] ?? profile.fitness_level}
            />
            <View style={styles.divider} />
            <InfoRow
              label="Most Recent Area"
              value={profile.recent_body_area ?? "No plans yet"}
            />
            <View style={styles.divider} />
            <InfoRow
              label="Most Recent Pain"
              value={profile.recent_pain_level != null ? `${profile.recent_pain_level} / 10` : "No plans yet"}
            />
          </View>

          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={handleSignOut}
            disabled={signingOut}
          >
            <Text style={styles.signOutBtnText}>
              {signingOut ? "Signing out…" : "Sign Out"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  backBtn: { alignSelf: "flex-start", marginBottom: 16 },
  backBtnText: { color: "#4F8EF7", fontSize: 14, fontWeight: "600" },
  title: { fontSize: 28, fontWeight: "800", color: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  errorText: { color: "#ff6b6b", fontSize: 15, textAlign: "center" },
  scroll: { paddingHorizontal: 24, paddingBottom: 60, gap: 20 },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  rowLabel: { color: "#666", fontSize: 14, fontWeight: "600" },
  rowValue: { color: "#fff", fontSize: 14, fontWeight: "600", flexShrink: 1, textAlign: "right", marginLeft: 12 },
  divider: { height: 1, backgroundColor: "#2a2a2a", marginHorizontal: 20 },
  signOutBtn: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3a1a1a",
  },
  signOutBtnText: { color: "#ff6b6b", fontSize: 16, fontWeight: "700" },
});
