import * as SMS from 'expo-sms'

import { BD_HOTLINES } from '@/constants/hotlines'
import { listContacts } from '@/services/contactRepository'
import { requestOneTimeLocation } from '@/services/locationService'
import { getSetting, setSetting } from '@/services/settingsRepository'
import { GeoLocation, SosDraftSettings } from '@/types'

export type SosPreparationResult =
  | {
      ok: true
      value: {
        message: string
        recipients: string[]
        location: GeoLocation | null
        locationStatus: 'included' | 'unavailable' | 'disabled'
      }
    }
  | { ok: false; error: string }

const DEFAULT_MESSAGE =
  'I need help. Please call me or come to my location if you can.'

function formatLocation(location: GeoLocation): string {
  return `https://maps.google.com/?q=${location.latitude},${location.longitude}`
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '')
}

export async function loadSosDraftSettings(): Promise<SosDraftSettings> {
  const [message, includeLocation, selectedContactIds] = await Promise.all([
    getSetting<string>('default_sos_message'),
    getSetting<boolean>('include_location_in_sos'),
    getSetting<string[]>('selected_contact_ids'),
  ])

  return {
    defaultMessage:
      message.ok && message.value ? message.value : DEFAULT_MESSAGE,
    includeLocation:
      includeLocation.ok && typeof includeLocation.value === 'boolean'
        ? includeLocation.value
        : true,
    selectedContactIds:
      selectedContactIds.ok && Array.isArray(selectedContactIds.value)
        ? selectedContactIds.value
        : [],
  }
}

export async function saveSosDraftSettings(
  settings: SosDraftSettings
): Promise<void> {
  await Promise.all([
    setSetting('default_sos_message', settings.defaultMessage),
    setSetting('include_location_in_sos', settings.includeLocation),
    setSetting('selected_contact_ids', settings.selectedContactIds),
  ])
}

export async function prepareSosMessage(): Promise<SosPreparationResult> {
  const settings = await loadSosDraftSettings()
  const contactsResult = await listContacts()
  if (!contactsResult.ok) {
    return { ok: false, error: contactsResult.error.message }
  }

  const selectedContacts = contactsResult.value.filter((contact) =>
    settings.selectedContactIds.includes(contact.id)
  )

  const recipients = selectedContacts
    .filter((contact) => contact.notifyBySMS)
    .map((contact) => normalizePhone(contact.phone))
    .filter(Boolean)

  const parts = [settings.defaultMessage.trim() || DEFAULT_MESSAGE]
  let location: GeoLocation | null = null
  let locationStatus: 'included' | 'unavailable' | 'disabled' = 'disabled'

  if (settings.includeLocation) {
    const locationResult = await requestOneTimeLocation()
    if (locationResult.ok) {
      location = locationResult.value
      parts.push(`Location: ${formatLocation(locationResult.value)}`)
      locationStatus = 'included'
    } else {
      locationStatus = 'unavailable'
    }
  }

  return {
    ok: true,
    value: {
      message: parts.join('\n\n'),
      recipients,
      location,
      locationStatus,
    },
  }
}

export async function canSendSms(): Promise<boolean> {
  return SMS.isAvailableAsync()
}

export function hotlineNumbers(): string[] {
  return BD_HOTLINES.filter((hotline) => hotline.available24h).map(
    (hotline) => hotline.number
  )
}
