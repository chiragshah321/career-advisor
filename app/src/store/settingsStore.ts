import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
}

interface SettingsStore extends Settings {
  setWeeklyTarget: (n: number) => void
  setApiKey: (key: string) => void
  setTheme: (theme: 'light' | 'dark') => void
  setProfileOverride: (profile: string | null) => void
  setFitPreference: (key: keyof Settings['fitPreferences'], value: boolean) => void
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
      setWeeklyTarget: (weeklyTarget) => set({ weeklyTarget }),
      setApiKey: (apiKey) => set({ apiKey }),
      setTheme: (theme) => set({ theme }),
      setProfileOverride: (profileOverride) => set({ profileOverride }),
      setFitPreference: (key, value) =>
        set((state) => ({
          fitPreferences: { ...state.fitPreferences, [key]: value },
        })),
    }),
    { name: 'job_tracker_settings' }
  )
)
