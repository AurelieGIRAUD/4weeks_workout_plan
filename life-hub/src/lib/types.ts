export type ListType = 'want_to_buy' | 'need_to_buy' | 'chores' | 'todo' | 'ideas'

export interface Profile {
  id: string
  email: string
  display_name: string | null
  timezone: string
  reminder_hour: number
  quick_add_targets: Partial<Record<ListType, string>>
  ai_prefs: Record<string, unknown>
  created_at: string
}

export interface PublicProfile {
  id: string
  email: string
  display_name: string | null
}

export interface List {
  id: string
  owner_id: string
  type: ListType
  name: string
  is_default: boolean
  created_at: string
  owner?: PublicProfile | null
  members?: { user_id: string }[]
}

export interface ListItem {
  id: string
  list_id: string
  created_by: string | null
  title: string
  note: string | null
  category: string | null
  tags: string[]
  done: boolean
  done_at: string | null
  done_by: string | null
  archived_at: string | null
  position: number | null
  created_at: string
  updated_at: string
}

export interface ListMember {
  list_id: string
  user_id: string
  created_at: string
  profile: PublicProfile | null
}

export interface ListInvite {
  list_id: string
  email: string
  created_at: string
}

export const TRAINING_TYPES = ['strength', 'cardio', 'yoga', 'pilates', 'hiit', 'mobility', 'sport', 'walk', 'other'] as const
export type TrainingType = (typeof TRAINING_TYPES)[number]

export const BODY_PARTS = [
  'full_body', 'upper_body', 'lower_body', 'chest', 'back', 'shoulders', 'arms', 'core', 'glutes', 'legs',
] as const
export type BodyPart = (typeof BODY_PARTS)[number]

export interface Workout {
  id: string
  user_id: string
  date: string // yyyy-MM-dd
  training_type: TrainingType
  body_parts: BodyPart[]
  duration_min: number
  notes: string | null
  created_at: string
}

export interface Treatment {
  id: string
  user_id: string
  name: string
  emoji: string
  interval_days: number
  notes: string | null
  active: boolean
  remind: boolean
  snoozed_until: string | null
  last_notified_on: string | null
  created_at: string
}

export interface TreatmentStatus extends Treatment {
  last_done: string | null
  log_count: number
  next_due: string | null
  effective_due: string | null
}

export interface TreatmentLog {
  id: string
  treatment_id: string
  user_id: string
  done_on: string
  note: string | null
  created_at: string
}
