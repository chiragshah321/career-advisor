import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { JobStatus } from '@/store/jobStore'

const STATUS_CONFIG: Record<JobStatus, { label: string; className: string }> = {
  bookmarked: { label: 'Bookmarked', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200' },
  applied: { label: 'Applied', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200' },
  interviewed: { label: 'Interviewed', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200' },
  offer: { label: 'Offer 🎉', className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200' },
  archived: { label: 'Archived', className: 'bg-muted text-muted-foreground line-through border-muted' },
}

export function StatusBadge({ status, className }: { status: JobStatus; className?: string }) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge className={cn('border text-xs font-medium', config.className, className)}>
      {config.label}
    </Badge>
  )
}
