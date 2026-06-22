import { BundledSafeSpace, GeoLocation, SafeSpaceType } from '@/types'

const RESOURCE_TYPE_LABELS: Record<SafeSpaceType, string> = {
  shelter: 'Shelter',
  hospital: 'Hospital',
  police: 'Police',
  legal: 'Legal',
  counseling: 'Counseling',
  childcare: 'Childcare',
}

export type ResourceSortMode = 'default' | 'distance'

export type PresentedResource = BundledSafeSpace & { distanceKm?: number }

export function resourceTypeLabel(type: SafeSpaceType): string {
  return RESOURCE_TYPE_LABELS[type]
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180
}

export function approximateDistanceKm(
  left: GeoLocation,
  right: GeoLocation
): number {
  const earthRadiusKm = 6371
  const latitudeDelta = toRadians(right.latitude - left.latitude)
  const longitudeDelta = toRadians(right.longitude - left.longitude)
  const startLatitude = toRadians(left.latitude)
  const endLatitude = toRadians(right.latitude)

  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(startLatitude) * Math.cos(endLatitude) *
      Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadiusKm * c
}

export function formatApproximateDistance(distanceKm: number): string {
  if (distanceKm < 1) return Math.round(distanceKm * 1000) + ' m away'
  return distanceKm.toFixed(1) + ' km away'
}

export function sortResourcesByDistance(
  resources: BundledSafeSpace[],
  currentLocation: GeoLocation
): PresentedResource[] {
  return [...resources]
    .map((resource) => ({
      ...resource,
      distanceKm: approximateDistanceKm(currentLocation, resource.location),
    }))
    .sort((left, right) => {
      if (left.distanceKm !== right.distanceKm) {
        return left.distanceKm - right.distanceKm
      }
      return left.name.localeCompare(right.name)
    })
}

export function sortResourcesAlphabetically(
  resources: BundledSafeSpace[]
): PresentedResource[] {
  return [...resources].sort((left, right) => left.name.localeCompare(right.name))
}

export function filterResourcesByType(
  resources: BundledSafeSpace[],
  type: SafeSpaceType | 'all'
): BundledSafeSpace[] {
  if (type === 'all') return resources
  return resources.filter((resource) => resource.type === type)
}
