import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { theme } from '../lib/theme';

// ─── Version Data (PickleballHQ) ──────────────────────────
interface ChangeItem {
  text: string;
}

interface Version {
  version: string;
  date: string;
  changes: ChangeItem[];
}

const VERSIONS: Version[] = [
  {
    version: 'v1.1',
    date: 'March 2026',
    changes: [
      { text: 'Paddle comparison tool' },
      { text: 'Court check-in and reviews' },
      { text: 'DUPR activity statistics' },
      { text: 'Matchmaking improvements' },
    ],
  },
  {
    version: 'v1.0',
    date: 'March 2026',
    changes: [
      { text: 'Live scores and match details' },
      { text: 'H2H analysis for players' },
      { text: 'Fantasy teams and bracket predictions' },
      { text: 'Multi-language support' },
      { text: 'Push notifications setup' },
      { text: 'Court finder with surface types' },
      { text: 'Player profiles and DUPR ratings' },
    ],
  },
];

// ─── Screen ───────────────────────────────────────────────
export default function WhatsNewScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>What's New</Text>
      <Text style={styles.subtitle}>PickleballHQ updates and improvements</Text>

      {VERSIONS.map((v) => (
        <View key={v.version} style={styles.versionCard}>
          <View style={styles.versionHeader}>
            <Text style={styles.versionName}>{v.version}</Text>
            <Text style={styles.versionDate}>{v.date}</Text>
          </View>
          <View style={styles.changes}>
            {v.changes.map((c, i) => (
              <View key={i} style={styles.changeRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.changeText}>{c.text}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    padding: theme.spacing.padding,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 24,
  },
  versionCard: {
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: theme.spacing.cardGap,
    borderWidth: 1,
    borderColor: theme.border,
  },
  versionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  versionName: {
    fontSize: 18,
    fontWeight: theme.fontWeight.bold,
    color: theme.accent,
  },
  versionDate: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  changes: {
    gap: 10,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bullet: {
    fontSize: 14,
    color: theme.accent,
    marginTop: 1,
  },
  changeText: {
    fontSize: 14,
    color: theme.text,
    flex: 1,
    lineHeight: 20,
  },
});
