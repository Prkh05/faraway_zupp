/**
 * FireWatch AI — Status Tracking Screen
 *
 * Screen 2 of the citizen app.
 * Displays incident status as a stepper/progress bar:
 *   Report Submitted → Under Review → Assigned → Responding → Resolved
 *
 * Citizens do NOT see severity predictions or priority scores.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getIncidentStatus, IncidentStatusResponse } from "../../services/api";

const STATUS_STEPS = [
  "Report Submitted",
  "Under Review",
  "Assigned",
  "Responding",
  "Resolved",
];

const STATUS_ICONS = ["📤", "🔍", "👤", "🚒", "✅"];
const STATUS_COLORS = ["#8b5cf6", "#3b82f6", "#f59e0b", "#ef4444", "#10b981"];

export default function StatusTrackingScreen() {
  const params = useLocalSearchParams<{ incidentId?: string }>();

  const [incidentId, setIncidentId] = useState(params.incidentId || "");
  const [incident, setIncident] = useState<IncidentStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!incidentId.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await getIncidentStatus(incidentId.trim());
      setIncident(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch status");
      setIncident(null);
    } finally {
      setIsLoading(false);
    }
  }, [incidentId]);

  // Auto-fetch if incidentId comes from navigation params
  useEffect(() => {
    if (params.incidentId) {
      setIncidentId(params.incidentId);
    }
  }, [params.incidentId]);

  useEffect(() => {
    if (incidentId.trim()) {
      fetchStatus();
    }
  }, [incidentId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStatus();
    setRefreshing(false);
  };

  const currentStepIndex = incident
    ? STATUS_STEPS.indexOf(incident.status)
    : -1;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0e1a" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>📊</Text>
        <Text style={styles.headerTitle}>Track Report</Text>
        <Text style={styles.headerSubtitle}>Monitor your incident status</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#f97316"
            colors={["#f97316"]}
          />
        }
      >
        {/* Search */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>🔎 Incident ID</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Enter Incident ID"
              placeholderTextColor="#4a5568"
              value={incidentId}
              onChangeText={setIncidentId}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[
                styles.searchButton,
                !incidentId.trim() && styles.searchButtonDisabled,
              ]}
              onPress={fetchStatus}
              disabled={!incidentId.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.searchButtonText}>Track</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {/* Status Stepper */}
        {incident && (
          <View style={styles.statusSection}>
            <View style={styles.incidentCard}>
              <View style={styles.incidentHeader}>
                <Text style={styles.incidentLabel}>Incident</Text>
                <Text style={styles.incidentIdText}>{incident.id}</Text>
              </View>

              <View style={styles.timestampRow}>
                <View style={styles.timestampItem}>
                  <Text style={styles.timestampLabel}>Reported</Text>
                  <Text style={styles.timestampValue}>
                    {formatDate(incident.created_at)}
                  </Text>
                </View>
                <View style={styles.timestampItem}>
                  <Text style={styles.timestampLabel}>Updated</Text>
                  <Text style={styles.timestampValue}>
                    {formatDate(incident.updated_at)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Stepper */}
            <View style={styles.stepper}>
              {STATUS_STEPS.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const color = STATUS_COLORS[index];

                return (
                  <View key={step} style={styles.stepContainer}>
                    <View style={styles.stepRow}>
                      {/* Step indicator */}
                      <View
                        style={[
                          styles.stepCircle,
                          isCompleted && { backgroundColor: color, borderColor: color },
                          isCurrent && {
                            shadowColor: color,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.5,
                            shadowRadius: 12,
                            elevation: 8,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.stepIcon,
                            !isCompleted && { opacity: 0.3 },
                          ]}
                        >
                          {STATUS_ICONS[index]}
                        </Text>
                      </View>

                      {/* Step text */}
                      <View style={styles.stepTextContainer}>
                        <Text
                          style={[
                            styles.stepLabel,
                            isCompleted && { color: "#f1f5f9" },
                            isCurrent && { fontWeight: "800" },
                          ]}
                        >
                          {step}
                        </Text>
                        {isCurrent && (
                          <Text style={[styles.stepStatus, { color }]}>
                            Current Status
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Connector line */}
                    {index < STATUS_STEPS.length - 1 && (
                      <View
                        style={[
                          styles.connector,
                          index < currentStepIndex && {
                            backgroundColor: STATUS_COLORS[index + 1],
                          },
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </View>

            <Text style={styles.pullToRefresh}>
              Pull down to refresh status
            </Text>
          </View>
        )}

        {/* Empty state */}
        {!incident && !error && !isLoading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>
              Enter an Incident ID to track your report
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0e1a",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    backgroundColor: "#111827",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(59,130,246,0.2)",
  },
  headerIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#f1f5f9",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f1f5f9",
    marginBottom: 12,
  },
  searchSection: {
    marginBottom: 24,
  },
  searchRow: {
    flexDirection: "row",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 14,
    color: "#f1f5f9",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "monospace",
    letterSpacing: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  searchButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  searchButtonDisabled: {
    opacity: 0.4,
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  errorCard: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  statusSection: {
    gap: 20,
  },
  incidentCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  incidentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  incidentLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  incidentIdText: {
    color: "#f97316",
    fontSize: 18,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  timestampRow: {
    flexDirection: "row",
    gap: 20,
  },
  timestampItem: {
    flex: 1,
  },
  timestampLabel: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  timestampValue: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "500",
  },
  stepper: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  stepContainer: {
    position: "relative",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 4,
  },
  stepCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepIcon: {
    fontSize: 18,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4a5568",
  },
  stepStatus: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 2,
  },
  connector: {
    width: 2,
    height: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginLeft: 21,
    marginVertical: 2,
  },
  pullToRefresh: {
    textAlign: "center",
    color: "#4a5568",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    gap: 16,
  },
  emptyIcon: {
    fontSize: 48,
    opacity: 0.3,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 15,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 22,
  },
});
