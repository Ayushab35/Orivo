import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '../../lib/themeContext';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  const { c } = useTheme();
  return (
    <Tabs
      screenOptions={
        {
          headerShown: false,
          tabBarStyle: {
            backgroundColor: c.bgInset,
            borderTopColor: c.border,
            borderTopWidth: 1,
            paddingTop: 6,
          },
          tabBarActiveTintColor: c.textPrimary,
          tabBarInactiveTintColor: c.textMuted,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "600",
            letterSpacing: 0.4,
            marginTop: 2,
          },
          tabBarItemStyle: {
            paddingHorizontal: 2,
            flex: 1,
            justifyContent: "center",
          } as any,
          sceneStyle: { backgroundColor: c.bg },
          tabBarAllowFontScaling: false,
        } as any
      }
    >
      <Tabs.Screen
        name="dashboard"
        options={
          {
            title: "Home",
            tabBarButtonTestID: "tab-dashboard",
            tabBarIcon: ({ color, size, focused }: any) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={20}
                color={color}
              />
            ),
          } as any
        }
      />
      {/* <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarButtonTestID: 'tab-insights',
          tabBarIcon: ({ color, size, focused }: any) => <Ionicons name={focused ? 'layers' : 'layers-outline'} size={20} color={color} />,
        } as any}
      /> */}
      <Tabs.Screen
        name="advisor"
        options={
          {
            title: "Advisor",
            tabBarButtonTestID: "tab-advisor",
            tabBarIcon: ({ color, size, focused }: any) => (
              <Ionicons
                name={focused ? "sparkles" : "sparkles-outline"}
                size={20}
                color={color}
              />
            ),
          } as any
        }
      />
      <Tabs.Screen
        name="profile"
        options={
          {
            title: "You",
            tabBarButtonTestID: "tab-profile",
            tabBarIcon: ({ color, size, focused }: any) => (
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={20}
                color={color}
              />
            ),
          } as any
        }
      />
    </Tabs>
  );
}
