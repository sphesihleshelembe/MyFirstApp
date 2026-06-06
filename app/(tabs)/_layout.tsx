import { Tabs, router } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Home, FilePlus, FileText, User, Settings, Target, Gauge } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { colors, radius } from '@/constants/theme';
import { usePathname } from 'expo-router';

const pathname = usePathname();

export default function TabsLayout() {
  const { session, loading } = useAuth();

 useEffect(() => {
  const isAuthRoute =
    pathname.includes('callback') ||
    pathname.includes('reset-password');

  if (!session && !isAuthRoute) return null;
   
  if (!loading && !session && !isAuthRoute) {
    router.replace('/(auth)/login');
  }
}, [session, loading, pathname]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primaryLight,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarBackground: () => <View style={styles.tabBarBg} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ color, size }) => <FilePlus color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="match"
        options={{
          title: 'Match',
          tabBarIcon: ({ color, size }) => <Target color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="score"
        options={{
          title: 'Score',
          tabBarIcon: ({ color, size }) => <Gauge color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="my-cvs"
        options={{
          title: 'My CVs',
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 0,
  },
  tabBarBg: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
