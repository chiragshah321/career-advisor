import { useRef, useState } from 'react'
import { useSettingsStore } from '@/store/settingsStore'
import { useJobStore } from '@/store/jobStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DEFAULT_PROFILE } from '@/lib/profile'
import { parseProfileFromPDF } from '@/lib/api'
import { extractTextFromPDF } from '@/lib/parseResume'
import { toast } from 'sonner'
import { CheckCircle2, ChevronDown, Eye, EyeOff, FileText, Key, Loader2, Link, Plus, Target, Upload, User, Palette, Trash2, X } from 'lucide-react'

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
    quickLinks,
    addQuickLink,
    removeQuickLink,
  } = useSettingsStore()
  const { clearAll } = useJobStore()

  const CARDS = ['api-key', 'weekly-target', 'theme', 'fit-prefs', 'profile', 'profile-import', 'quick-links', 'danger'] as const
  type CardId = typeof CARDS[number]
  const [open, setOpen] = useState<Record<CardId, boolean>>({
    'api-key': false, 'weekly-target': false, theme: false, 'fit-prefs': false,
    profile: false, 'profile-import': false, 'quick-links': false, danger: false,
  })
  function toggle(id: CardId) { setOpen((prev) => ({ ...prev, [id]: !prev[id] })) }

  const [showKey, setShowKey] = useState(false)
  const [localKey, setLocalKey] = useState(apiKey)
  const [localProfile, setLocalProfile] = useState(profileOverride ?? DEFAULT_PROFILE)
  const [clearOpen, setClearOpen] = useState(false)
  const [newLinkName, setNewLinkName] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')

  function handleAddLink() {
    const name = newLinkName.trim()
    const url = newLinkUrl.trim()
    if (!name || !url) return
    addQuickLink({ name, url: url.startsWith('http') ? url : `https://${url}` })
    setNewLinkName('')
    setNewLinkUrl('')
  }

  const [linkedinFile, setLinkedinFile] = useState<File | null>(null)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [linkedinLoading, setLinkedinLoading] = useState(false)
  const [resumeLoading, setResumeLoading] = useState(false)

  const linkedinInputRef = useRef<HTMLInputElement>(null)
  const resumeInputRef = useRef<HTMLInputElement>(null)
  const profileCardRef = useRef<HTMLDivElement>(null)
  const [profileJustUpdated, setProfileJustUpdated] = useState(false)
  const [profileUpdatedFrom, setProfileUpdatedFrom] = useState<'linkedin' | 'resume' | null>(null)

  const isParsingProfile = linkedinLoading || resumeLoading

  function saveKey() {
    setApiKey(localKey.trim())
    toast.success('API key saved')
  }

  function saveProfile() {
    setProfileOverride(localProfile.trim() || null)
    toast.success('Profile saved')
  }

  async function handleParseFromPDF(source: 'linkedin' | 'resume') {
    const file = source === 'linkedin' ? linkedinFile : resumeFile
    if (!file) return
    if (!apiKey) {
      toast.error('Add your Anthropic API key in Settings first')
      return
    }

    const setLoading = source === 'linkedin' ? setLinkedinLoading : setResumeLoading
    setLoading(true)
    try {
      toast.info('Extracting text from PDF...')
      const text = await extractTextFromPDF(file)
      if (!text.trim()) throw new Error('Could not extract text from this PDF. Try a text-based PDF.')
      toast.info('Parsing with AI...')
      const profile = await parseProfileFromPDF(text, source)
      setLocalProfile(profile)
      setProfileUpdatedFrom(source)
      setProfileJustUpdated(true)
      profileCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setTimeout(() => setProfileJustUpdated(false), 2500)
      toast.success('Profile extracted — review and click Save Profile')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to parse PDF')
    } finally {
      setLoading(false)
    }
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
        <CardHeader className="pb-2 pt-4 px-4 cursor-pointer select-none" onClick={() => toggle('api-key')}>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Key className="w-4 h-4" />
            Anthropic API Key
            <ChevronDown className={`w-4 h-4 ml-auto text-muted-foreground transition-transform ${open['api-key'] ? 'rotate-180' : ''}`} />
          </CardTitle>
          {!open['api-key'] && apiKey && <CardDescription className="text-xs text-green-600 dark:text-green-400">Configured</CardDescription>}
          {!open['api-key'] && !apiKey && <CardDescription className="text-xs">Required for AI fit scoring and outreach generation</CardDescription>}
        </CardHeader>
        {open['api-key'] && <CardContent className="px-4 pb-4 space-y-2">
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
        </CardContent>}
      </Card>

      {/* Weekly target */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4 cursor-pointer select-none" onClick={() => toggle('weekly-target')}>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="w-4 h-4" />
            Weekly Application Goal
            <ChevronDown className={`w-4 h-4 ml-auto text-muted-foreground transition-transform ${open['weekly-target'] ? 'rotate-180' : ''}`} />
          </CardTitle>
          {!open['weekly-target'] && <CardDescription className="text-xs">{weeklyTarget} applications per week</CardDescription>}
        </CardHeader>
        {open['weekly-target'] && <CardContent className="px-4 pb-4 flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={50}
            value={weeklyTarget}
            onChange={(e) => setWeeklyTarget(Number(e.target.value))}
            className="w-20 h-10 px-3 rounded-md border bg-background text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/50"
          />
          <span className="text-sm text-muted-foreground">applications per week</span>
        </CardContent>}
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4 cursor-pointer select-none" onClick={() => toggle('theme')}>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Theme
            <ChevronDown className={`w-4 h-4 ml-auto text-muted-foreground transition-transform ${open['theme'] ? 'rotate-180' : ''}`} />
          </CardTitle>
          {!open['theme'] && <CardDescription className="text-xs capitalize">{theme} mode</CardDescription>}
        </CardHeader>
        {open['theme'] && <CardContent className="px-4 pb-4 flex items-center gap-3">
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
        </CardContent>}
      </Card>

      {/* Fit preferences */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4 cursor-pointer select-none" onClick={() => toggle('fit-prefs')}>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            Fit Preferences
            <ChevronDown className={`w-4 h-4 ml-auto text-muted-foreground transition-transform ${open['fit-prefs'] ? 'rotate-180' : ''}`} />
          </CardTitle>
          <CardDescription className="text-xs">Prioritize these domains in AI scoring</CardDescription>
        </CardHeader>
        {open['fit-prefs'] && <CardContent className="px-4 pb-4 space-y-3">
          {(Object.keys(fitPreferences) as (keyof typeof fitPreferences)[]).map((key) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm capitalize">{key}</span>
              <Switch
                checked={fitPreferences[key]}
                onCheckedChange={(v) => setFitPreference(key, v)}
              />
            </div>
          ))}
        </CardContent>}
      </Card>

      {/* Profile editor */}
      <Card
        ref={profileCardRef}
        className={profileJustUpdated ? 'ring-2 ring-[#00BFA5] transition-shadow duration-300' : 'transition-shadow duration-300'}
      >
        <CardHeader className="pb-2 pt-4 px-4 cursor-pointer select-none" onClick={() => toggle('profile')}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Candidate Profile
              <ChevronDown className={`w-4 h-4 ml-auto text-muted-foreground transition-transform ${open['profile'] ? 'rotate-180' : ''}`} />
            </CardTitle>
            {profileJustUpdated && profileUpdatedFrom && (
              <span className="flex items-center gap-1 text-xs text-[#00BFA5] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Updated from {profileUpdatedFrom === 'linkedin' ? 'LinkedIn' : 'Resume'}
              </span>
            )}
            {isParsingProfile && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating profile…
              </span>
            )}
          </div>
          <CardDescription className="text-xs">
            {profileOverride ? 'Profile configured — click to edit' : 'This is used by AI to score fit and generate outreach'}
          </CardDescription>
        </CardHeader>
        {open['profile'] && <CardContent className="px-4 pb-4 space-y-2">
          <div className="relative">
            <textarea
              value={localProfile}
              onChange={(e) => setLocalProfile(e.target.value)}
              rows={10}
              disabled={isParsingProfile}
              className={`w-full px-3 py-2 rounded-md border bg-background text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/50 resize-y transition-opacity ${isParsingProfile ? 'opacity-40 cursor-not-allowed' : ''}`}
            />
            {isParsingProfile && (
              <div className="absolute inset-0 flex items-center justify-center rounded-md">
                <div className="flex items-center gap-2 bg-background/80 px-3 py-1.5 rounded-full border text-xs text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  AI is writing your profile…
                </div>
              </div>
            )}
          </div>
          <Button
            onClick={saveProfile}
            disabled={isParsingProfile}
            className="bg-[#00BFA5] hover:bg-[#00BFA5]/90 text-white"
          >
            Save Profile
          </Button>
        </CardContent>}
      </Card>

      {/* Profile Import */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4 cursor-pointer select-none" onClick={() => toggle('profile-import')}>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Profile Import
            <ChevronDown className={`w-4 h-4 ml-auto text-muted-foreground transition-transform ${open['profile-import'] ? 'rotate-180' : ''}`} />
          </CardTitle>
          <CardDescription className="text-xs">
            Upload a PDF to auto-fill your candidate profile above using AI
          </CardDescription>
        </CardHeader>
        {open['profile-import'] && <CardContent className="px-4 pb-4 space-y-4">
          {!apiKey && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              An Anthropic API key is required to parse PDFs. Add it in the API Key section above.
            </p>
          )}

          {/* LinkedIn section */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">LinkedIn PDF Export</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => linkedinInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-md border border-dashed text-sm text-muted-foreground hover:border-[#00BFA5] hover:text-[#00BFA5] transition-colors"
              >
                <FileText className="w-4 h-4" />
                {linkedinFile ? linkedinFile.name : 'Choose PDF…'}
              </button>
              <input
                ref={linkedinInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => setLinkedinFile(e.target.files?.[0] ?? null)}
              />
              <Button
                onClick={() => handleParseFromPDF('linkedin')}
                disabled={!linkedinFile || linkedinLoading}
                size="sm"
                className="bg-[#00BFA5] hover:bg-[#00BFA5]/90 text-white gap-1.5"
              >
                {linkedinLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Parsing…
                  </>
                ) : (
                  'Parse with AI'
                )}
              </Button>
            </div>
          </div>

          {/* Resume section */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resume</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => resumeInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-md border border-dashed text-sm text-muted-foreground hover:border-[#00BFA5] hover:text-[#00BFA5] transition-colors"
              >
                <FileText className="w-4 h-4" />
                {resumeFile ? resumeFile.name : 'Choose PDF…'}
              </button>
              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
              />
              <Button
                onClick={() => handleParseFromPDF('resume')}
                disabled={!resumeFile || resumeLoading}
                size="sm"
                className="bg-[#00BFA5] hover:bg-[#00BFA5]/90 text-white gap-1.5"
              >
                {resumeLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Parsing…
                  </>
                ) : (
                  'Parse with AI'
                )}
              </Button>
            </div>
          </div>
        </CardContent>}
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4 cursor-pointer select-none" onClick={() => toggle('quick-links')}>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Link className="w-4 h-4" />
            Quick Links
            <ChevronDown className={`w-4 h-4 ml-auto text-muted-foreground transition-transform ${open['quick-links'] ? 'rotate-180' : ''}`} />
          </CardTitle>
          <CardDescription className="text-xs">
            {quickLinks.length > 0 ? `${quickLinks.length} link${quickLinks.length !== 1 ? 's' : ''} saved` : 'Saved job search URLs — open all as a Chrome tab group from the extension'}
          </CardDescription>
        </CardHeader>
        {open['quick-links'] && <CardContent className="px-4 pb-4 space-y-3">
          {quickLinks.length > 0 && (
            <div className="space-y-1.5">
              {quickLinks.map((link) => (
                <div key={link.id} className="flex items-center gap-2 group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{link.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                  </div>
                  <button
                    onClick={() => removeQuickLink(link.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Name (e.g. LinkedIn Jobs)"
              value={newLinkName}
              onChange={(e) => setNewLinkName(e.target.value)}
              className="flex-1 h-9 px-3 rounded-md border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/50"
            />
            <input
              type="url"
              placeholder="URL"
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
              className="flex-1 h-9 px-3 rounded-md border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/50"
            />
            <Button
              onClick={handleAddLink}
              disabled={!newLinkName.trim() || !newLinkUrl.trim()}
              size="sm"
              className="bg-[#00BFA5] hover:bg-[#00BFA5]/90 text-white h-9 px-3"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {quickLinks.length === 0 && (
            <p className="text-xs text-muted-foreground">No links yet — add job board URLs above</p>
          )}
        </CardContent>}
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-2 pt-4 px-4 cursor-pointer select-none" onClick={() => toggle('danger')}>
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-destructive">
            <Trash2 className="w-4 h-4" />
            Danger Zone
            <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${open['danger'] ? 'rotate-180' : ''}`} />
          </CardTitle>
        </CardHeader>
        {open['danger'] && <CardContent className="px-4 pb-4">
          <Button
            variant="destructive"
            onClick={() => setClearOpen(true)}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Data
          </Button>
        </CardContent>}
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
