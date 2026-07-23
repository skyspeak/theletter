import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Fuse from 'fuse.js'
import type { LaborContext } from './plan_types.js'

type OccRow = {
  soc: string
  title: string
  entrySalary: number
  medianSalary: number
  openPositions: number
  competitionLevel: string | null
  aiDisruptionLabel: string | null
  karpathyExposure: number | null
  description: string
}

let cache: OccRow[] | null = null
let fuse: Fuse<OccRow> | null = null

function loadOccupations(): OccRow[] {
  if (cache) return cache
  const path = resolve(process.cwd(), 'public/data/occupations.json')
  const raw = JSON.parse(readFileSync(path, 'utf8')) as OccRow[]
  cache = raw
  fuse = new Fuse(raw, {
    keys: ['title'],
    threshold: 0.4,
    includeScore: true,
  })
  return cache
}

export function matchOccupation(query: string | null | undefined): LaborContext | null {
  const q = (query ?? '').trim()
  if (!q || q.length < 3) return null
  loadOccupations()
  if (!fuse) return null
  const hits = fuse.search(q, { limit: 1 })
  const hit = hits[0]
  if (!hit || (hit.score ?? 1) > 0.45) return null
  const o = hit.item
  return {
    soc: o.soc,
    title: o.title,
    entrySalary: o.entrySalary,
    medianSalary: o.medianSalary,
    openPositions: o.openPositions,
    competitionLevel: o.competitionLevel,
    aiDisruptionLabel: o.aiDisruptionLabel,
    karpathyExposure: o.karpathyExposure,
    description: o.description,
  }
}
