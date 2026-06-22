import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  rows,
  getLocalDatabase,
  encryptLocalPayload,
  decryptLocalPayload,
} = vi.hoisted(() => ({
  rows: new Map<string, { id: string; encrypted_payload: string }>(),
  getLocalDatabase: vi.fn(),
  encryptLocalPayload: vi.fn(async (value: unknown) => JSON.stringify(value)),
  decryptLocalPayload: vi.fn(async (payload: string) => {
    try {
      return { ok: true as const, value: JSON.parse(payload) }
    } catch {
      return { ok: false as const, reason: 'invalid_payload' as const }
    }
  }),
}))

vi.mock('@/services/localDatabase', () => ({ getLocalDatabase }))
vi.mock('@/services/encryptionService', () => ({
  encryptLocalPayload,
  decryptLocalPayload,
}))

import {
  deleteSafetyPlan,
  getSafetyPlan,
  replaceSafetyPlan,
  saveSafetyPlan,
} from '@/services/safetyPlanRepository'
import { SafetyPlanInput } from '@/types'

const input: SafetyPlanInput = {
  uid: 'user-1',
  triggerSigns: ['pressure', 'threats'],
  safePersons: ['friend'],
  safeLocations: ['clinic'],
  importantDocuments: ['nid'],
  exitSteps: ['leave'],
  escapeBagItems: ['charger'],
  codeWord: 'blue',
  localResources: ['999'],
}

describe('safetyPlanRepository', () => {
  beforeEach(() => {
    rows.clear()
    getLocalDatabase.mockResolvedValue({
      getFirstAsync: vi.fn(async (_sql: string, id: string) => rows.get(id) ?? null),
      runAsync: vi.fn(async (sql: string, ...parameters: unknown[]) => {
        if (sql.includes('INSERT INTO safety_plans')) {
          rows.set(parameters[0] as string, {
            id: parameters[0] as string,
            encrypted_payload: parameters[1] as string,
          })
          return { changes: 1 }
        }
        const id = parameters[0] as string
        return { changes: rows.delete(id) ? 1 : 0 }
      }),
    })
  })

  it('creates, reads, updates, and deletes the encrypted safety plan', async () => {
    const saved = await saveSafetyPlan(input)
    expect(saved.ok).toBe(true)
    if (!saved.ok) return
    expect(saved.value.id).toBe('safety-plan')
    expect(saved.value.codeWord).toBe('blue')

    await expect(getSafetyPlan()).resolves.toMatchObject({
      ok: true,
      value: expect.objectContaining({ id: 'safety-plan', uid: 'user-1' }),
    })

    const replaced = await replaceSafetyPlan({
      ...saved.value,
      codeWord: undefined,
      updatedAt: saved.value.updatedAt + 1,
    })
    expect(replaced.ok).toBe(true)

    await expect(deleteSafetyPlan()).resolves.toEqual({
      ok: true,
      value: undefined,
    })
    await expect(getSafetyPlan()).resolves.toEqual({ ok: true, value: null })
  })

  it('returns a typed error for corrupt stored data', async () => {
    rows.set('safety-plan', {
      id: 'safety-plan',
      encrypted_payload: 'corrupt',
    })

    const result = await getSafetyPlan()
    expect(result).toMatchObject({ ok: false, error: { code: 'invalid_data' } })
  })
})
