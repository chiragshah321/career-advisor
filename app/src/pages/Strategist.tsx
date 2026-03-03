import { useMemo } from 'react'
import { useJobStore } from '@/store/jobStore'
import { useSettingsStore } from '@/store/settingsStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { subDays, subWeeks, getWeek, getYear, format, isAfter } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, Target, AlertTriangle, Lightbulb } from 'lucide-react'

function getWeekKey(date = new Date()) {
  return `${getYear(date)}-W${String(getWeek(date)).padStart(2, '0')}`
}

export default function Strategist() {
  const { jobs } = useJobStore()
  const { weeklyTarget } = useSettingsStore()

  const sevenDaysAgo = subDays(new Date(), 7)
  const thisWeek = getWeekKey()

  const recent = useMemo(() => {
    return jobs.filter((j) => isAfter(new Date(j.dateAdded), sevenDaysAgo))
  }, [jobs, sevenDaysAgo])

  const recentApplied = useMemo(() => {
    return jobs.filter((j) => j.weekApplied === thisWeek)
  }, [jobs, thisWeek])

  const stale = useMemo(() => {
    const twoWeeksAgo = subWeeks(new Date(), 2)
    return jobs.filter((j) => {
      if (j.status !== 'bookmarked') return false
      return !isAfter(new Date(j.dateAdded), twoWeeksAgo)
    })
  }, [jobs])

  const strongNotApplied = jobs.filter((j) => j.fitScore === 'strong' && j.status === 'bookmarked')
  const weakDominating =
    jobs.filter((j) => j.fitScore === 'weak').length >
    jobs.filter((j) => j.fitScore === 'strong' || j.fitScore === 'good').length

  const tips: { icon: string; text: string; type: 'info' | 'warn' | 'success' }[] = []

  if (recentApplied.length > recent.length) {
    tips.push({
      icon: '⚡',
      text: "You're applying fast — make sure you're targeting fit, not just volume.",
      type: 'warn',
    })
  }
  if (
    jobs.filter((j) => j.status === 'applied').length >= 10 &&
    jobs.filter((j) => j.status === 'interviewed').length === 0
  ) {
    tips.push({
      icon: '📝',
      text: 'Consider refining your resume targeting — 10+ apps with no interviews yet.',
      type: 'warn',
    })
  }
  if (weakDominating) {
    tips.push({
      icon: '🎯',
      text: 'Weak fit jobs dominate your board. Shift focus toward Strong/Good fit roles.',
      type: 'warn',
    })
  }
  if (strongNotApplied.length > 0) {
    tips.push({
      icon: '🚀',
      text: `You have ${strongNotApplied.length} Strong-fit job${strongNotApplied.length === 1 ? '' : 's'} you haven't applied to yet.`,
      type: 'info',
    })
  }
  if (stale.length > 0) {
    tips.push({
      icon: '🕰️',
      text: `${stale.length} job${stale.length === 1 ? '' : 's'} bookmarked 2+ weeks ago with no action taken.`,
      type: 'warn',
    })
  }
  if (tips.length === 0) {
    tips.push({
      icon: '✅',
      text: "You're on track! Keep applying to strong-fit roles.",
      type: 'success',
    })
  }

  // Weekly chart data - last 8 weeks
  const weeklyData = useMemo(() => {
    const weeks: { week: string; applied: number; target: number }[] = []
    for (let i = 7; i >= 0; i--) {
      const weekDate = subWeeks(new Date(), i)
      const weekKey = getWeekKey(weekDate)
      const count = jobs.filter((j) => j.weekApplied === weekKey).length
      weeks.push({ week: `W${getWeek(weekDate)}`, applied: count, target: weeklyTarget })
    }
    return weeks
  }, [jobs, weeklyTarget])

  const focusThis = strongNotApplied.slice(0, 3)

  return (
    <div className="px-6 py-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Strategist</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Patterns and recommendations for your search</p>
      </div>

      {/* Weekly reflection */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#00BFA5]" />
            This Week
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Jobs Saved', value: recent.length },
              { label: 'Applied', value: recentApplied.length },
              { label: 'Goal', value: `${recentApplied.length}/${weeklyTarget}` },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strategy tips */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Strategy Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          {tips.map((tip, i) => (
            <div
              key={i}
              className={`flex gap-3 p-3 rounded-lg text-sm ${
                tip.type === 'warn'
                  ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200'
                  : tip.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                  : 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
              }`}
            >
              <span className="text-base shrink-0">{tip.icon}</span>
              <p>{tip.text}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Weekly chart */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold">Applications vs Goal (8 Weeks)</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} barGap={4}>
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="target" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Goal" />
              <Bar dataKey="applied" radius={[4, 4, 0, 0]} name="Applied">
                {weeklyData.map((entry, i) => (
                  <Cell key={i} fill={entry.applied >= entry.target ? '#00BFA5' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Stale jobs */}
      {stale.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Stale Bookmarks ({stale.length})
            </CardTitle>
            <p className="text-xs text-muted-foreground">Bookmarked 2+ weeks ago with no action</p>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {stale.slice(0, 5).map((job) => (
              <div key={job.id} className="flex items-center justify-between p-2.5 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{job.company}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  Added {format(new Date(job.dateAdded), 'MMM d')}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Focus this week */}
      {focusThis.length > 0 && (
        <Card className="border-[#00BFA5]/40">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-[#00BFA5]" />
              Focus This Week
            </CardTitle>
            <p className="text-xs text-muted-foreground">Strong-fit jobs you haven't applied to</p>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {focusThis.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#00BFA5]/5 border border-[#00BFA5]/20"
              >
                <div>
                  <p className="font-medium text-sm">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{job.company}</p>
                </div>
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00BFA5] text-xs hover:underline"
                >
                  Apply →
                </a>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
