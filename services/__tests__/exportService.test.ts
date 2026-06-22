import { beforeEach, describe, expect, it, vi } from 'vitest'

const { randomBytes, replaceSafetyPlan, documentPicker, fileSystem } = vi.hoisted(
  () => ({
    randomBytes: vi.fn(async () => new Uint8Array(16).fill(7)),
    replaceSafetyPlan: vi.fn(),
    documentPicker: vi.fn(),
    fileSystem: {
      readAsStringAsync: vi.fn(),
      EncodingType: { UTF8: 'utf8' },
    },
  })
)

vi.mock('expo-crypto', () => ({ getRandomBytesAsync: randomBytes }))
vi.mock('expo-document-picker', () => ({ getDocumentAsync: documentPicker }))
vi.mock('expo-file-system/legacy', () => fileSystem)
vi.mock('@/services/safetyPlanRepository', () => ({ replaceSafetyPlan }))

import {
  createSafetyPlanBackup,
  restoreSafetyPlanBackup,
  restoreSafetyPlanBackupFromFile,
} from '@/services/exportService'
import { SafetyPlan } from '@/types'

const plan: SafetyPlan = {
  id: 'safety-plan',
  uid: 'user-1',
  triggerSigns: ['pressure'],
  safePersons: ['friend'],
  safeLocations: ['clinic'],
  importantDocuments: ['nid'],
  exitSteps: ['leave'],
  escapeBagItems: ['charger'],
  codeWord: 'blue',
  localResources: ['999'],
  updatedAt: 123456,
}

describe('exportService', () => {
  beforeEach(() => {
    replaceSafetyPlan.mockResolvedValue({ ok: true, value: plan })
    documentPicker.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///backup.json' }],
    })
    fileSystem.readAsStringAsync.mockResolvedValue('')
  })

  it('creates and restores an encrypted safety-plan backup', async () => {
    const backup = await createSafetyPlanBackup(plan, 'passphrase')
    expect(backup.ok).toBe(true)
    if (!backup.ok) return

    const restored = await restoreSafetyPlanBackup(backup.value, 'passphrase')
    expect(restored).toEqual({ ok: true, value: plan })
    expect(replaceSafetyPlan).toHaveBeenCalledTimes(1)
  })

  it('rejects a wrong backup passphrase without replacing local data', async () => {
    const backup = await createSafetyPlanBackup(plan, 'passphrase')
    expect(backup.ok).toBe(true)
    if (!backup.ok) return

    const restored = await restoreSafetyPlanBackup(backup.value, 'wrong')
    expect(restored.ok).toBe(false)
    expect(replaceSafetyPlan).not.toHaveBeenCalled()
  })

  it('imports a backup file through the picker', async () => {
    const backup = await createSafetyPlanBackup(plan, 'passphrase')
    expect(backup.ok).toBe(true)
    if (!backup.ok) return

    fileSystem.readAsStringAsync.mockResolvedValueOnce(backup.value)

    const restored = await restoreSafetyPlanBackupFromFile('passphrase')
    expect(restored).toEqual({ ok: true, value: plan })
  })
})
