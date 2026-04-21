// app/(auth)/register.tsx
import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput as RNTextInput,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

export default function RegisterScreen() {
  const { signUpWithEmail, signInWithGoogle, isLoading } = useAuth();
  const { theme } = useTheme();

  const scrollViewRef = useRef<ScrollView>(null);
  const nameInputRef = useRef<RNTextInput>(null);
  const emailInputRef = useRef<RNTextInput>(null);
  const passwordInputRef = useRef<RNTextInput>(null);
  const confirmPasswordInputRef = useRef<RNTextInput>(null);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    displayName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = useCallback((): boolean => {
    const newErrors: typeof errors = {};
    if (!displayName.trim()) newErrors.displayName = "Name is required.";
    else if (displayName.trim().length < 2)
      newErrors.displayName = "Name must be at least 2 characters.";
    if (!email.trim()) newErrors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = "Enter a valid email.";
    if (!password) newErrors.password = "Password is required.";
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters.";
    if (!confirmPassword)
      newErrors.confirmPassword = "Please confirm your password.";
    else if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [displayName, email, password, confirmPassword]);

  const handleRegister = useCallback(async () => {
    if (!validate()) return;
    Keyboard.dismiss();
    const result = await signUpWithEmail(email, password, displayName);
    if (result.success) {
      router.replace("/(app)/home");
    } else {
      Alert.alert("Registration Failed", result.error);
    }
  }, [displayName, email, password, validate, signUpWithEmail]);

  const handleGoogle = useCallback(async () => {
    Keyboard.dismiss();
    const result = await signInWithGoogle();
    if (result.success) {
      router.replace("/(app)/home");
    } else if (result.error && result.error !== "Sign in cancelled.") {
      Alert.alert("Google Sign In Failed", result.error);
    }
  }, [signInWithGoogle]);

  const handleFocus = (ref: React.RefObject<RNTextInput>) => {
    setTimeout(() => {
      ref.current?.focus();
    }, 100);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.container,
            { backgroundColor: theme.background },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.logo}>🔴</Text>
            <Text style={[styles.title, { color: theme.primary }]}>RedDot</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Create your safe space
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.formTitle, { color: theme.text }]}>
              Create account
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Full Name
              </Text>
              <View
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: theme.surface,
                    borderColor: errors.displayName
                      ? theme.danger
                      : theme.border,
                  },
                ]}
              >
                <TextInput
                  ref={nameInputRef}
                  style={[styles.inputFlex, { color: theme.text }]}
                  value={displayName}
                  onChangeText={(t) => {
                    setDisplayName(t);
                    setErrors((e) => ({ ...e, displayName: undefined }));
                  }}
                  placeholder="Your name"
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isLoading}
                  returnKeyType="next"
                  onSubmitEditing={() => handleFocus(emailInputRef)}
                />
              </View>
              {errors.displayName && (
                <Text style={[styles.fieldError, { color: theme.danger }]}>
                  {errors.displayName}
                </Text>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Email
              </Text>
              <View
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: theme.surface,
                    borderColor: errors.email ? theme.danger : theme.border,
                  },
                ]}
              >
                <TextInput
                  ref={emailInputRef}
                  style={[styles.inputFlex, { color: theme.text }]}
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    setErrors((e) => ({ ...e, email: undefined }));
                  }}
                  placeholder="your@email.com"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  returnKeyType="next"
                  onSubmitEditing={() => handleFocus(passwordInputRef)}
                />
              </View>
              {errors.email && (
                <Text style={[styles.fieldError, { color: theme.danger }]}>
                  {errors.email}
                </Text>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Password
              </Text>
              <View
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: theme.surface,
                    borderColor: errors.password ? theme.danger : theme.border,
                  },
                ]}
              >
                <TextInput
                  ref={passwordInputRef}
                  style={[styles.inputFlex, { color: theme.text }]}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    setErrors((e) => ({ ...e, password: undefined }));
                  }}
                  placeholder="At least 6 characters"
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  returnKeyType="next"
                  onSubmitEditing={() => handleFocus(confirmPasswordInputRef)}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeButton}
                >
                  <Text style={{ fontSize: 18 }}>
                    {showPassword ? "🙈" : "👁️"}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={[styles.fieldError, { color: theme.danger }]}>
                  {errors.password}
                </Text>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Confirm Password
              </Text>
              <View
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: theme.surface,
                    borderColor: errors.confirmPassword
                      ? theme.danger
                      : theme.border,
                  },
                ]}
              >
                <TextInput
                  ref={confirmPasswordInputRef}
                  style={[styles.inputFlex, { color: theme.text }]}
                  value={confirmPassword}
                  onChangeText={(t) => {
                    setConfirmPassword(t);
                    setErrors((e) => ({ ...e, confirmPassword: undefined }));
                  }}
                  placeholder="Re-enter password"
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />
              </View>
              {errors.confirmPassword && (
                <Text style={[styles.fieldError, { color: theme.danger }]}>
                  {errors.confirmPassword}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor: theme.primary,
                  opacity: isLoading ? 0.7 : 1,
                },
              ]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View
                style={[styles.dividerLine, { backgroundColor: theme.border }]}
              />
              <Text style={[styles.dividerText, { color: theme.textMuted }]}>
                or
              </Text>
              <View
                style={[styles.dividerLine, { backgroundColor: theme.border }]}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.googleButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={handleGoogle}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={[styles.googleText, { color: theme.text }]}>
                Continue with Google
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              Already have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
              <Text style={[styles.footerLink, { color: theme.primary }]}>
                Sign in
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.safetyNote, { color: theme.textMuted }]}>
            🛡️ Your data is encrypted and never shared
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
    justifyContent: "center",
    gap: 24,
  },
  header: { alignItems: "center", gap: 6 },
  logo: { fontSize: 56 },
  title: { fontSize: 36, fontWeight: "800", letterSpacing: 1 },
  subtitle: { fontSize: 14, letterSpacing: 0.5 },
  form: { gap: 14 },
  formTitle: { fontSize: 22, fontWeight: "700", marginBottom: 4 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600", letterSpacing: 0.3 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputFlex: { flex: 1, paddingVertical: 14, fontSize: 15 },
  eyeButton: { padding: 8 },
  fieldError: { fontSize: 12, marginTop: 2 },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 10,
  },
  googleIcon: { fontSize: 18, fontWeight: "800", color: "#4285F4" },
  googleText: { fontSize: 15, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center" },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: "700" },
  safetyNote: { fontSize: 12, textAlign: "center" },
});
