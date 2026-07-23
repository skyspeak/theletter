export type SkillBar = {
  title: string
  status: string
  tone: 'green' | 'amber' | 'red'
  width: number
  chips: string[]
}

export type RoleSuggestion = {
  title: string
  desc: string
  match: number
  highlight?: boolean
}

export type LaborContext = {
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

export type RoadmapMilestone = {
  id: string
  title: string
  summary: string
  badge?: string
  tone: 'primary' | 'neutral' | 'success'
  bullets?: string[]
  copyBlock?: string
}

export type PlanAnalysis = {
  firstName: string
  targetRole: string
  targetCompany: string
  strengths: SkillBar[]
  gaps: SkillBar[]
  roleSuggestions: RoleSuggestion[]
  laborContext: LaborContext | null
  summary: string
}

export type PlanRoadmap = {
  eyebrow: string
  milestones: RoadmapMilestone[]
}

export type PlanResult = {
  id: string
  email: string
  jobDetail: string
  jobSubject: string
  matchedSoc: string | null
  analysis: PlanAnalysis
  roadmap: PlanRoadmap
  fromLetter: boolean
}

export type PlanProfile = {
  email: string
  role: string | null
  industry: string | null
  focusAreas: string[]
  sourceRef: string | null
  linkedinUrl: string | null
  targetJob: string | null
  name: string | null
}

export const PLAN_STORAGE_KEY = 'dearcc_game_plan'
export const PLAN_EMAIL_KEY = 'dearcc_plan_email'
