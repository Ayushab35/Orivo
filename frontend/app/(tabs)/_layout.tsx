import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '../../lib/themeContext';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  const { c } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: c.bgInset,
          borderTopColor: c.border,
          borderTopWidth: 1,
          height: 66,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: c.textPrimary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarLabelStyle: { fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: '600' },
        sceneStyle: { backgroundColor: c.bg },
      } as any}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size }) => <Ionicons name="layers-outline" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="advisor"
        options={{
          title: 'Advisor',
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size - 2} color={color} />,
        }}
      />
    </Tabs>
  );
}
