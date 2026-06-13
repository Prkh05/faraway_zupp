"use client";

import React from "react";

interface StatusBadgeProps {
  status: string;
}

const STATUS_CONFIG: Record<string, { className: string; label: string }> = {
  "Report Submitted": { className: "submitted", label: "Submitted" },
  "Under Review": { className: "review", label: "Under Review" },
  Assigned: { className: "assigned", label: "Assigned" },
  Responding: { className: "responding", label: "Responding" },
  Resolved: { className: "resolved", label: "Resolved" },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG["Report Submitted"];

  return (
    <span className={`status-badge ${config.className}`}>
      <span className="status-dot" />
      {config.label}
    </span>
  );
}
