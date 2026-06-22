import { describe, expect, it } from 'vitest'

import { REVIEWED_SAFE_SPACES } from '@/constants/resources'
import {
  approximateDistanceKm,
  filterResourcesByType,
  resourceTypeLabel,
  sortResourcesByDistance,
} from '@/services/resourceService'

describe('resourceService', () => {
  it('labels resource types for the screen', () => {
    expect(resourceTypeLabel('legal')).toBe('Legal')
  })

  it('filters reviewed resources by type', () => {
    const legal = filterResourcesByType(REVIEWED_SAFE_SPACES, 'legal')
    expect(legal.length).toBeGreaterThan(0)
    expect(legal.every((item) => item.type === 'legal')).toBe(true)
  })

  it('sorts by approximate distance without mutating the input', () => {
    const origin = { latitude: 23.8103, longitude: 90.4125 }
    const sorted = sortResourcesByDistance(REVIEWED_SAFE_SPACES, origin)
    const firstDistance = sorted[0].distanceKm as number
    const lastDistance = sorted[sorted.length - 1].distanceKm as number
    expect(firstDistance).toBeLessThanOrEqual(lastDistance)
    expect(REVIEWED_SAFE_SPACES[0].id).toBe('dhaka_police_victim_support')
  })

  it('computes a finite approximate distance', () => {
    const distance = approximateDistanceKm(
      { latitude: 23.8103, longitude: 90.4125 },
      { latitude: 23.7337, longitude: 90.3955 }
    )
    expect(Number.isFinite(distance)).toBe(true)
    expect(distance).toBeGreaterThan(0)
  })
})
