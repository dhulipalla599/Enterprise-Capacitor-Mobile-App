// services/native/geolocation.service.ts
import { Capacitor } from '@capacitor/core';
import { Geolocation, Position } from '@capacitor/geolocation';

export interface LocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

class GeolocationService {
  async getCurrentPosition(): Promise<LocationResult> {
    if (!Capacitor.isNativePlatform()) {
      return this.getBrowserLocation();
    }

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    return this.formatPosition(position);
  }

  async watchPosition(callback: (location: LocationResult) => void): Promise<string> {
    if (!Capacitor.isNativePlatform()) {
      return this.watchBrowserLocation(callback);
    }

    const watchId = await Geolocation.watchPosition(
      { enableHighAccuracy: true },
      (position, err) => {
        if (position) {
          callback(this.formatPosition(position));
        }
      }
    );

    return watchId;
  }

  async clearWatch(watchId: string): Promise<void> {
    await Geolocation.clearWatch({ id: watchId });
  }

  private formatPosition(position: Position): LocationResult {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    };
  }

  private getBrowserLocation(): Promise<LocationResult> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        },
        (error) => reject(error),
        { enableHighAccuracy: true }
      );
    });
  }

  private watchBrowserLocation(callback: (location: LocationResult) => void): string {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => console.error('Geolocation error:', error),
      { enableHighAccuracy: true }
    );

    return String(watchId);
  }
}

export const geolocationService = new GeolocationService();
