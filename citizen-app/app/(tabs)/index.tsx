/**
 * FireWatch AI — Report Fire Screen
 *
 * Screen 1 of the citizen app.
 * Features:
 *   - Capture image from camera
 *   - Upload image from gallery
 *   - Auto-fetch current GPS location
 *   - Optional description field
 *   - Submit report button
 *
 * On submit: sends image, latitude, longitude, timestamp, description
 * to POST /report. Citizens do NOT see severity predictions.
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  StatusBar,
  Modal,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { submitReport, ReportResponse } from "../../services/api";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

export default function ReportFireScreen() {
  // Form state
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [reportResult, setReportResult] = useState<ReportResponse | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-fetch location on mount
    fetchLocation();
  }, []);

  const fetchLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Location access is needed to report fire locations accurately."
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch (error) {
      Alert.alert("Location Error", "Could not fetch GPS location. Please try again.");
    } finally {
      setLocationLoading(false);
    }
  };

  const pickImageFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Camera access is needed to capture fire images.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Gallery access is needed to upload fire images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!imageUri) {
      Alert.alert("Image Required", "Please capture or upload an image of the fire.");
      return;
    }
    if (!location) {
      Alert.alert("Location Required", "Please wait for GPS location or tap 'Refresh Location'.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitReport(
        imageUri,
        location.latitude,
        location.longitude,
        description || undefined
      );
      setReportResult(result);
      setSuccessModal(true);
    } catch (error: any) {
      Alert.alert("Submission Failed", error.message || "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessModal(false);
    // Reset form
    setImageUri(null);
    setDescription("");
    // Navigate to status screen with the incident ID
    if (reportResult) {
      router.push({
        pathname: "/two",
        params: { incidentId: reportResult.incident_id },
      });
    }
  };

  const removeImage = () => {
    setImageUri(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0e1a" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerGradient}>
          <Text style={styles.headerIcon}>🔥</Text>
          <Text style={styles.headerTitle}>Report Fire</Text>
          <Text style={styles.headerSubtitle}>Help protect your community</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.formContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Image Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📷 Fire Image</Text>

            {imageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImageBtn} onPress={removeImage}>
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imageButtonsRow}>
                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={pickImageFromCamera}
                >
                  <Text style={styles.imageButtonIcon}>📸</Text>
                  <Text style={styles.imageButtonText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={pickImageFromGallery}
                >
                  <Text style={styles.imageButtonIcon}>🖼️</Text>
                  <Text style={styles.imageButtonText}>Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Location Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Location</Text>
            <View style={styles.locationCard}>
              {locationLoading ? (
                <View style={styles.locationLoading}>
                  <ActivityIndicator color="#f97316" size="small" />
                  <Text style={styles.locationLoadingText}>Fetching GPS…</Text>
                </View>
              ) : location ? (
                <View style={styles.locationInfo}>
                  <Text style={styles.locationCoords}>
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </Text>
                  <TouchableOpacity
                    style={styles.refreshLocationBtn}
                    onPress={fetchLocation}
                  >
                    <Text style={styles.refreshLocationText}>↻ Refresh</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.fetchLocationBtn}
                  onPress={fetchLocation}
                >
                  <Text style={styles.fetchLocationText}>Tap to fetch location</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Description (Optional)</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Describe what you see…"
              placeholderTextColor="#4a5568"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!imageUri || !location || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!imageUri || !location || isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.submitButtonIcon}>🚨</Text>
                <Text style={styles.submitButtonText}>Submit Report</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={successModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalIcon}>✅</Text>
            <Text style={styles.modalTitle}>Report Submitted!</Text>
            <Text style={styles.modalSubtitle}>
              Your report has been received and is being processed.
            </Text>
            {reportResult && (
              <View style={styles.modalIdContainer}>
                <Text style={styles.modalIdLabel}>Incident ID</Text>
                <Text style={styles.modalIdValue}>{reportResult.incident_id}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleSuccessClose}
            >
              <Text style={styles.modalButtonText}>Track Status →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0e1a",
  },
  header: {
    overflow: "hidden",
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    backgroundColor: "#111827",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(249,115,22,0.2)",
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
    paddingBottom: 40,
  },
  formContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f1f5f9",
    marginBottom: 12,
  },
  imageButtonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  imageButton: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderStyle: "dashed",
  },
  imageButtonIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94a3b8",
  },
  imagePreviewContainer: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: 220,
    borderRadius: 16,
  },
  removeImageBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeImageText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  locationCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  locationLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    justifyContent: "center",
    paddingVertical: 8,
  },
  locationLoadingText: {
    color: "#94a3b8",
    fontSize: 14,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  locationCoords: {
    fontFamily: "monospace",
    fontSize: 13,
    color: "#22c55e",
    fontWeight: "600",
  },
  refreshLocationBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(249,115,22,0.12)",
  },
  refreshLocationText: {
    color: "#f97316",
    fontSize: 12,
    fontWeight: "700",
  },
  fetchLocationBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  fetchLocationText: {
    color: "#f97316",
    fontSize: 14,
    fontWeight: "600",
  },
  descriptionInput: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 16,
    color: "#f1f5f9",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    minHeight: 90,
    lineHeight: 22,
  },
  submitButton: {
    backgroundColor: "#f97316",
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 8,
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonIcon: {
    fontSize: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  modalContent: {
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#f1f5f9",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  modalIdContainer: {
    backgroundColor: "rgba(249,115,22,0.1)",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 24,
    alignItems: "center",
  },
  modalIdLabel: {
    fontSize: 11,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "700",
    marginBottom: 4,
  },
  modalIdValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#f97316",
    fontFamily: "monospace",
  },
  modalButton: {
    backgroundColor: "#f97316",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
