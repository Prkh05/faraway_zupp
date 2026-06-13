import { Tabs } from "expo-router";
import { Platform, Text } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#f97316",
        tabBarInactiveTintColor: "#64748b",
        tabBarStyle: {
          backgroundColor: "#111827",
          borderTopColor: "rgba(255,255,255,0.06)",
          borderTopWidth: 1,
          paddingTop: 4,
          paddingBottom: Platform.OS === "ios" ? 24 : 8,
          height: Platform.OS === "ios" ? 88 : 64,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Report",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22 }}>🔥</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: "Status",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22 }}>📊</Text>
          ),
        }}
      />
    </Tabs>
  );
}

