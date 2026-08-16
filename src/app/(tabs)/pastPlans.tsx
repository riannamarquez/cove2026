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

type PlanRow = {
  id: string;
  exercises: string;
  pain_level: number;
  created_at: string;
  plan_data: object;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function PastPlansScreen() {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        setLoading(true);
        setError("");
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            setError("Not signed in.");
            return;
          }
          const { data, error: dbError } = await supabase
            .from("plans")
            .select("id, exercises, pain_level, created_at, plan_data")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (dbError) throw dbError;
          if (!cancelled) setPlans(data ?? []);
        } catch (e: unknown) {
          if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load plans.");
        } finally {
          if (!cancelled) setLoading(false);
        }
      }

      load();
      return () => { cancelled = true; };
    }, [])
  );

  const openPlan = (row: PlanRow) => {
    router.push({ pathname: "/(tabs)/plan", params: { plan: JSON.stringify(row.plan_data) } });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Past Plans</Text>
        <Text style={styles.subtitle}>Your previous recovery programs</Text>
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color="#7bc67e" size="large" />
        </View>
      )}

      {!loading && error !== "" && (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && error === "" && plans.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No plans yet. Create your first one!</Text>
        </View>
      )}

      {!loading && plans.length > 0 && (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {plans.map((row) => (
            <TouchableOpacity key={row.id} style={styles.card} onPress={() => openPlan(row)}>
              <View style={styles.cardTop}>
                <Text style={styles.bodyArea}>{row.exercises}</Text>
                <Text style={styles.date}>{formatDate(row.created_at)}</Text>
              </View>
              <View style={styles.painRow}>
                <Text style={styles.painLabel}>Pain level</Text>
                <View style={styles.painBadge}>
                  <Text style={styles.painValue}>{row.pain_level}</Text>
                  <Text style={styles.painMax}>/10</Text>
                </View>
              </View>
              <Text style={styles.tapHint}>Tap to view →</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a2e1a" },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  title: { fontSize: 28, fontWeight: "800", color: "#fff", marginBottom: 4, fontFamily: "InstrumentSerif_400Regular" },
  subtitle: { fontSize: 14, color: "#8fa88f", fontFamily: "InstrumentSerif_400Regular" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  errorText: { color: "#e05252", fontSize: 15, textAlign: "center", fontFamily: "InstrumentSerif_400Regular" },
  emptyText: { color: "#6b856b", fontSize: 15, textAlign: "center", fontFamily: "InstrumentSerif_400Regular" },
  list: { paddingHorizontal: 20, paddingBottom: 100, gap: 14 },
  card: {
    backgroundColor: "#243324",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2d3f2d",
    gap: 10,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  bodyArea: { color: "#fff", fontSize: 16, fontWeight: "700", flex: 1, marginRight: 12, fontFamily: "InstrumentSerif_400Regular" },
  date: { color: "#6b856b", fontSize: 13, fontFamily: "InstrumentSerif_400Regular" },
  painRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  painLabel: { color: "#8fa88f", fontSize: 13, fontFamily: "InstrumentSerif_400Regular" },
  painBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: "#1e3d1e",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#2d3f2d",
    gap: 2,
  },
  painValue: { color: "#7bc67e", fontSize: 16, fontWeight: "800", fontFamily: "InstrumentSerif_400Regular" },
  painMax: { color: "#7bc67e", fontSize: 11, opacity: 0.7, fontFamily: "InstrumentSerif_400Regular" },
  tapHint: { color: "#6b856b", fontSize: 12, marginTop: 2, fontFamily: "InstrumentSerif_400Regular" },
});
