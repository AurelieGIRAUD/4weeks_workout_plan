import {
  CheckSquare, Dumbbell, Heart, House, Lightbulb, type LucideIcon, Settings, ShoppingCart, Sparkles, Sun,
} from 'lucide-react'
import type { BodyPart, ListType, TrainingType } from './types'

/** Accent per module. Full class strings so Tailwind can see them. */
export const ACCENTS = {
  home: {
    icon: Sun, label: 'Home', to: '/',
    text: 'text-violet-600 dark:text-violet-300',
    soft: 'bg-violet-100 dark:bg-violet-500/15',
    solid: 'bg-violet-500 hover:bg-violet-600 text-white',
    ring: 'focus-visible:ring-violet-400',
    gradient: 'from-violet-500 to-fuchsia-500',
  },
  lists: {
    icon: CheckSquare, label: 'Lists', to: '/lists',
    text: 'text-amber-600 dark:text-amber-300',
    soft: 'bg-amber-100 dark:bg-amber-500/15',
    solid: 'bg-amber-500 hover:bg-amber-600 text-white',
    ring: 'focus-visible:ring-amber-400',
    gradient: 'from-amber-400 to-orange-500',
  },
  workouts: {
    icon: Dumbbell, label: 'Workouts', to: '/workouts',
    text: 'text-emerald-600 dark:text-emerald-300',
    soft: 'bg-emerald-100 dark:bg-emerald-500/15',
    solid: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    ring: 'focus-visible:ring-emerald-400',
    gradient: 'from-emerald-400 to-teal-500',
  },
  beauty: {
    icon: Sparkles, label: 'Beauty', to: '/beauty',
    text: 'text-pink-600 dark:text-pink-300',
    soft: 'bg-pink-100 dark:bg-pink-500/15',
    solid: 'bg-pink-500 hover:bg-pink-600 text-white',
    ring: 'focus-visible:ring-pink-400',
    gradient: 'from-pink-400 to-rose-500',
  },
  settings: {
    icon: Settings, label: 'Settings', to: '/settings',
    text: 'text-sky-600 dark:text-sky-300',
    soft: 'bg-sky-100 dark:bg-sky-500/15',
    solid: 'bg-sky-500 hover:bg-sky-600 text-white',
    ring: 'focus-visible:ring-sky-400',
    gradient: 'from-sky-400 to-indigo-500',
  },
} as const

export type ModuleKey = keyof typeof ACCENTS

export interface ListTypeMeta {
  label: string
  short: string
  icon: LucideIcon
  prefix: string
  chip: string // selected chip classes
  dot: string
  soft: string
  text: string
}

export const LIST_TYPES: Record<ListType, ListTypeMeta> = {
  need_to_buy: {
    label: 'Need to Buy', short: 'Need', icon: ShoppingCart, prefix: 'buy:',
    chip: 'bg-orange-500 text-white', dot: 'bg-orange-500',
    soft: 'bg-orange-100 dark:bg-orange-500/15', text: 'text-orange-600 dark:text-orange-300',
  },
  want_to_buy: {
    label: 'Want to Buy', short: 'Want', icon: Heart, prefix: 'want:',
    chip: 'bg-fuchsia-500 text-white', dot: 'bg-fuchsia-500',
    soft: 'bg-fuchsia-100 dark:bg-fuchsia-500/15', text: 'text-fuchsia-600 dark:text-fuchsia-300',
  },
  chores: {
    label: 'Chores', short: 'Chore', icon: House, prefix: 'chore:',
    chip: 'bg-teal-500 text-white', dot: 'bg-teal-500',
    soft: 'bg-teal-100 dark:bg-teal-500/15', text: 'text-teal-600 dark:text-teal-300',
  },
  todo: {
    label: 'To-Do', short: 'To-Do', icon: CheckSquare, prefix: 'todo:',
    chip: 'bg-blue-500 text-white', dot: 'bg-blue-500',
    soft: 'bg-blue-100 dark:bg-blue-500/15', text: 'text-blue-600 dark:text-blue-300',
  },
  ideas: {
    label: 'Ideas', short: 'Idea', icon: Lightbulb, prefix: 'idea:',
    chip: 'bg-yellow-400 text-yellow-950', dot: 'bg-yellow-400',
    soft: 'bg-yellow-100 dark:bg-yellow-500/15', text: 'text-yellow-700 dark:text-yellow-300',
  },
}

export const LIST_TYPE_ORDER: ListType[] = ['need_to_buy', 'want_to_buy', 'chores', 'todo', 'ideas']

export const TRAINING_META: Record<TrainingType, { label: string; emoji: string }> = {
  strength: { label: 'Strength', emoji: '🏋️' },
  cardio: { label: 'Cardio', emoji: '🏃' },
  yoga: { label: 'Yoga', emoji: '🧘' },
  pilates: { label: 'Pilates', emoji: '🤸' },
  hiit: { label: 'HIIT', emoji: '⚡' },
  mobility: { label: 'Mobility', emoji: '🌀' },
  sport: { label: 'Sport', emoji: '🎾' },
  walk: { label: 'Walk', emoji: '🚶' },
  other: { label: 'Other', emoji: '✨' },
}

export const BODY_PART_LABEL: Record<BodyPart, string> = {
  full_body: 'Full body',
  upper_body: 'Upper body',
  lower_body: 'Lower body',
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  arms: 'Arms',
  core: 'Core',
  glutes: 'Glutes',
  legs: 'Legs',
}

export const TREATMENT_EMOJIS = ['✨', '🧴', '💆', '💅', '🧖', '🌙', '🍋', '💧', '🌸', '🪒', '🦷', '💇']
