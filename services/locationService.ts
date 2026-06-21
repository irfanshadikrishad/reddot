import * as Location from 'expo-location'

import { GeoLocation } from '@/types'

export type LocationResult =
  | { ok: true; value: GeoLocation }
  | { ok: false; error: string }

export async function requestOneTimeLocation(): Promise<LocationResult> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync()
    if (permission.status !== 'granted') {
      return {
        ok: false,
        error:
          'Location permission was not granted, so the message will not include location.',
      }
    }

    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    })

    return {
      ok: true,
      value: {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        accuracy: current.coords.accuracy ?? undefined,
      },
    }
  } catch {
    return {
      ok: false,
      error: 'Location is unavailable on this device right now.',
    }
  }
}
