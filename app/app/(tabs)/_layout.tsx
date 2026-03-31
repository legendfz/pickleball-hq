import { Tabs } from 'expo-router';
import { Text, StyleSheet, View } from 'react-native';
import { theme } from '../../lib/theme';
import { useLanguage } from '../../lib/i18n';
import {
  PlayIcon,
  CourtsIcon,
  PlayersIcon,
  EventsIcon,
  ProfileIcon,
} from '../../lib/tab-icons';

function TabIcon({
  label,
  focused,
  icon: Icon,
  emoji,
}: {
  label: string;
  focused: boolean;
  icon: React.ComponentType<{ color: string; size?: number }>;
  emoji?: string;
}) {
  const color = focused ? theme.accent : theme.textSecondary;
  return (
    <View style={tabStyles.iconWrap}>
      {emoji ? (
        <Text style={[tabStyles.emoji, { opacity: focused ? 1 : 0.5 }]}>{emoji}</Text>
      ) : (
        <Icon color={color} size={22} />
      )}
      <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>{label}</Text>
      {focused && <View style={tabStyles.indicator} />}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    minHeight: 44,
    minWidth: 44,
  },
  emoji: {
    fontSize: 22,
  },
  label: {
    fontSize: 10,
    fontWeight: theme.fontWeight.medium,
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 3,
  },
  labelActive: {
    color: theme.accent,
    fontWeight: theme.fontWeight.semibold,
  },
  indicator: {
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.accent,
    marginTop: 3,
  },
});

export default function TabLayout() {
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: 'rgba(18, 18, 18, 0.95)',
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 68,
          paddingBottom: 8,
          paddingTop: 4,
          backdropFilter: 'blur(20px)',
        },
        tabBarLabelStyle: {
          display: 'none',
        },
        headerStyle: {
          backgroundColor: theme.bg,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: theme.fontWeight.semibold,
          fontSize: 17,
        },
      }}
    >
      {/* Tab 1: Play (首页) — 约球中心 */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Play',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Play" focused={focused} icon={PlayIcon} />
          ),
        }}
      />

      {/* Tab 2: Feed — 社区 */}
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Feed" focused={focused} emoji="📢" />
          ),
        }}
      />

      {/* Tab 3: Courts — 球场 */}
      <Tabs.Screen
        name="courts"
        options={{
          title: 'Courts',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Courts" focused={focused} icon={CourtsIcon} />
          ),
        }}
      />

      {/* Tab 3: Players — 排名 */}
      <Tabs.Screen
        name="players"
        options={{
          title: 'Players',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Players" focused={focused} icon={PlayersIcon} />
          ),
        }}
      />

      {/* Tab 4: Events — 赛事 */}
      <Tabs.Screen
        name="tournaments"
        options={{
          title: 'Events',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Events" focused={focused} icon={EventsIcon} />
          ),
        }}
      />

      {/* Tab 5: Profile — 我的 */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Profile" focused={focused} icon={ProfileIcon} />
          ),
        }}
      />

      {/* Hidden tabs — routes still accessible, not shown in tab bar */}
      <Tabs.Screen name="following" options={{ href: null }} />
      <Tabs.Screen name="matches" options={{ href: null }} />
      <Tabs.Screen name="h2h" options={{ href: null }} />
      <Tabs.Screen name="fantasy" options={{ href: null }} />
    </Tabs>
  );
}
