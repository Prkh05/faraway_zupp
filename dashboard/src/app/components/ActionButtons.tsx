"use client";

import React from "react";

interface Incident {
  id: string;
  status: string;
}

interface ActionButtonsProps {
  incident: Incident;
  onUpdateStatus: (id: string, newStatus: string) => void;
}

/**
 * Action buttons for the dashboard.
 * Maps user actions to status transitions:
 *   Accept   → "Under Review"
 *   Dispatch → "Responding"
 *   Resolve  → "Resolved"
 */
export default function ActionButtons({ incident, onUpdateStatus }: ActionButtonsProps) {
  const { id, status } = incident;

  const isAcceptable =
    status === "Report Submitted" || status === "Assigned";
  const isDispatchable =
    status === "Under Review" || status === "Assigned";
  const isResolvable =
    status !== "Resolved";

  return (
    <div className="action-buttons">
      <button
        className="btn-action accept"
        disabled={!isAcceptable}
        onClick={() => onUpdateStatus(id, "Under Review")}
        title="Accept — move to Under Review"
      >
        Accept
      </button>
      <button
        className="btn-action dispatch"
        disabled={!isDispatchable}
        onClick={() => onUpdateStatus(id, "Responding")}
        title="Dispatch — move to Responding"
      >
        Dispatch
      </button>
      <button
        className="btn-action resolve"
        disabled={!isResolvable}
        onClick={() => onUpdateStatus(id, "Resolved")}
        title="Resolve — mark as Resolved"
      >
        Resolve
      </button>
    </div>
  );
}
