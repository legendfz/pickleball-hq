import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';

// ─── Types ──────────────────────────────────────────────────

type Step = 1 | 2 | 3;

const DUPR_LEVELS = [
  { key: 'beginner', label: 'Beginner', range: '2.0 - 2.5', emoji: '🌱' },
  { key: 'intermediate', label: 'Intermediate', range: '3.0 - 3.5', emoji: '💪' },
  { key: 'advanced', label: 'Advanced', range: '4.0 - 4.5', emoji: '🔥' },
  { key: 'pro', label: 'Pro', range: '5.0+', emoji: '🏆' },
];

// ─── Main Screen ────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [duprLevel, setDuprLevel] = useState<string | null>(null);
  const [locationGranted, setLocationGranted] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateToNext = (nextStep: Step) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    setTimeout(() => setStep(nextStep), 150);
  };

  const handleSendCode = () => {
    if (phone.length >= 10) {
      setCodeSent(true);
    }
  };

  const handleVerifyCode = () => {
    if (verificationCode.length === 6) {
      animateToNext(2);
    }
  };

  const handleSelectLevel = (level: string) => {
    setDuprLevel(level);
  };

  const handleContinueFromLevel = () => {
    if (duprLevel) {
      animateToNext(3);
    }
  };

  const handleAllowLocation = () => {
    setLocationGranted(true);
    // Simulate location permission
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 600);
  };

  const handleSkipLocation = () => {
    router.replace('/(tabs)');
  };

  // ─── Render Step Content ─────────────────────────────────

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepEmoji}>📱</Text>
            <Text style={styles.stepTitle}>What's your number?</Text>
            <Text style={styles.stepSubtitle}>
              We'll send you a code to verify
            </Text>

            {!codeSent ? (
              <>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="(949) 555-0123"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  autoFocus
                  maxLength={14}
                />
                <TouchableOpacity
                  style={[
                    styles.mainBtn,
                    phone.length < 10 && styles.mainBtnDisabled,
                  ]}
                  onPress={handleSendCode}
                  disabled={phone.length < 10}
                  activeOpacity={0.8}
                >
                  <Text style={styles.mainBtnText}>Send Code</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.codeHint}>
                  Code sent to {phone} ✅
                </Text>
                <TextInput
                  style={styles.codeInput}
                  placeholder="• • • • • •"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="number-pad"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  autoFocus
                  maxLength={6}
                  textAlign="center"
                />
                <TouchableOpacity
                  style={[
                    styles.mainBtn,
                    verificationCode.length < 6 && styles.mainBtnDisabled,
                  ]}
                  onPress={handleVerifyCode}
                  disabled={verificationCode.length < 6}
                  activeOpacity={0.8}
                >
                  <Text style={styles.mainBtnText}>Verify</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepEmoji}>🏓</Text>
            <Text style={styles.stepTitle}>Your level?</Text>
            <Text style={styles.stepSubtitle}>
              Pick your DUPR level so we match you right
            </Text>

            <View style={styles.levelGrid}>
              {DUPR_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.key}
                  style={[
                    styles.levelBtn,
                    duprLevel === level.key && styles.levelBtnActive,
                  ]}
                  onPress={() => handleSelectLevel(level.key)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.levelEmoji}>{level.emoji}</Text>
                  <Text
                    style={[
                      styles.levelLabel,
                      duprLevel === level.key && styles.levelLabelActive,
                    ]}
                  >
                    {level.label}
                  </Text>
                  <Text style={styles.levelRange}>{level.range}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.mainBtn,
                !duprLevel && styles.mainBtnDisabled,
              ]}
              onPress={handleContinueFromLevel}
              disabled={!duprLevel}
              activeOpacity={0.8}
            >
              <Text style={styles.mainBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepEmoji}>📍</Text>
            <Text style={styles.stepTitle}>Find courts near you</Text>
            <Text style={styles.stepSubtitle}>
              Allow location to discover nearby pickleball courts
            </Text>

            <View style={styles.locationVisual}>
              <View style={styles.locationPin}>
                <Text style={styles.locationPinEmoji}>📍</Text>
              </View>
              <View style={styles.locationRipple1} />
              <View style={styles.locationRipple2} />
            </View>

            <TouchableOpacity
              style={styles.mainBtn}
              onPress={handleAllowLocation}
              activeOpacity={0.8}
            >
              <Text style={styles.mainBtnText}>Allow Location</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipBtn}
              onPress={handleSkipLocation}
              activeOpacity={0.7}
            >
              <Text style={styles.skipBtnText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Background gradient layers */}
      <View style={styles.gradientLayer1} />
      <View style={styles.gradientLayer2} />
      <View style={styles.gradientLayer3} />

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {renderStep()}
      </Animated.View>

      {/* Progress dots */}
      <View style={styles.progressDots}>
        {[1, 2, 3].map((s) => (
          <View
            key={s}
            style={[
              styles.dot,
              s === step && styles.dotActive,
              s < step && styles.dotCompleted,
            ]}
          />
        ))}
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a2e38',
  },

  // Gradient layers (simulating LinearGradient)
  gradientLayer1: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a2e38',
  },
  gradientLayer2: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0d3d4a',
    opacity: 0.7,
  },
  gradientLayer3: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#1a5c6b',
    opacity: 0.5,
  },

  // Content
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  stepContent: {
    width: '100%',
    alignItems: 'center',
  },
  stepEmoji: {
    fontSize: 56,
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },

  // Phone input
  phoneInput: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 18,
    fontSize: 22,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  // Code input
  codeHint: {
    fontSize: 13,
    color: '#00d4aa',
    marginBottom: 16,
    fontWeight: '500',
  },
  codeInput: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 18,
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  // Main button
  mainBtn: {
    width: '100%',
    backgroundColor: '#0891b2',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#0891b2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  mainBtnDisabled: {
    backgroundColor: 'rgba(8, 145, 178, 0.3)',
    shadowOpacity: 0,
  },
  mainBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },

  // Level selection
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 28,
    width: '100%',
  },
  levelBtn: {
    width: '46%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  levelBtnActive: {
    backgroundColor: 'rgba(8, 145, 178, 0.2)',
    borderColor: '#0891b2',
  },
  levelEmoji: {
    fontSize: 28,
  },
  levelLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  levelLabelActive: {
    color: '#ffffff',
  },
  levelRange: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },

  // Location visual
  locationVisual: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  locationPin: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(8, 145, 178, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  locationPinEmoji: {
    fontSize: 24,
  },
  locationRipple1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(8, 145, 178, 0.25)',
    zIndex: 2,
  },
  locationRipple2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: 'rgba(8, 145, 178, 0.12)',
    zIndex: 1,
  },

  // Skip button
  skipBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipBtnText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
  },

  // Progress dots
  progressDots: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    backgroundColor: '#0891b2',
    width: 28,
    borderRadius: 5,
  },
  dotCompleted: {
    backgroundColor: '#00d4aa',
  },
});
