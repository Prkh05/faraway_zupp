"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardHeader from "./components/DashboardHeader";
import IncidentTable from "./components/IncidentTable";
import IncidentMap from "./components/IncidentMap";

interface Incident {
  id: string;
  image_url: string;
  latitude: number;
  longitude: number;
  description: string | null;
  severity: string;
  confidence: number;
  priority_score: number;
  status: string;
  created_at: string;
  updated_at: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function DashboardPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "map">("table");

  const fetchIncidents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/incidents`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Incident[] = await res.json();
      setIncidents(data);
    } catch (err) {
      console.error("Failed to fetch incidents:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch + polling every 10s
  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 10000);
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/incident/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Update local state immediately for responsiveness
      setIncidents((prev) =>
        prev.map((inc) =>
          inc.id === id
            ? { ...inc, status: newStatus, updated_at: new Date().toISOString() }
            : inc
        )
      );
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  return (
    <div className="dashboard-container">
      <DashboardHeader
        incidents={incidents}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={fetchIncidents}
        isLoading={isLoading}
      />

      {viewMode === "table" ? (
        <IncidentTable
          incidents={incidents}
          onUpdateStatus={handleUpdateStatus}
        />
      ) : (
        <IncidentMap incidents={incidents} />
      )}
    </div>
  );
}
