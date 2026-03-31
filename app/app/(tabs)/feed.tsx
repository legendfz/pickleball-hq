import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
} from 'react-native';
import { theme } from '../../lib/theme';

// ─── Mock Feed Data ───────────────────────────────────────
interface FeedItem {
  id: string;
  avatar: string;
  name: string;
  description: string;
  timeAgo: string;
}

const MOCK_FEED: FeedItem[] = [
  {
    id: '1',
    avatar: 'https://i.pravatar.cc/100?img=11',
    name: 'Mike',
    description: 'played at Irvine Station 🏓',
    timeAgo: '2h ago',
  },
  {
    id: '2',
    avatar: 'https://i.pravatar.cc/100?img=5',
    name: 'Sarah',
    description: 'won against Tom 11-7, 11-9 🏆',
    timeAgo: '3h ago',
  },
  {
    id: '3',
    avatar: 'https://i.pravatar.cc/100?img=12',
    name: 'Djokovic',
    description: 'posted a new game @ 6PM 📅',
    timeAgo: '4h ago',
  },
  {
    id: '4',
    avatar: 'https://i.pravatar.cc/100?img=9',
    name: 'Lisa',
    description: 'checked in at Costa Mesa Rec 📍',
    timeAgo: '5h ago',
  },
  {
    id: '5',
    avatar: 'https://i.pravatar.cc/100?img=8',
    name: 'Alex',
    description: "joined Mike's doubles game 🤝",
    timeAgo: '6h ago',
  },
  {
    id: '6',
    avatar: 'https://i.pravatar.cc/100?img=15',
    name: 'Emma',
    description: 'achieved a 10-day streak! 🔥',
    timeAgo: '7h ago',
  },
  {
    id: '7',
    avatar: 'https://i.pravatar.cc/100?img=20',
    name: 'Ryan',
    description: 'played 3 matches at Great Park 🏓',
    timeAgo: '8h ago',
  },
  {
    id: '8',
    avatar: 'https://i.pravatar.cc/100?img=3',
    name: 'Nicole',
    description: 'upgraded to DUPR 4.2 ⚡',
    timeAgo: '10h ago',
  },
  {
    id: '9',
    avatar: 'https://i.pravatar.cc/100?img=16',
    name: 'Chris',
    description: 'joined the Irvine league 🏅',
    timeAgo: '12h ago',
  },
  {
    id: '10',
    avatar: 'https://i.pravatar.cc/100?img=22',
    name: 'Amy',
    description: 'won the weekend tournament 🎉',
    timeAgo: '1d ago',
  },
];

// ─── Feed Card ────────────────────────────────────────────
function FeedCard({ item }: { item: FeedItem }) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.content}>
        <Text style={styles.text}>
          <Text style={styles.name}>{item.name}</Text>{' '}
          <Text style={styles.description}>{item.description}</Text>
        </Text>
        <Text style={styles.time}>{item.timeAgo}</Text>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────
export default function FeedScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
      </View>
      <FlatList
        data={MOCK_FEED}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FeedCard item={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  header: {
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: theme.spacing.padding,
    backgroundColor: theme.bg,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
  },
  list: {
    padding: theme.spacing.padding,
    gap: theme.spacing.cardGap,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.cardAlt,
  },
  content: {
    flex: 1,
  },
  text: {
    fontSize: 14,
    color: theme.text,
    lineHeight: 20,
  },
  name: {
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
  },
  description: {
    color: theme.textSecondary,
  },
  time: {
    fontSize: 12,
    color: theme.textTertiary,
    marginTop: 4,
  },
});
