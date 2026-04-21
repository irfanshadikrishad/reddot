import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Vibration,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useAppLock } from "@/contexts/AppLockContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getDecoyScreen } from "@/services/secureStorage";
import { DecoyScreenType } from "@/types";

interface Props {
  children: React.ReactNode;
}

export function AppLockGate({ children }: Props) {
  const { isLocked, isCheckingLock, isFakeMode, decoyScreen } = useAppLock();

  if (isCheckingLock) {
    return <LoadingScreen />;
  }

  if (isLocked) {
    return <LockScreen />;
  }

  // If fake mode activated, show decoy screen
  if (isFakeMode) {
    return <DecoyRouter screen={decoyScreen} />;
  }

  return <>{children}</>;
}

// ─── Loading ──────────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <View style={loadingStyles.container}>
      <Text style={loadingStyles.logo}>🔴</Text>
      <ActivityIndicator
        color="#C0392B"
        size="large"
        style={{ marginTop: 24 }}
      />
    </View>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { fontSize: 64 },
});

// ─── Lock Screen ──────────────────────────────────────────────────────────────

function LockScreen() {
  const {
    unlockWithBiometric,
    unlockWithPin,
    hasBiometric,
    isPinLockedOut,
    pinLockoutRemainingMs,
    lockReason,
  } = useAppLock();
  const { theme } = useTheme();

  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Auto-trigger biometric on mount
  useEffect(() => {
    if (hasBiometric) {
      handleBiometric();
    }
  }, [hasBiometric]);

  const handleBiometric = useCallback(async () => {
    setIsLoading(true);
    const result = await unlockWithBiometric();
    setIsLoading(false);
    if (!result.success && result.error) {
      setError(result.error);
    }
  }, [unlockWithBiometric]);

  const handlePinSubmit = useCallback(async () => {
    if (pin.length < 4) {
      setError("PIN must be at least 4 digits.");
      return;
    }
    setIsLoading(true);
    const result = await unlockWithPin(pin);
    setIsLoading(false);

    if (result.success) {
      setPin("");
      setError("");
    } else {
      Vibration.vibrate(400);
      setError(result.error ?? "Incorrect PIN.");
      setPin("");
    }
  }, [pin, unlockWithPin]);

  const handlePinChange = useCallback(
    (text: string) => {
      const digits = text.replace(/\D/g, "").slice(0, 6);
      setPin(digits);
      if (error) setError("");
      // Auto-submit at 6 digits
      if (digits.length === 6) {
        setTimeout(() => unlockWithPin(digits), 100);
      }
    },
    [error, unlockWithPin],
  );

  const formatLockoutTime = (ms: number): string => {
    const totalSeconds = Math.ceil(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const lockReasonText = {
    startup: "Enter your PIN to continue",
    background: "App locked due to backgrounding",
    inactivity: "App locked due to inactivity",
    manual: "App is locked",
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.lockContainer,
          { backgroundColor: theme.background },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>🔴</Text>
          <Text style={[styles.appName, { color: theme.primary }]}>RedDot</Text>
          <Text style={[styles.tagline, { color: theme.textMuted }]}>
            Safe. Private. Always.
          </Text>
        </View>

        {/* Lock reason */}
        <Text style={[styles.lockReason, { color: theme.textSecondary }]}>
          {lockReasonText[lockReason ?? "startup"]}
        </Text>

        {/* PIN input */}
        {!isPinLockedOut ? (
          <View style={styles.pinSection}>
            <View
              style={[
                styles.pinInputContainer,
                {
                  borderColor: error ? theme.danger : theme.border,
                  backgroundColor: theme.surface,
                },
              ]}
            >
              <TextInput
                style={[styles.pinInput, { color: theme.text }]}
                value={pin}
                onChangeText={handlePinChange}
                placeholder="Enter PIN"
                placeholderTextColor={theme.textMuted}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
                autoFocus={!hasBiometric}
                editable={!isLoading}
              />
            </View>

            {/* PIN dots indicator */}
            <View style={styles.pinDots}>
              {Array.from({ length: Math.max(pin.length, 4) }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.pinDot,
                    {
                      backgroundColor:
                        i < pin.length ? theme.primary : theme.border,
                    },
                  ]}
                />
              ))}
            </View>

            {error ? (
              <Text style={[styles.errorText, { color: theme.danger }]}>
                {error}
              </Text>
            ) : null}

            <TouchableOpacity
              style={[
                styles.unlockButton,
                {
                  backgroundColor:
                    pin.length >= 4 ? theme.primary : theme.border,
                  opacity: isLoading ? 0.7 : 1,
                },
              ]}
              onPress={handlePinSubmit}
              disabled={pin.length < 4 || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.unlockButtonText}>Unlock</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.lockoutContainer}>
            <Text style={[styles.lockoutIcon]}>🔒</Text>
            <Text style={[styles.lockoutTitle, { color: theme.danger }]}>
              Too Many Attempts
            </Text>
            <Text style={[styles.lockoutText, { color: theme.textSecondary }]}>
              Try again in
            </Text>
            <Text style={[styles.lockoutTimer, { color: theme.primary }]}>
              {formatLockoutTime(pinLockoutRemainingMs)}
            </Text>
          </View>
        )}

        {/* Biometric button */}
        {hasBiometric && !isPinLockedOut && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometric}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Text style={styles.biometricIcon}>👆</Text>
            <Text
              style={[styles.biometricText, { color: theme.textSecondary }]}
            >
              Use Biometric
            </Text>
          </TouchableOpacity>
        )}

        {/* Privacy notice */}
        <Text style={[styles.privacyText, { color: theme.textMuted }]}>
          🛡️ Your data is encrypted and private
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Decoy router ─────────────────────────────────────────────────────────────

function DecoyRouter({ screen }: { screen: DecoyScreenType }) {
  useEffect(() => {
    router.replace(`/fake/${screen}` as any);
  }, [screen]);
  return null;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  lockContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  logoEmoji: {
    fontSize: 72,
    marginBottom: 8,
  },
  appName: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  lockReason: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 8,
  },
  pinSection: {
    width: "100%",
    alignItems: "center",
    gap: 12,
  },
  pinInputContainer: {
    width: "100%",
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  pinInput: {
    fontSize: 24,
    letterSpacing: 8,
    textAlign: "center",
    paddingVertical: 14,
  },
  pinDots: {
    flexDirection: "row",
    gap: 10,
  },
  pinDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  errorText: {
    fontSize: 13,
    textAlign: "center",
  },
  unlockButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  unlockButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  lockoutContainer: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 24,
  },
  lockoutIcon: {
    fontSize: 48,
  },
  lockoutTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  lockoutText: {
    fontSize: 15,
  },
  lockoutTimer: {
    fontSize: 40,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  biometricButton: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
  },
  biometricIcon: {
    fontSize: 36,
  },
  biometricText: {
    fontSize: 14,
  },
  privacyText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 16,
  },
});
