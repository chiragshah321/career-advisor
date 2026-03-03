import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

export interface QuickLink {
  id: string
  name: string
  url: string
}

interface Settings {
  weeklyTarget: number
  apiKey: string
  theme: 'light' | 'dark'
  profileOverride: string | null
  fitPreferences: {
    insurtech: boolean
    proptech: boolean
    healthtech: boolean
    saas: boolean
  }
  quickLinks: QuickLink[]
}

interface SettingsStore extends Settings {
  setWeeklyTarget: (n: number) => void
  setApiKey: (key: string) => void
  setTheme: (theme: 'light' | 'dark') => void
  setProfileOverride: (profile: string | null) => void
  setFitPreference: (key: keyof Settings['fitPreferences'], value: boolean) => void
  addQuickLink: (link: Omit<QuickLink, 'id'>) => void
  removeQuickLink: (id: string) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      weeklyTarget: 10,
      apiKey: '',
      theme: 'light',
      profileOverride: null,
      fitPreferences: {
        insurtech: true,
        proptech: true,
        healthtech: true,
        saas: true,
      },
      quickLinks: [],
      setWeeklyTarget: (weeklyTarget) => set({ weeklyTarget }),
      setApiKey: (apiKey) => set({ apiKey }),
      setTheme: (theme) => set({ theme }),
      setProfileOverride: (profileOverride) => set({ profileOverride }),
      setFitPreference: (key, value) =>
        set((state) => ({
          fitPreferences: { ...state.fitPreferences, [key]: value },
        })),
      addQuickLink: (link) =>
        set((state) => ({
          quickLinks: [...state.quickLinks, { ...link, id: uuidv4() }],
        })),
      removeQuickLink: (id) =>
        set((state) => ({
          quickLinks: state.quickLinks.filter((l) => l.id !== id),
        })),
    }),
    { name: 'job_tracker_settings' }
  )
)
