import * as SMS from 'expo-sms'

import { BD_HOTLINES } from '@/constants/hotlines'
import { listContacts } from '@/services/contactRepository'
import { openDialer } from '@/services/hotlineService'
import { EmergencyContact, Hotline } from '@/types'

export type ChildHandOffResult =
  | { status: 'opened' }
  | { status: 'unavailable'; reason: string }
  | { status: 'failed'; reason: string }

export async function getSafeAdults(): Promise<EmergencyContact[]> {
  const result = await listContacts()
  if (!result.ok) return []
  return result.value.filter((contact) => contact.isSafeAdult)
}

export function findChildHotline(number: string): Hotline | null {
  return BD_HOTLINES.find((hotline) => hotline.number === number) ?? null
}

export async function openChildCall(number: string): Promise<ChildHandOffResult> {
  return openDialer(number)
}

export async function openChildSms(
  recipients: string[],
  message: string
): Promise<ChildHandOffResult> {
  try {
    const available = await SMS.isAvailableAsync()
    if (!available) {
      return {
        status: 'unavailable',
        reason: 'This device cannot open the SMS composer right now.',
      }
    }

    if (recipients.length === 0) {
      return {
        status: 'unavailable',
        reason: 'No safe adult is available for SMS on this device.',
      }
    }

    await SMS.sendSMSAsync(recipients, message)
    return { status: 'opened' }
  } catch {
    return {
      status: 'failed',
      reason: 'The SMS composer could not be opened.',
    }
  }
}
