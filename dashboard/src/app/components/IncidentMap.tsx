"use client";

import React, { useState, useCallback } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";

interface Incident {
  id: string;
  latitude: number;
  longitude: number;
  severity: string;
  priority_score: number;
  status: string;
  created_at: string;
}

interface IncidentMapProps {
  incidents: Incident[];
}

/**
 * Severity → Google Maps marker color URL.
 * Uses Google's chart API for colored markers.
 */
const MARKER_COLORS: Record<string, string> = {
  Critical: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
  High: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png",
  Medium: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
  Low: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
  "No Fire": "http://maps.google.com/mapfiles/ms/icons/grey-dot.png",
};

const MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8b8fa4" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2a2d40" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1a1a2e" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0e1626" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#1e2235" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1e2235" }],
  },
];

const containerStyle = {
  width: "100%",
  height: "100%",
};

// Default center (India — reasonable for demo)
const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };

export default function IncidentMap({ incidents }: IncidentMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey || "",
  });

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  );
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      setMap(mapInstance);

      // Fit bounds to all incident markers
      if (incidents.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        incidents.forEach((inc) => {
          bounds.extend({ lat: inc.latitude, lng: inc.longitude });
        });
        mapInstance.fitBounds(bounds, 60);
      }
    },
    [incidents]
  );

  // Graceful degradation — no API key
  if (!apiKey) {
    return (
      <div className="map-fallback">
        <div className="map-fallback-icon">🗺️</div>
        <p>
          <strong>Map view requires a Google Maps API key.</strong>
          <br />
          Set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your{" "}
          <code>.env.local</code> file.
          <br />
          The table view works normally without it.
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="map-fallback">
        <div className="map-fallback-icon">⚠️</div>
        <p>Failed to load Google Maps. Please check your API key.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="map-fallback">
        <span className="spinner" />
        <p>Loading map…</p>
      </div>
    );
  }

  const center =
    incidents.length > 0
      ? { lat: incidents[0].latitude, lng: incidents[0].longitude }
      : DEFAULT_CENTER;

  return (
    <div className="map-container">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={5}
        onLoad={onLoad}
        options={{
          styles: MAP_STYLES,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        }}
      >
        {incidents.map((incident) => (
          <Marker
            key={incident.id}
            position={{ lat: incident.latitude, lng: incident.longitude }}
            icon={MARKER_COLORS[incident.severity] || MARKER_COLORS["No Fire"]}
            onClick={() => setSelectedIncident(incident)}
          />
        ))}

        {selectedIncident && (
          <InfoWindow
            position={{
              lat: selectedIncident.latitude,
              lng: selectedIncident.longitude,
            }}
            onCloseClick={() => setSelectedIncident(null)}
          >
            <div className="info-window">
              <h3>Incident #{selectedIncident.id}</h3>
              <div className="info-window-row">
                <span className="info-window-label">Severity</span>
                <span className="info-window-value">
                  {selectedIncident.severity}
                </span>
              </div>
              <div className="info-window-row">
                <span className="info-window-label">Priority</span>
                <span className="info-window-value">
                  {selectedIncident.priority_score}
                </span>
              </div>
              <div className="info-window-row">
                <span className="info-window-label">Status</span>
                <span className="info-window-value">
                  {selectedIncident.status}
                </span>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
