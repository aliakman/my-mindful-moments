/**
 * useGeolocation — Handles geolocation permissions and position tracking.
 * requestPosition now returns a Promise<Position> so callers can await the result.
 */
import { useState, useEffect, useCallback } from "react";

export interface Position {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface GeolocationState {
  position: Position | null;
  error: string | null;
  permissionStatus: "prompt" | "granted" | "denied" | "unavailable";
  loading: boolean;
}

/** Calculate distance between two coordinates in meters (Haversine formula) */
export const getDistanceMeters = (
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const useGeolocation = (watch = false) => {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    permissionStatus: "prompt",
    loading: false,
  });

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setState((s) => ({ ...s, permissionStatus: "unavailable" }));
      return;
    }
    if ("permissions" in navigator) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        setState((s) => ({ ...s, permissionStatus: result.state as any }));
        result.addEventListener("change", () => {
          setState((s) => ({ ...s, permissionStatus: result.state as any }));
        });
      });
    }
  }, []);

  /** Request permission and get current position. Returns the position or null. */
  const requestPosition = useCallback((): Promise<Position | null> => {
    if (!("geolocation" in navigator)) {
      setState((s) => ({ ...s, error: "Geolocation not available", permissionStatus: "unavailable" }));
      return Promise.resolve(null);
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const position: Position = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setState({
            position,
            error: null,
            permissionStatus: "granted",
            loading: false,
          });
          resolve(position);
        },
        (err) => {
          console.error("[Geolocation] Error:", err.message, `(code ${err.code})`);
          setState((s) => ({
            ...s,
            error: err.message,
            permissionStatus: err.code === 1 ? "denied" : s.permissionStatus,
            loading: false,
          }));
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    });
  }, []);

  useEffect(() => {
    if (!watch || !("geolocation" in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setState((s) => ({
          ...s,
          position: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          },
          permissionStatus: "granted",
        }));
      },
      () => {},
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [watch]);

  return { ...state, requestPosition };
};
