import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { PlanResult } from '../lib/planTypes'
import { PLAN_STORAGE_KEY } from '../lib/planTypes'

type PlanContextValue = {
  plan: PlanResult | null
  setPlan: (plan: PlanResult | null) => void
  clearPlan: () => void
}

const PlanContext = createContext<PlanContextValue | null>(null)

function readStored(): PlanResult | null {
  try {
    const raw = sessionStorage.getItem(PLAN_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PlanResult
  } catch {
    return null
  }
}

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlanState] = useState<PlanResult | null>(() => readStored())

  const setPlan = useCallback((next: PlanResult | null) => {
    setPlanState(next)
    try {
      if (next) sessionStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(next))
      else sessionStorage.removeItem(PLAN_STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const clearPlan = useCallback(() => setPlan(null), [setPlan])

  const value = useMemo(
    () => ({ plan, setPlan, clearPlan }),
    [plan, setPlan, clearPlan],
  )

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
}

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext)
  if (!ctx) throw new Error('usePlan must be used within PlanProvider')
  return ctx
}
