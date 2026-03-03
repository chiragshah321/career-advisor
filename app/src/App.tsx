import { Routes, Route, NavLink } from 'react-router-dom'
import { Toaster } from 'sonner'
import { LayoutDashboard, Briefcase, Brain, BarChart3, Settings, Zap } from 'lucide-react'
import { useSettingsStore } from '@/store/settingsStore'
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

export default function App() {
  const { apiKey, theme } = useSettingsStore()

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
          <span className="font-bold text-lg tracking-tight">Career Advisor</span>
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
