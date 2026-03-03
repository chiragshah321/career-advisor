import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { FitScore } from '@/store/jobStore'

const FIT_CONFIG: Record<FitScore, { label: string; className: string }> = {
  strong: { label: 'Strong', className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200' },
  good: { label: 'Good', className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200' },
  neutral: { label: 'Neutral', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200' },
  weak: { label: 'Weak', className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200' },
}

export function FitBadge({ score, className }: { score: FitScore | null; className?: string }) {
  if (!score) {
    return (
      <Badge className={cn('border text-xs bg-muted text-muted-foreground', className)}>
        Unscored
      </Badge>
    )
  }
  const config = FIT_CONFIG[score]
  return (
    <Badge className={cn('border text-xs font-medium', config.className, className)}>
      {config.label}
    </Badge>
  )
}
