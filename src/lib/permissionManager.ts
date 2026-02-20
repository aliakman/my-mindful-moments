/**
 * permissionManager — Centralized permission handling.
 * Requests all permissions once, stores approval state, and provides
 * utilities for checking status and directing users to OS settings.
 */

const PERMISSIONS_GRANTED_KEY = "remind-me-permissions-granted";
const LOG_PREFIX = "[PermissionManager]";

const isNative = () =>
  typeof (window as any).Capacitor !== "undefined" &&
  (window as any).Capacitor.isNativePlatform?.();

export interface PermissionStatus {
  notifications: "granted" | "denied" | "prompt" | "unavailable";
  location: "granted" | "denied" | "prompt" | "unavailable";
}

/** Check if we've already completed the permission flow */
export const hasCompletedPermissionFlow = (): boolean => {
  return localStorage.getItem(PERMISSIONS_GRANTED_KEY) === "true";
};

/** Mark that the permission flow has been completed */
const markPermissionsCompleted = () => {
  localStorage.setItem(PERMISSIONS_GRANTED_KEY, "true");
};

/** Get current permission statuses */
export const getPermissionStatus = async (): Promise<PermissionStatus> => {
  const status: PermissionStatus = {
    notifications: "unavailable",
    location: "unavailable",
  };

  // Notifications
  if (isNative()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const result = await LocalNotifications.checkPermissions();
      status.notifications = result.display === "granted" ? "granted" : result.display === "denied" ? "denied" : "prompt";
    } catch {
      status.notifications = "unavailable";
    }
  } else if ("Notification" in window) {
    status.notifications = Notification.permission as any;
    if (status.notifications === "default" as any) status.notifications = "prompt";
  }

  // Location
  if (isNative()) {
    try {
      const { Geolocation } = await import("@capacitor/geolocation");
      const result = await Geolocation.checkPermissions();
      status.location = result.location === "granted" ? "granted" : result.location === "denied" ? "denied" : "prompt";
    } catch {
      status.location = "unavailable";
    }
  } else if ("geolocation" in navigator && "permissions" in navigator) {
    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      status.location = result.state as any;
      if (status.location === "default" as any) status.location = "prompt";
    } catch {
      status.location = "prompt"; // assume available, will prompt on use
    }
  } else if ("geolocation" in navigator) {
    status.location = "prompt";
  }

  return status;
};

/** Request all permissions at once. Returns final statuses. */
export const requestAllPermissions = async (): Promise<PermissionStatus> => {
  console.log(`${LOG_PREFIX} Requesting all permissions...`);
  const status: PermissionStatus = { notifications: "unavailable", location: "unavailable" };

  // 1. Notifications
  if (isNative()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const result = await LocalNotifications.requestPermissions();
      status.notifications = result.display === "granted" ? "granted" : "denied";
      console.log(`${LOG_PREFIX} Native notifications: ${status.notifications}`);
    } catch (e) {
      console.error(`${LOG_PREFIX} Native notification permission error:`, e);
    }
  } else if ("Notification" in window) {
    if (Notification.permission === "granted") {
      status.notifications = "granted";
    } else if (Notification.permission !== "denied") {
      const result = await Notification.requestPermission();
      status.notifications = result === "granted" ? "granted" : "denied";
    } else {
      status.notifications = "denied";
    }
    console.log(`${LOG_PREFIX} Web notifications: ${status.notifications}`);
  }

  // 2. Location
  if (isNative()) {
    try {
      const { Geolocation } = await import("@capacitor/geolocation");
      const result = await Geolocation.requestPermissions();
      status.location = result.location === "granted" ? "granted" : "denied";
      console.log(`${LOG_PREFIX} Native location: ${status.location}`);
    } catch (e) {
      console.error(`${LOG_PREFIX} Native location permission error:`, e);
    }
  } else if ("geolocation" in navigator) {
    try {
      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(),
          (err) => { if (err.code === 1) reject(err); else resolve(); },
          { timeout: 10000 }
        );
      });
      status.location = "granted";
    } catch {
      status.location = "denied";
    }
    console.log(`${LOG_PREFIX} Web location: ${status.location}`);
  }

  markPermissionsCompleted();
  return status;
};

/** Opens native app settings hint. */
export const openAppSettings = async (): Promise<boolean> => {
  // On native, guide users to open Settings manually
  return false;
};
