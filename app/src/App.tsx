import { Routes, Route, NavLink } from 'react-router-dom'
import { Toaster } from 'sonner'
import { LayoutDashboard, Briefcase, Brain, BarChart3, Settings, Zap } from 'lucide-react'
import { useSettingsStore } from '@/store/settingsStore'
import { useJobStore } from '@/store/jobStore'
import { useEffect } from 'react'
import Dashboard from '@/pages/Dashboard'
import Jobs from '@/pages/Jobs'
import Strategist from '@/pages/Strategist'
import Reports from '@/pages/Reports'
import SettingsPage from '@/pages/Settings'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/strategist', label: 'Strategist', icon: Brain },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
]

const STORAGE_KEY = 'job_tracker_jobs'

// Sync jobs saved by the Chrome extension (chrome.storage.local) into the app's localStorage store.
// The extension can't write to page localStorage directly, so it uses chrome.storage.local as a bridge.
function useChromeStorageSync() {
  useEffect(() => {
    const chromeStorage = (globalThis as unknown as { chrome?: { storage?: { local?: { get: (keys: string[], cb: (r: Record<string, unknown>) => void) => void; remove: (key: string) => void } } } }).chrome?.storage?.local
    if (!chromeStorage) return

    chromeStorage.get([STORAGE_KEY], (result) => {
      const raw = result[STORAGE_KEY]
      if (!raw) return
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
        const incoming = parsed?.state?.jobs ?? []
        if (!incoming.length) return

        useJobStore.setState((state) => {
          const existingIds = new Set(state.jobs.map((j) => j.id))
          const existingUrls = new Set(state.jobs.map((j) => j.url))
          const newJobs = incoming.filter(
            (j: { id: string; url: string }) => !existingIds.has(j.id) && !existingUrls.has(j.url)
          )
          if (!newJobs.length) return state
          return { jobs: [...newJobs, ...state.jobs] }
        })

        chromeStorage.remove(STORAGE_KEY)
      } catch {
        // ignore malformed data
      }
    })
  }, [])
}

export default function App() {
  const { apiKey, theme } = useSettingsStore()
  useChromeStorageSync()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r bg-[#0F172A] text-white shrink-0">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
          <div className="w-7 h-7 rounded-lg bg-[#00BFA5] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">CareerOS</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#00BFA5]/20 text-[#00BFA5]'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                )
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-white/10">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-[#00BFA5]/20 text-[#00BFA5]' : 'text-white/60 hover:text-white hover:bg-white/5'
              )
            }
          >
            <Settings className="w-4 h-4" />
            Settings
          </NavLink>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* API key banner */}
        {!apiKey && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-sm text-amber-800 dark:text-amber-200 flex items-center justify-between shrink-0">
            <span>
              Add your Anthropic API key in{' '}
              <NavLink to="/settings" className="underline font-medium">
                Settings
              </NavLink>{' '}
              to enable AI features.
            </span>
          </div>
        )}

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/strategist" element={<Strategist />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t flex z-40">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
                  isActive ? 'text-[#00BFA5]' : 'text-muted-foreground'
                )
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
                isActive ? 'text-[#00BFA5]' : 'text-muted-foreground'
              )
            }
          >
            <Settings className="w-5 h-5" />
            Settings
          </NavLink>
        </nav>
      </div>

      <Toaster position="bottom-right" richColors />
    </div>
  )
}
