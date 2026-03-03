import { useMemo } from 'react'
import { useJobStore } from '@/store/jobStore'
import { useSettingsStore } from '@/store/settingsStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { StatusBadge } from '@/components/jobs/StatusBadge'
import {
  getWeek,
  getYear,
  isBefore,
  subDays,
  isToday,
  isPast,
  parseISO,
  formatDistanceToNow,
  format,
} from 'date-fns'
import { Briefcase, Bookmark, Trophy, Star, AlertCircle, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

function getWeekKey(date = new Date()) {
  return `${getYear(date)}-W${String(getWeek(date)).padStart(2, '0')}`
}

export default function Dashboard() {
  const { jobs } = useJobStore()
  const { weeklyTarget } = useSettingsStore()
  const thisWeek = getWeekKey()

  const stats = useMemo(() => {
    const applied = jobs.filter(
      (j) => j.status === 'applied' || j.status === 'interviewed' || j.status === 'offer'
    )
    const bookmarked = jobs.filter((j) => j.status === 'bookmarked')
    const interviewed = jobs.filter((j) => j.status === 'interviewed' || j.status === 'offer')
    const strongFit = jobs.filter((j) => j.fitScore === 'strong')
    const thisWeekApplied = jobs.filter((j) => j.weekApplied === thisWeek)
    const needsAttention = jobs.filter((j) => {
      if (j.status === 'archived') return false
      const lastActivity = j.activityLog[j.activityLog.length - 1]
      if (!lastActivity) return false
      return isBefore(new Date(lastActivity.timestamp), subDays(new Date(), 7))
    })
    const followUps = jobs.filter((j) => {
      if (!j.followUpDate) return false
      const d = parseISO(j.followUpDate)
      return isToday(d) || isPast(d)
    })
    return { applied, bookmarked, interviewed, strongFit, thisWeekApplied, needsAttention, followUps }
  }, [jobs, thisWeek])

  const pipeline = [
    { status: 'bookmarked' as const, count: jobs.filter((j) => j.status === 'bookmarked').length },
    { status: 'applied' as const, count: jobs.filter((j) => j.status === 'applied').length },
    { status: 'interviewed' as const, count: jobs.filter((j) => j.status === 'interviewed').length },
    { status: 'offer' as const, count: jobs.filter((j) => j.status === 'offer').length },
  ]
  const maxPipelineCount = Math.max(...pipeline.map((p) => p.count), 1)

  const progressPct = Math.min((stats.thisWeekApplied.length / weeklyTarget) * 100, 100)

  return (
    <div className="px-6 py-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Your job search at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Applied', value: stats.applied.length, icon: Briefcase, color: 'text-blue-500' },
          { label: 'Bookmarked', value: stats.bookmarked.length, icon: Bookmark, color: 'text-slate-500' },
          { label: 'Interviews', value: stats.interviewed.length, icon: Trophy, color: 'text-purple-500' },
          { label: 'Strong Fits', value: stats.strongFit.length, icon: Star, color: 'text-green-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn('p-2 rounded-lg bg-muted', color)}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Weekly goal */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">Weekly Application Goal</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-end gap-2 mb-3">
              <span className="text-3xl font-bold">{stats.thisWeekApplied.length}</span>
              <span className="text-muted-foreground text-sm mb-1">/ {weeklyTarget} this week</span>
            </div>
            <Progress value={progressPct} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.thisWeekApplied.length >= weeklyTarget
                ? 'Goal reached!'
                : `${weeklyTarget - stats.thisWeekApplied.length} more to hit your goal`}
            </p>
          </CardContent>
        </Card>

        {/* Pipeline funnel */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">Pipeline Funnel</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {pipeline.map(({ status, count }) => (
              <div key={status} className="flex items-center gap-3">
                <StatusBadge status={status} className="w-24 justify-center shrink-0" />
                <div className="flex-1 h-5 rounded bg-muted overflow-hidden">
                  <div
                    className="h-full rounded bg-[#00BFA5]/60 transition-all"
                    style={{ width: `${(count / maxPipelineCount) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold w-6 text-right">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Follow-up reminders */}
      {stats.followUps.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <Bell className="w-4 h-4" />
              Follow-up Reminders ({stats.followUps.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {stats.followUps.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-orange-50 dark:bg-orange-900/20"
              >
                <div>
                  <p className="font-medium text-sm">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{job.company}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={job.status} />
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    {job.followUpDate && format(parseISO(job.followUpDate), 'MMM d')}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Needs attention */}
      {stats.needsAttention.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Needs Attention ({stats.needsAttention.length})
            </CardTitle>
            <p className="text-xs text-muted-foreground">No activity in 7+ days</p>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {stats.needsAttention.slice(0, 5).map((job) => (
              <div key={job.id} className="flex items-center justify-between p-2.5 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{job.company}</p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <StatusBadge status={job.status} />
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(
                      new Date(job.activityLog[job.activityLog.length - 1]?.timestamp ?? job.dateAdded),
                      { addSuffix: true }
                    )}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {jobs.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No jobs yet</p>
          <p className="text-sm mt-1">Add jobs from the Jobs tab or install the Chrome extension</p>
        </div>
      )}
    </div>
  )
}
