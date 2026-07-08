import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { supabase } from "../../.lib/supabase";

async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error;
}

async function signUp(email: string, password: string) {
  const { error } = await supabase.auth.signUp({email, password});
  if (error) throw error;
}

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid = email.trim().length > 0 && password.length >= 6;

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      if (mode === "signin") {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
      }
      router.replace("/disclaimer");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        <View style={styles.top}>
          <Text style={styles.logo}>cove.</Text>
          <Text style={styles.tagline}>injury recovery, guided by AI</Text>
        </View>

        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === "signin" && styles.toggleBtnActive]}
            onPress={() => { setMode("signin"); setError(""); }}
          >
            <Text style={[styles.toggleText, mode === "signin" && styles.toggleTextActive]}>
              Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === "signup" && styles.toggleBtnActive]}
            onPress={() => { setMode("signup"); setError(""); }}
          >
            <Text style={[styles.toggleText, mode === "signup" && styles.toggleTextActive]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#555"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#555"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error !== "" && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, (!isValid || loading) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!isValid || loading}
          >
            <Text style={styles.submitBtnText}>
              {loading ? "Please wait…" : mode === "signin" ? "Sign In →" : "Create Account →"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          By continuing you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    gap: 32,
  },
  top: { alignItems: "center", gap: 6 },
  logo: {
    fontSize: 48,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -1,
  },
  tagline: { fontSize: 14, color: "#555" },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  toggleBtnActive: { backgroundColor: "#2a2a2a" },
  toggleText: { color: "#555", fontWeight: "600", fontSize: 15 },
  toggleTextActive: { color: "#fff" },
  form: { gap: 12 },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    padding: 18,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  errorBox: {
    backgroundColor: "#2a0d0d",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#6b1a1a",
  },
  errorText: { color: "#ff6b6b", fontSize: 14 },
  submitBtn: {
    backgroundColor: "#4F8EF7",
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  submitBtnDisabled: { backgroundColor: "#1a1a1a" },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  disclaimer: {
    color: "#333",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});
