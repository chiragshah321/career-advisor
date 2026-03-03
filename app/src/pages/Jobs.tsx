import { useState, useMemo, type ReactNode } from 'react'
import { type Job, type JobStatus, useJobStore } from '@/store/jobStore'
import { useSettingsStore } from '@/store/settingsStore'
import { scoreFit } from '@/lib/api'
import { JobCard } from '@/components/jobs/JobCard'
import { JobDetailPanel } from '@/components/jobs/JobDetailPanel'
import { StatusBadge } from '@/components/jobs/StatusBadge'
import { FitBadge } from '@/components/jobs/FitBadge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LayoutGrid, List, Plus, Search, X, Building2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'

const FIT_ORDER: Record<string, number> = { strong: 0, good: 1, neutral: 2, weak: 3 }
function fitRank(score: string | null, isScoring: boolean) {
  if (isScoring) return -1 // scoring jobs float to top temporarily
  return score != null ? (FIT_ORDER[score] ?? 3) : 4
}

const COLUMNS: { status: JobStatus; label: string; color: string }[] = [
  { status: 'bookmarked', label: 'Bookmarked', color: 'border-t-slate-400' },
  { status: 'applied', label: 'Applied', color: 'border-t-blue-500' },
  { status: 'interviewed', label: 'Interviewed', color: 'border-t-purple-500' },
  { status: 'offer', label: 'Offer', color: 'border-t-green-500' },
  { status: 'archived', label: 'Archived', color: 'border-t-muted-foreground' },
]

export default function Jobs() {
  const { jobs, setFitScore, updateStatus } = useJobStore()
  const { apiKey, profileOverride } = useSettingsStore()
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterFit, setFilterFit] = useState<string>('all')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [scoringIds, setScoringIds] = useState<Set<string>>(new Set())
  const [draggingJob, setDraggingJob] = useState<Job | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function handleDragStart({ active }: DragStartEvent) {
    setDraggingJob(jobs.find((j) => j.id === active.id) ?? null)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setDraggingJob(null)
    if (!over) return
    const job = jobs.find((j) => j.id === active.id)
    if (!job || job.status === over.id) return
    updateStatus(job.id, over.id as JobStatus)
    toast.success(`Moved to ${over.id}`)
  }

  async function autoScore(job: Job) {
    if (!apiKey || !job.url || scoringIds.has(job.id)) return
    setScoringIds((prev) => new Set(prev).add(job.id))
    try {
      const result = await scoreFit(job.title, job.company, job.url, profileOverride, job.description)
      setFitScore(job.id, result.fitScore, result.fitReasoning)
    } catch {
      // silent — user can score manually
    } finally {
      setScoringIds((prev) => {
        const next = new Set(prev)
        next.delete(job.id)
        return next
      })
    }
  }

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      const matchSearch =
        !search ||
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.company.toLowerCase().includes(search.toLowerCase())
      const matchStatus = filterStatus === 'all' || j.status === filterStatus
      const matchFit = filterFit === 'all' || j.fitScore === filterFit
      return matchSearch && matchStatus && matchFit
    })
  }, [jobs, search, filterStatus, filterFit])

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/50"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-9 w-36 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {COLUMNS.map((c) => (
              <SelectItem key={c.status} value={c.status} className="capitalize">
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterFit} onValueChange={setFilterFit}>
          <SelectTrigger className="h-9 w-32 text-sm">
            <SelectValue placeholder="Fit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fit</SelectItem>
            {['strong', 'good', 'neutral', 'weak'].map((f) => (
              <SelectItem key={f} value={f} className="capitalize">
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center rounded-md border overflow-hidden">
          <button
            onClick={() => setView('kanban')}
            className={cn('px-3 py-2', view === 'kanban' ? 'bg-muted' : 'hover:bg-muted/50')}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={cn('px-3 py-2 border-l', view === 'list' ? 'bg-muted' : 'hover:bg-muted/50')}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        <Button
          onClick={() => setAddOpen(true)}
          className="bg-[#00BFA5] hover:bg-[#00BFA5]/90 text-white gap-2 h-9"
        >
          <Plus className="w-4 h-4" />
          Add Job
        </Button>
      </div>

      {/* Kanban */}
      {view === 'kanban' && (
        <div className="flex-1 overflow-x-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 p-6 min-w-max h-full">
              {COLUMNS.map(({ status, label, color }) => {
                const colJobs = filtered
                  .filter((j) => j.status === status)
                  .sort((a, b) => fitRank(a.fitScore, scoringIds.has(a.id)) - fitRank(b.fitScore, scoringIds.has(b.id)))
                return (
                  <div key={status} className="w-64 flex flex-col">
                    <div className={cn('rounded-t-lg border-t-4 bg-muted/40 px-3 py-2 flex items-center justify-between', color)}>
                      <span className="text-sm font-semibold">{label}</span>
                      <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5">
                        {colJobs.length}
                      </span>
                    </div>
                    <KanbanColumn id={status} className="flex-1 rounded-b-lg border border-t-0 bg-muted/20 p-2 space-y-2 overflow-y-auto min-h-[400px]">
                      {colJobs.map((job) => (
                        <DraggableCard key={job.id} job={job} isScoring={scoringIds.has(job.id)} onClick={() => setSelectedJob(job)} />
                      ))}
                      {colJobs.length === 0 && (
                        <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
                          No jobs
                        </div>
                      )}
                    </KanbanColumn>
                  </div>
                )
              })}
            </div>
            <DragOverlay dropAnimation={{ duration: 120, easing: 'ease' }}>
              {draggingJob && (
                <div className="rotate-1 opacity-95 shadow-2xl cursor-grabbing w-64">
                  <JobCard job={draggingJob} isScoring={false} onClick={() => {}} />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg">No jobs found</p>
              <p className="text-sm mt-1">Add your first job or adjust filters</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:shadow-sm hover:border-[#00BFA5]/40 cursor-pointer transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{job.title}</p>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                      <Building2 className="w-3 h-3" />
                      <span className="text-xs">{job.company}</span>
                    </div>
                  </div>
                  <StatusBadge status={job.status} />
                  <FitBadge score={job.fitScore} />
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(job.dateAdded), { addSuffix: true })}
                  </span>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Job detail panel */}
      <JobDetailPanel
        job={selectedJob}
        open={!!selectedJob}
        onClose={() => setSelectedJob(null)}
      />

      {/* Add job dialog */}
      <AddJobDialog open={addOpen} onClose={() => setAddOpen(false)} onAdd={autoScore} />
    </div>
  )
}

function KanbanColumn({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef} className={cn(className, isOver && 'bg-[#00BFA5]/10 ring-1 ring-inset ring-[#00BFA5]/30 transition-colors')}>
      {children}
    </div>
  )
}

function DraggableCard({ job, isScoring, onClick }: { job: Job; isScoring: boolean; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: job.id })
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className="touch-none">
      {isDragging
        ? <div className="h-[88px] rounded-lg border-2 border-dashed border-[#00BFA5]/40 bg-[#00BFA5]/5" />
        : <JobCard job={job} isScoring={isScoring} onClick={onClick} />
      }
    </div>
  )
}

function AddJobDialog({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (job: Job) => void }) {
  const { addJob } = useJobStore()
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<JobStatus>('bookmarked')

  function handleSubmit() {
    if (!title.trim() || !company.trim()) {
      toast.error('Title and company are required')
      return
    }
    const job = addJob({
      title,
      company,
      url,
      description: description.trim() || null,
      status,
      fitScore: null,
      fitReasoning: '',
      notes: '',
      salary: null,
      contacts: [],
      followUpDate: null,
      dateApplied: null,
      recruiterOutreach: null,
    })
    toast.success('Job added!')
    onAdd(job)
    setTitle('')
    setCompany('')
    setUrl('')
    setDescription('')
    setStatus('bookmarked')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Job</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Job Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/50 placeholder:text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Company *"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/50 placeholder:text-muted-foreground"
          />
          <input
            type="url"
            placeholder="Job URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/50 placeholder:text-muted-foreground"
          />
          <textarea
            placeholder="Job description (optional — paste from listing)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/50 placeholder:text-muted-foreground resize-y"
          />
          <Select value={status} onValueChange={(v) => setStatus(v as JobStatus)}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(['bookmarked', 'applied', 'interviewed', 'offer'] as JobStatus[]).map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2 pt-1">
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-[#00BFA5] hover:bg-[#00BFA5]/90 text-white"
            >
              Add Job
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
