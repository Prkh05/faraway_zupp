"use client";

import React from "react";

interface Incident {
  id: string;
  severity: string;
  priority_score: number;
  status: string;
}

interface DashboardHeaderProps {
  incidents: Incident[];
  viewMode: "table" | "map";
  onViewModeChange: (mode: "table" | "map") => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export default function DashboardHeader({
  incidents,
  viewMode,
  onViewModeChange,
  onRefresh,
  isLoading,
}: DashboardHeaderProps) {
  const totalIncidents = incidents.length;
  const criticalCount = incidents.filter(
    (i) => i.severity === "Critical"
  ).length;
  const respondingCount = incidents.filter(
    (i) => i.status === "Responding"
  ).length;
  const resolvedCount = incidents.filter(
    (i) => i.status === "Resolved"
  ).length;

  return (
    <div className="dashboard-header">
      <div className="header-top">
        <div className="brand">
          <div className="brand-icon">🔥</div>
          <div className="brand-text">
            <h1>FireWatch AI</h1>
            <p>Fire Station Command Dashboard</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => onViewModeChange("table")}
            >
              📋 Table
            </button>
            <button
              className={`view-toggle-btn ${viewMode === "map" ? "active" : ""}`}
              onClick={() => onViewModeChange("map")}
            >
              🗺️ Map
            </button>
          </div>

          <button
            className="btn btn-refresh"
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? <span className="spinner" /> : "↻"}
            Refresh
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-label">Total Incidents</div>
          <div className="stat-value">{totalIncidents}</div>
        </div>
        <div className="stat-card critical">
          <div className="stat-label">Critical</div>
          <div className="stat-value">{criticalCount}</div>
        </div>
        <div className="stat-card responding">
          <div className="stat-label">Responding</div>
          <div className="stat-value">{respondingCount}</div>
        </div>
        <div className="stat-card resolved">
          <div className="stat-label">Resolved</div>
          <div className="stat-value">{resolvedCount}</div>
        </div>
      </div>
    </div>
  );
}
