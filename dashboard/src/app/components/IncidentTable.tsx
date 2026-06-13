"use client";

import React, { useState, useMemo } from "react";
import SeverityBadge from "./SeverityBadge";
import StatusBadge from "./StatusBadge";
import ActionButtons from "./ActionButtons";

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

interface IncidentTableProps {
  incidents: Incident[];
  onUpdateStatus: (id: string, newStatus: string) => void;
}

type SortField = "severity" | "priority_score" | "created_at";
type SortDir = "asc" | "desc";

const SEVERITY_ORDER: Record<string, number> = {
  Critical: 5,
  High: 4,
  Medium: 3,
  Low: 2,
  "No Fire": 1,
};

const SEVERITY_ROW_CLASS: Record<string, string> = {
  Critical: "severity-critical",
  High: "severity-high",
  Medium: "severity-medium",
  Low: "severity-low",
  "No Fire": "severity-nofire",
};

const PRIORITY_CLASS: Record<number, string> = {
  100: "p100",
  75: "p75",
  50: "p50",
  25: "p25",
  0: "p0",
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function IncidentTable({
  incidents,
  onUpdateStatus,
}: IncidentTableProps) {
  const [sortField, setSortField] = useState<SortField>("priority_score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const sorted = useMemo(() => {
    const arr = [...incidents];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortField === "severity") {
        cmp = (SEVERITY_ORDER[a.severity] || 0) - (SEVERITY_ORDER[b.severity] || 0);
      } else if (sortField === "priority_score") {
        cmp = a.priority_score - b.priority_score;
      } else if (sortField === "created_at") {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return arr;
  }, [incidents, sortField, sortDir]);

  const sortIcon = (field: SortField) => {
    if (sortField !== field) return "↕";
    return sortDir === "desc" ? "↓" : "↑";
  };

  if (incidents.length === 0) {
    return (
      <div className="table-wrapper">
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <p>No incidents reported yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="incident-table" id="incident-table">
        <thead>
          <tr>
            <th>Incident ID</th>
            <th>Photo</th>
            <th
              className={sortField === "severity" ? "sorted" : ""}
              onClick={() => handleSort("severity")}
            >
              Severity{" "}
              <span className="sort-icon">{sortIcon("severity")}</span>
            </th>
            <th
              className={sortField === "priority_score" ? "sorted" : ""}
              onClick={() => handleSort("priority_score")}
            >
              Priority{" "}
              <span className="sort-icon">{sortIcon("priority_score")}</span>
            </th>
            <th>Status</th>
            <th>Location</th>
            <th>Latitude</th>
            <th>Longitude</th>
            <th
              className={sortField === "created_at" ? "sorted" : ""}
              onClick={() => handleSort("created_at")}
            >
              Timestamp{" "}
              <span className="sort-icon">{sortIcon("created_at")}</span>
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((incident) => (
            <tr
              key={incident.id}
              className={SEVERITY_ROW_CLASS[incident.severity] || ""}
            >
              <td>
                <span className="incident-id">{incident.id}</span>
              </td>
              <td>
                {incident.image_url ? (
                  <img
                    src={incident.image_url.startsWith("http") ? incident.image_url : `${API_BASE}${incident.image_url}`}
                    alt={`Incident ${incident.id}`}
                    className="incident-thumbnail"
                    onClick={() => setPreviewImage(incident.image_url.startsWith("http") ? incident.image_url : `${API_BASE}${incident.image_url}`)}
                  />
                ) : (
                  <span className="no-image">No Photo</span>
                )}
              </td>
              <td>
                <SeverityBadge severity={incident.severity} />
              </td>
              <td>
                <span
                  className={`priority-score ${PRIORITY_CLASS[incident.priority_score] || ""}`}
                >
                  {incident.priority_score}
                </span>
              </td>
              <td>
                <StatusBadge status={incident.status} />
              </td>
              <td className="location-cell">
                {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
              </td>
              <td className="location-cell">
                {incident.latitude.toFixed(6)}
              </td>
              <td className="location-cell">
                {incident.longitude.toFixed(6)}
              </td>
              <td className="timestamp-cell">
                {formatTimestamp(incident.created_at)}
              </td>
              <td>
                <ActionButtons
                  incident={incident}
                  onUpdateStatus={onUpdateStatus}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {previewImage && (
        <div className="modal-overlay" onClick={() => setPreviewImage(null)}>
          <div className="modal-wrapper" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setPreviewImage(null)}>
              &times;
            </button>
            <img src={previewImage} alt="Full Incident Preview" className="modal-image" />
          </div>
        </div>
      )}
    </div>
  );
}
