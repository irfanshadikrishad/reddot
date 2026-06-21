import { Linking } from 'react-native'

import { BD_HOTLINES } from '@/constants/hotlines'
import { Hotline } from '@/types'

export type ExternalActionResult =
  | { status: 'opened' }
  | { status: 'unavailable'; reason: string }
  | { status: 'failed'; reason: string }

const HOTLINE_CATEGORY_LABELS: Record<Hotline['category'], string> = {
  domestic_violence: 'Women and family support',
  child_protection: 'Child safety',
  medical: 'Medical and fire',
  police: 'Police and emergency',
  mental_health: 'Mental health',
}

function normalizeDialString(number: string): string {
  return number.replace(/[^\d+]/g, '')
}

export async function openDialer(
  number: string
): Promise<ExternalActionResult> {
  const dialable = normalizeDialString(number)
  if (!dialable) {
    return {
      status: 'unavailable',
      reason: 'This hotline number is missing from the bundled data.',
    }
  }

  const url = `tel:${dialable}`
  try {
    const supported = await Linking.canOpenURL(url)
    if (!supported) {
      return {
        status: 'unavailable',
        reason: 'This device cannot open the phone dialer.',
      }
    }

    await Linking.openURL(url)
    return { status: 'opened' }
  } catch {
    return {
      status: 'failed',
      reason: 'The phone dialer could not be opened.',
    }
  }
}

export function groupHotlinesByCategory(): Array<{
  category: Hotline['category']
  label: string
  hotlines: Hotline[]
}> {
  const map = new Map<Hotline['category'], Hotline[]>()
  for (const hotline of BD_HOTLINES) {
    const list = map.get(hotline.category)
    if (list) list.push(hotline)
    else map.set(hotline.category, [hotline])
  }

  return Array.from(map.entries()).map(([category, hotlines]) => ({
    category,
    label: HOTLINE_CATEGORY_LABELS[category],
    hotlines,
  }))
}

export function hotlineCategoryLabel(category: Hotline['category']): string {
  return HOTLINE_CATEGORY_LABELS[category]
}
