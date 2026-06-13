import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface StatusBadgeProps {
  status: string;
}

const STATUS_CONFIG: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  "Report Submitted": { color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", label: "Submitted" },
  "Under Review": { color: "#3b82f6", bg: "rgba(59,130,246,0.12)", label: "Under Review" },
  Assigned: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "Assigned" },
  Responding: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "Responding" },
  Resolved: { color: "#10b981", bg: "rgba(16,185,129,0.12)", label: "Resolved" },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG["Report Submitted"];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: 14,
    fontWeight: "700",
  },
});
