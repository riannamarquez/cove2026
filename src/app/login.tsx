import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Logo from "../../assets/images/cove_logo_transparent.png";
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
          <Image source={Logo} style={styles.logoImage} resizeMode="contain" />
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
            placeholderTextColor="#4a5e4a"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#4a5e4a"
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
            <Text
              style={[
                styles.submitBtnText,
                (!isValid || loading) && styles.submitBtnTextDisabled,
              ]}
            >
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
  container: { flex: 1, backgroundColor: "#1a2e1a" },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
    justifyContent: "flex-start",
    gap: 40,
  },
  top: { alignItems: "center", gap: 12, marginBottom: 8 },
  logoImage: {
    width: 200,
    height: 200,
    alignSelf: "center",
  },
  logo: {
    fontSize: 48,
    fontWeight: "800",
    color: "#7bc67e",
    letterSpacing: -1,
    fontFamily: "InstrumentSerif_400Regular",
  },
  tagline: { fontSize: 14, color: "#8fa88f", fontFamily: "InstrumentSerif_400Regular" },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: "#243324",
    borderRadius: 12,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  toggleBtnActive: { backgroundColor: "#2d3f2d" },
  toggleText: { color: "#8fa88f", fontWeight: "600", fontSize: 15, fontFamily: "InstrumentSerif_400Regular" },
  toggleTextActive: { color: "#fff" },
  form: { gap: 12 },
  input: {
    backgroundColor: "#243324",
    borderRadius: 14,
    padding: 18,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#2d3f2d",
  },
  errorBox: {
    backgroundColor: "#3d1f1f",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e05252",
  },
  errorText: { color: "#e05252", fontSize: 14, fontFamily: "InstrumentSerif_400Regular" },
  submitBtn: {
    backgroundColor: "#7bc67e",
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  submitBtnDisabled: { backgroundColor: "#2d3f2d" },
  submitBtnText: { color: "#1a2e1a", fontSize: 16, fontWeight: "700", fontFamily: "InstrumentSerif_400Regular" },
  submitBtnTextDisabled: { color: "#4a5e4a" },
  disclaimer: {
    color: "#6b856b",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    fontFamily: "InstrumentSerif_400Regular",
  },
});
