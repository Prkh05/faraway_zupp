/**
 * FireWatch AI — Citizen App API Client
 *
 * Handles communication with the FastAPI backend.
 * Configurable base URL via EXPO_PUBLIC_API_URL env var.
 */

import { Platform } from "react-native";

// Expo uses EXPO_PUBLIC_ prefix for env vars
const API_BASE =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

export interface ReportResponse {
  incident_id: string;
  status: string;
}

export interface IncidentStatusResponse {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Submit a fire report to the backend.
 *
 * Sends image + location + description as multipart/form-data.
 * Returns the new incident ID and initial status.
 */
export async function submitReport(
  imageUri: string,
  latitude: number,
  longitude: number,
  description?: string
): Promise<ReportResponse> {
  const formData = new FormData();
  const filename = imageUri.split("/").pop() || "photo.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : "image/jpeg";

  if (Platform.OS === "web") {
    // Web: Fetch local blob/data URL and convert to real Blob (supported natively in browsers)
    const blobResponse = await fetch(imageUri);
    const blob = await blobResponse.blob();
    formData.append("image", blob, filename);

    formData.append("latitude", latitude.toString());
    formData.append("longitude", longitude.toString());
    if (description && description.trim()) {
      formData.append("description", description.trim());
    }

    const response = await fetch(`${API_BASE}/report`, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error ${response.status}: ${errorText}`);
    }

    return response.json();
  } else {
    // Native (iOS/Android): Use native XMLHttpRequest to upload the FormData with React Native's { uri, name, type } object structure
    // This bypasses the Expo global fetch polyfill (which throws Unsupported FormDataPart implementation)
    // and avoids fetch(imageUri).blob() (which throws 'creating blobs from ArrayBuffer' are not supported)
    return new Promise((resolve, reject) => {
      formData.append("image", {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      formData.append("latitude", latitude.toString());
      formData.append("longitude", longitude.toString());
      if (description && description.trim()) {
        formData.append("description", description.trim());
      }

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE}/report`);
      xhr.setRequestHeader("Accept", "application/json");

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const json = JSON.parse(xhr.responseText);
            resolve(json);
          } catch (e) {
            reject(new Error("Failed to parse server response"));
          }
        } else {
          reject(new Error(`Server error ${xhr.status}: ${xhr.responseText}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network request failed. Please check backend server and local network IP config."));
      };

      xhr.send(formData);
    });
  }
}

/**
 * Get the current status of an incident.
 *
 * Returns status + timestamps only (no severity/priority — per spec).
 */
export async function getIncidentStatus(
  incidentId: string
): Promise<IncidentStatusResponse> {
  const response = await fetch(`${API_BASE}/incident/${incidentId}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Incident not found. Please check the ID.");
    }
    throw new Error(`Server error ${response.status}`);
  }

  return response.json();
}
