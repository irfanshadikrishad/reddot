import { encryptLocalPayload, decryptLocalPayload } from '@/services/encryptionService'
import { getLocalDatabase } from '@/services/localDatabase'
import { RepositoryResult, SafetyPlan, SafetyPlanInput } from '@/types'

interface SafetyPlanRow {
  id: string
  encrypted_payload: string
}

const SAFETY_PLAN_ID = 'safety-plan'

function databaseError(message: string): RepositoryResult<never> {
  return {
    ok: false,
    error: {
      code: 'database_unavailable',
      message,
    },
  }
}

function invalidDataError(message: string): RepositoryResult<never> {
  return {
    ok: false,
    error: {
      code: 'invalid_data',
      message,
    },
  }
}

function normalizeList(items: string[]): string[] {
  return items.map((item) => item.trim()).filter((item) => item.length > 0)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isSafetyPlan(value: unknown): value is SafetyPlan {
  if (!value || typeof value !== 'object') return false
  const plan = value as Partial<SafetyPlan>
  return (
    typeof plan.id === 'string' &&
    typeof plan.uid === 'string' &&
    isStringArray(plan.triggerSigns) &&
    isStringArray(plan.safePersons) &&
    isStringArray(plan.safeLocations) &&
    isStringArray(plan.importantDocuments) &&
    isStringArray(plan.exitSteps) &&
    isStringArray(plan.escapeBagItems) &&
    (typeof plan.codeWord === 'string' || typeof plan.codeWord === 'undefined') &&
    isStringArray(plan.localResources) &&
    typeof plan.updatedAt === 'number'
  )
}

function buildSafetyPlan(input: SafetyPlanInput): SafetyPlan {
  return {
    id: SAFETY_PLAN_ID,
    uid: input.uid.trim() || 'local',
    triggerSigns: normalizeList(input.triggerSigns),
    safePersons: normalizeList(input.safePersons),
    safeLocations: normalizeList(input.safeLocations),
    importantDocuments: normalizeList(input.importantDocuments),
    exitSteps: normalizeList(input.exitSteps),
    escapeBagItems: normalizeList(input.escapeBagItems),
    codeWord: input.codeWord.trim() ? input.codeWord.trim() : undefined,
    localResources: normalizeList(input.localResources),
    updatedAt: Date.now(),
  }
}

async function decryptPlan(
  row: SafetyPlanRow
): Promise<RepositoryResult<SafetyPlan>> {
  if (row.id !== SAFETY_PLAN_ID) {
    return invalidDataError('A local safety plan could not be read safely.')
  }

  const decrypted = await decryptLocalPayload<SafetyPlan>(row.encrypted_payload)
  if (!decrypted.ok || !isSafetyPlan(decrypted.value)) {
    return invalidDataError('A local safety plan could not be read safely.')
  }

  return { ok: true, value: decrypted.value }
}

export async function getSafetyPlan(): Promise<
  RepositoryResult<SafetyPlan | null>
> {
  try {
    const database = await getLocalDatabase()
    const row = await database.getFirstAsync<SafetyPlanRow>(
      'SELECT id, encrypted_payload FROM safety_plans WHERE id = ?',
      SAFETY_PLAN_ID
    )
    if (!row) return { ok: true, value: null }

    const decrypted = await decryptPlan(row)
    if (!decrypted.ok) return decrypted
    return { ok: true, value: decrypted.value }
  } catch {
    return databaseError('Local safety plans are unavailable. Please try again.')
  }
}

async function persistSafetyPlan(plan: SafetyPlan): Promise<RepositoryResult<SafetyPlan>> {
  const encrypted = await encryptLocalPayload(plan)
  if (!encrypted) {
    return {
      ok: false,
      error: {
        code: 'encryption_unavailable',
        message: 'The safety plan could not be encrypted and was not saved.',
      },
    }
  }

  try {
    const database = await getLocalDatabase()
    await database.runAsync(
      `INSERT INTO safety_plans (id, encrypted_payload, created_at, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         encrypted_payload = excluded.encrypted_payload,
         updated_at = excluded.updated_at`,
      SAFETY_PLAN_ID,
      encrypted,
      plan.updatedAt,
      plan.updatedAt
    )
    return { ok: true, value: plan }
  } catch {
    return {
      ok: false,
      error: {
        code: 'write_failed',
        message: 'The safety plan was not saved. Please try again.',
      },
    }
  }
}

export async function saveSafetyPlan(
  input: SafetyPlanInput
): Promise<RepositoryResult<SafetyPlan>> {
  const plan = buildSafetyPlan(input)
  return persistSafetyPlan(plan)
}

export async function replaceSafetyPlan(
  plan: SafetyPlan
): Promise<RepositoryResult<SafetyPlan>> {
  if (!isSafetyPlan(plan)) {
    return invalidDataError('The safety plan backup could not be validated.')
  }
  return persistSafetyPlan({
    ...plan,
    id: SAFETY_PLAN_ID,
  })
}

export async function deleteSafetyPlan(): Promise<RepositoryResult<void>> {
  try {
    const database = await getLocalDatabase()
    await database.runAsync('DELETE FROM safety_plans WHERE id = ?', SAFETY_PLAN_ID)
    return { ok: true, value: undefined }
  } catch {
    return databaseError('Local safety plans are unavailable. Please try again.')
  }
}
