/**
 * Utility to manage a persistent device ID for anonymous event tracking.
 * Syncs with localStorage to maintain the same ID across sessions.
 */
export function getDeviceId(): string {
    const STORAGE_KEY = 'rs_device_id';
    let deviceId = localStorage.getItem(STORAGE_KEY);

    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem(STORAGE_KEY, deviceId);
    }

    return deviceId;
}
