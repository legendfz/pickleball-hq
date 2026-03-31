import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Linking } from 'react-native';

const STORAGE_KEY = '@rate_prompt';
const FIRST_USE_KEY = '@first_use_timestamp';
const APP_NAME = 'PickleballHQ';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.pickleballhq.app';

const DAYS_BEFORE_PROMPT = 7;
const DAYS_REMIND_AGAIN = 3;

interface RatePromptState {
  lastPrompt: number | null;
  dismissed: boolean;
  rated: boolean;
}

async function getState(): Promise<RatePromptState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { lastPrompt: null, dismissed: false, rated: false };
}

async function setState(state: RatePromptState) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

async function getFirstUseTimestamp(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(FIRST_USE_KEY);
    if (raw) return Number(raw);
    // First time — record now
    const now = Date.now();
    await AsyncStorage.setItem(FIRST_USE_KEY, String(now));
    return now;
  } catch {
    return null;
  }
}

/**
 * Check if we should show the rate prompt. Call this on app mount.
 * Shows an Alert if conditions are met.
 */
export async function checkRatePrompt() {
  const state = await getState();

  // User already dismissed permanently or rated
  if (state.dismissed || state.rated) return;

  // User said "maybe later" — check if 3 days have passed
  if (state.lastPrompt) {
    const daysSinceLastPrompt = (Date.now() - state.lastPrompt) / (1000 * 60 * 60 * 24);
    if (daysSinceLastPrompt < DAYS_REMIND_AGAIN) return;
  }

  // Check if 7 days since first use
  const firstUse = await getFirstUseTimestamp();
  if (!firstUse) return;

  const daysSinceFirstUse = (Date.now() - firstUse) / (1000 * 60 * 60 * 24);
  if (daysSinceFirstUse < DAYS_BEFORE_PROMPT) return;

  // Show the prompt
  showRateAlert();
}

function showRateAlert() {
  Alert.alert(
    `Enjoying ${APP_NAME}? Rate us!`,
    undefined,
    [
      {
        text: 'Love it!',
        onPress: async () => {
          await setState({ lastPrompt: Date.now(), dismissed: false, rated: true });
          Linking.openURL(PLAY_STORE_URL);
        },
      },
      {
        text: 'Maybe later',
        onPress: async () => {
          await setState({ lastPrompt: Date.now(), dismissed: false, rated: false });
        },
      },
      {
        text: 'Not now',
        style: 'cancel',
        onPress: async () => {
          await setState({ lastPrompt: Date.now(), dismissed: true, rated: false });
        },
      },
    ],
    { cancelable: false }
  );
}
