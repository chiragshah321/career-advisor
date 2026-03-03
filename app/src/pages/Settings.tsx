import { useState } from 'react'
import { useSettingsStore } from '@/store/settingsStore'
import { useJobStore } from '@/store/jobStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DEFAULT_PROFILE } from '@/lib/profile'
import { toast } from 'sonner'
import { Eye, EyeOff, Key, Target, User, Palette, Trash2 } from 'lucide-react'

export default function Settings() {
  const {
    weeklyTarget,
    setWeeklyTarget,
    apiKey,
    setApiKey,
    theme,
    setTheme,
    profileOverride,
    setProfileOverride,
    fitPreferences,
    setFitPreference,
  } = useSettingsStore()
  const { clearAll } = useJobStore()

  const [showKey, setShowKey] = useState(false)
  const [localKey, setLocalKey] = useState(apiKey)
  const [localProfile, setLocalProfile] = useState(profileOverride ?? DEFAULT_PROFILE)
  const [clearOpen, setClearOpen] = useState(false)

  function saveKey() {
    setApiKey(localKey.trim())
    toast.success('API key saved')
  }

  function saveProfile() {
    setProfileOverride(localProfile.trim() || null)
    toast.success('Profile saved')
  }

  function handleClearAll() {
    clearAll()
    setClearOpen(false)
    toast.success('All data cleared')
  }

  return (
    <div className="px-6 py-6 space-y-4 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Configure your job search preferences</p>
      </div>

      {/* API Key */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Key className="w-4 h-4" />
            Anthropic API Key
          </CardTitle>
          <CardDescription className="text-xs">
            Required for AI fit scoring and outreach generation
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={localKey}
                onChange={(e) => setLocalKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full h-10 px-3 pr-10 rounded-md border bg-background text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/50"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button onClick={saveKey} className="bg-[#00BFA5] hover:bg-[#00BFA5]/90 text-white">
              Save
            </Button>
          </div>
          {apiKey && <p className="text-xs text-green-600 dark:text-green-400">API key configured</p>}
        </CardContent>
      </Card>

      {/* Weekly target */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="w-4 h-4" />
            Weekly Application Goal
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={50}
            value={weeklyTarget}
            onChange={(e) => setWeeklyTarget(Number(e.target.value))}
            className="w-20 h-10 px-3 rounded-md border bg-background text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/50"
          />
          <span className="text-sm text-muted-foreground">applications per week</span>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Theme
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 flex items-center gap-3">
          <button
            onClick={() => setTheme('light')}
            className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
              theme === 'light'
                ? 'bg-[#00BFA5] text-white border-[#00BFA5]'
                : 'bg-background border-border hover:bg-muted'
            }`}
          >
            Light
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
              theme === 'dark'
                ? 'bg-[#00BFA5] text-white border-[#00BFA5]'
                : 'bg-background border-border hover:bg-muted'
            }`}
          >
            Dark
          </button>
        </CardContent>
      </Card>

      {/* Fit preferences */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold">Fit Preferences</CardTitle>
          <CardDescription className="text-xs">Prioritize these domains in AI scoring</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {(Object.keys(fitPreferences) as (keyof typeof fitPreferences)[]).map((key) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm capitalize">{key}</span>
              <Switch
                checked={fitPreferences[key]}
                onCheckedChange={(v) => setFitPreference(key, v)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Profile editor */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <User className="w-4 h-4" />
            Candidate Profile
          </CardTitle>
          <CardDescription className="text-xs">
            This is used by AI to score fit and generate outreach
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          <textarea
            value={localProfile}
            onChange={(e) => setLocalProfile(e.target.value)}
            rows={10}
            className="w-full px-3 py-2 rounded-md border bg-background text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/50 resize-y"
          />
          <Button
            onClick={saveProfile}
            className="bg-[#00BFA5] hover:bg-[#00BFA5]/90 text-white"
          >
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Resume upload placeholder */}
      <Card className="border-dashed">
        <CardContent className="px-4 py-6 text-center text-muted-foreground">
          <p className="text-sm font-medium">Resume / LinkedIn Upload</p>
          <p className="text-xs mt-1">Upload resume or LinkedIn export — coming soon</p>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-destructive">
            <Trash2 className="w-4 h-4" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <Button
            variant="destructive"
            onClick={() => setClearOpen(true)}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Data
          </Button>
        </CardContent>
      </Card>

      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear all data?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete all your jobs. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearAll}>
              Yes, delete all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
