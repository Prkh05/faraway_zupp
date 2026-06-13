"use client";

import React from "react";

interface SeverityBadgeProps {
  severity: string;
}

const SEVERITY_CONFIG: Record<string, { className: string; label: string }> = {
  Critical: { className: "critical", label: "CRITICAL" },
  High: { className: "high", label: "HIGH" },
  Medium: { className: "medium", label: "MEDIUM" },
  Low: { className: "low", label: "LOW" },
  "No Fire": { className: "nofire", label: "NO FIRE" },
};

export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG["No Fire"];

  return (
    <span className={`severity-badge ${config.className}`}>
      <span className="severity-dot" />
      {config.label}
    </span>
  );
}
