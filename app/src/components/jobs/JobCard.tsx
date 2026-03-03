import { type Job, type JobStatus, useJobStore } from '@/store/jobStore'
import { StatusBadge } from './StatusBadge'
import { FitBadge } from './FitBadge'
import { formatDistanceToNow } from 'date-fns'
import { Building2, ExternalLink, Loader2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const STATUSES: JobStatus[] = ['bookmarked', 'applied', 'interviewed', 'offer', 'archived']

export function JobCard({ job, isScoring, onClick }: { job: Job; isScoring?: boolean; onClick: () => void }) {
  const { updateStatus } = useJobStore()

  function handleStatusChange(status: string) {
    updateStatus(job.id, status as JobStatus)
    toast.success(`Moved to ${status}`)
  }

  return (
    <div
      className={cn(
        'bg-card border rounded-lg p-3 cursor-pointer hover:shadow-md transition-all hover:border-[#00BFA5]/40 group',
        job.status === 'archived' && 'opacity-60'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm leading-tight truncate">{job.title}</p>
          <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
            <Building2 className="w-3 h-3 shrink-0" />
            <span className="text-xs truncate">{job.company}</span>
          </div>
        </div>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="flex items-center gap-1.5 mb-2">
        {isScoring ? (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            Scoring…
          </span>
        ) : (
          <FitBadge score={job.fitScore} />
        )}
      </div>

      <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
        <span className="text-[10px] text-muted-foreground">
          {formatDistanceToNow(new Date(job.dateAdded), { addSuffix: true })}
        </span>
        <Select value={job.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="h-6 text-[10px] w-auto gap-1 px-2 border-0 bg-muted hover:bg-muted/80">
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
      </div>
    </div>
  )
}

// Re-export StatusBadge for convenience
export { StatusBadge }
