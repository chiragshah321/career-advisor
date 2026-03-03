import { useState } from 'react'
import { type Job, type JobStatus, useJobStore } from '@/store/jobStore'
import { useSettingsStore } from '@/store/settingsStore'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FitBadge } from './FitBadge'
import { scoreFit, generateOutreach } from '@/lib/api'
import { toast } from 'sonner'
import { format, formatDistanceToNow } from 'date-fns'
import {
  ExternalLink, Sparkles, Copy, Trash2, Plus, Calendar, Clock,
  User, Linkedin, FileText, DollarSign, AlignLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUSES: JobStatus[] = ['bookmarked', 'applied', 'interviewed', 'offer', 'archived']

const TABS = ['Overview', 'Outreach', 'Contacts', 'Activity'] as const
type Tab = typeof TABS[number]

export function JobDetailPanel({
  job,
  open,
  onClose,
}: {
  job: Job | null
  open: boolean
  onClose: () => void
}) {
  const { updateJob, updateStatus, deleteJob, addContact, removeContact, setRecruiterOutreach, setFitScore } = useJobStore()
  const { profileOverride } = useSettingsStore()
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [scoringFit, setScoringFit] = useState(false)
  const [generatingOutreach, setGeneratingOutreach] = useState(false)

  if (!job) return null

  async function handleScoreFit() {
    if (!job) return
    setScoringFit(true)
    try {
      const result = await scoreFit(job.title, job.company, job.url, profileOverride)
      setFitScore(job.id, result.fitScore, result.fitReasoning)
      toast.success('Fit score updated')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to score fit')
    } finally {
      setScoringFit(false)
    }
  }

  async function handleGenerateOutreach() {
    if (!job) return
    setGeneratingOutreach(true)
    try {
      const result = await generateOutreach(job.title, job.company, job.url, profileOverride)
      setRecruiterOutreach(job.id, result)
      toast.success('Outreach generated')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate outreach')
    } finally {
      setGeneratingOutreach(false)
    }
  }

  function handleDelete() {
    if (!job) return
    deleteJob(job.id)
    toast.success('Job deleted')
    onClose()
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  // Parse outreach variants
  function parseOutreachVariants(raw: string): { tone: string; message: string }[] {
    const variants: { tone: string; message: string }[] = []
    const blocks = raw.split(/---+/).filter(Boolean)
    for (const block of blocks) {
      const lines = block.trim().split('\n')
      const header = lines[0] ?? ''
      const toneMatch = header.match(/Variant\s*\d+\s*[—-]\s*(.+)/i)
      if (toneMatch) {
        variants.push({
          tone: toneMatch[1].trim(),
          message: lines.slice(1).join('\n').trim(),
        })
      }
    }
    return variants
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b px-6 py-4 z-10">
          <SheetHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-lg leading-tight">{job.title}</SheetTitle>
                <p className="text-muted-foreground text-sm mt-0.5">{job.company}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={job.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Job
                  </Button>
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  className="text-destructive hover:text-destructive h-8 w-8"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          {/* Status + Fit */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Select
              value={job.status}
              onValueChange={(v) => {
                updateStatus(job.id, v as JobStatus)
                toast.success(`Moved to ${v}`)
              }}
            >
              <SelectTrigger className="h-8 w-auto gap-2 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FitBadge score={job.fitScore} />
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs ml-auto"
              onClick={handleScoreFit}
              disabled={scoringFit}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00BFA5]" />
              {scoringFit ? 'Scoring...' : 'Score Fit'}
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab
                    ? 'border-[#00BFA5] text-[#00BFA5]'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Overview Tab */}
          {activeTab === 'Overview' && (
            <div className="space-y-5">
              {/* Fit reasoning */}
              {job.fitReasoning && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground mb-1">AI Fit Reasoning</p>
                  <p>{job.fitReasoning}</p>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1 mb-1.5">
                  <AlignLeft className="w-3.5 h-3.5" /> Description
                </label>
                <Textarea
                  value={job.description ?? ''}
                  onChange={(e) => updateJob(job.id, { description: e.target.value || null })}
                  placeholder="Paste the job description here…"
                  className="min-h-[120px] text-sm"
                />
              </div>

              {/* Salary */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1 mb-1.5">
                  <DollarSign className="w-3.5 h-3.5" /> Salary
                </label>
                <input
                  type="text"
                  value={job.salary ?? ''}
                  onChange={(e) => updateJob(job.id, { salary: e.target.value || null })}
                  placeholder="e.g. $120k–$150k"
                  className="w-full h-9 px-3 rounded-md border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/50"
                />
              </div>

              {/* Follow-up date */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1 mb-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Follow-up Reminder
                </label>
                <input
                  type="date"
                  value={job.followUpDate ? job.followUpDate.split('T')[0] : ''}
                  onChange={(e) =>
                    updateJob(job.id, {
                      followUpDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                    })
                  }
                  className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/50"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1 mb-1.5">
                  <FileText className="w-3.5 h-3.5" /> Notes
                </label>
                <Textarea
                  value={job.notes}
                  onChange={(e) => updateJob(job.id, { notes: e.target.value })}
                  placeholder="Add notes about this role..."
                  className="min-h-[120px] text-sm"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Date Added</p>
                  <p className="font-medium">{format(new Date(job.dateAdded), 'MMM d, yyyy')}</p>
                </div>
                {job.dateApplied && (
                  <div>
                    <p className="text-xs text-muted-foreground">Date Applied</p>
                    <p className="font-medium">{format(new Date(job.dateApplied), 'MMM d, yyyy')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Outreach Tab */}
          {activeTab === 'Outreach' && (
            <div className="space-y-4">
              <Button
                onClick={handleGenerateOutreach}
                disabled={generatingOutreach}
                className="w-full bg-[#00BFA5] hover:bg-[#00BFA5]/90 text-white gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {generatingOutreach
                  ? 'Generating...'
                  : job.recruiterOutreach
                  ? 'Regenerate Outreach'
                  : 'Generate LinkedIn Outreach'}
              </Button>

              {job.recruiterOutreach && (
                <div className="space-y-3">
                  {parseOutreachVariants(job.recruiterOutreach).map((variant, i) => (
                    <div key={i} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-[#00BFA5]">{variant.tone}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1.5 text-xs"
                          onClick={() => copyToClipboard(variant.message)}
                        >
                          <Copy className="w-3 h-3" />
                          Copy
                        </Button>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{variant.message}</p>
                    </div>
                  ))}
                  {/* Raw fallback if parsing fails */}
                  {parseOutreachVariants(job.recruiterOutreach).length === 0 && (
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-end mb-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1.5 text-xs"
                          onClick={() => copyToClipboard(job.recruiterOutreach!)}
                        >
                          <Copy className="w-3 h-3" />
                          Copy All
                        </Button>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{job.recruiterOutreach}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Contacts Tab */}
          {activeTab === 'Contacts' && (
            <div className="space-y-3">
              {job.contacts.map((contact, i) => (
                <div key={i} className="rounded-lg border p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{contact.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeContact(job.id, i)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  {contact.linkedinUrl && (
                    <a
                      href={contact.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-[#00BFA5] hover:underline"
                    >
                      <Linkedin className="w-3 h-3" />
                      LinkedIn
                    </a>
                  )}
                  {contact.notes && <p className="text-xs text-muted-foreground">{contact.notes}</p>}
                </div>
              ))}

              <AddContactForm
                jobId={job.id}
                onAdd={(c) => {
                  addContact(job.id, c)
                  toast.success('Contact added')
                }}
              />
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'Activity' && (
            <div className="space-y-2">
              {[...job.activityLog].reverse().map((entry, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-[#00BFA5] mt-1.5 shrink-0" />
                    {i < job.activityLog.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                  </div>
                  <div className="pb-3 min-w-0">
                    <p className="font-medium">{entry.action}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
              {job.activityLog.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No activity yet</p>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function AddContactForm({
  jobId,
  onAdd,
}: {
  jobId: string
  onAdd: (c: { name: string; linkedinUrl: string; notes: string }) => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [notes, setNotes] = useState('')

  // suppress unused warning — jobId is passed from parent and could be used for future direct store calls
  void jobId

  if (!open) {
    return (
      <Button variant="outline" className="w-full gap-2 text-sm" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" />
        Add Contact
      </Button>
    )
  }

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full h-8 px-2 rounded border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#00BFA5]"
      />
      <input
        type="url"
        placeholder="LinkedIn URL (optional)"
        value={linkedinUrl}
        onChange={(e) => setLinkedinUrl(e.target.value)}
        className="w-full h-8 px-2 rounded border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#00BFA5]"
      />
      <input
        type="text"
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full h-8 px-2 rounded border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#00BFA5]"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 bg-[#00BFA5] hover:bg-[#00BFA5]/90 text-white"
          onClick={() => {
            if (!name.trim()) return
            onAdd({ name, linkedinUrl, notes })
            setName('')
            setLinkedinUrl('')
            setNotes('')
            setOpen(false)
          }}
        >
          Save
        </Button>
        <Button size="sm" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
