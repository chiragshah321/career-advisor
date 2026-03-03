import { useMemo } from 'react'
import { useJobStore } from '@/store/jobStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FitBadge } from '@/components/jobs/FitBadge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { Download } from 'lucide-react'
import { getWeek, subWeeks, getYear } from 'date-fns'
import { toast } from 'sonner'

function getWeekKey(date = new Date()) {
  return `${getYear(date)}-W${String(getWeek(date)).padStart(2, '0')}`
}

const STATUS_COLORS: Record<string, string> = {
  bookmarked: '#94a3b8',
  applied: '#3b82f6',
  interviewed: '#a855f7',
  offer: '#22c55e',
  archived: '#cbd5e1',
}

const FIT_COLORS: Record<string, string> = {
  strong: '#22c55e',
  good: '#00BFA5',
  neutral: '#eab308',
  weak: '#ef4444',
  unscored: '#94a3b8',
}

export default function Reports() {
  const { jobs } = useJobStore()

  const weeklyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = subWeeks(new Date(), 11 - i)
      const key = getWeekKey(d)
      return { week: `W${getWeek(d)}`, count: jobs.filter((j) => j.weekApplied === key).length }
    })
  }, [jobs])

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const j of jobs) counts[j.status] = (counts[j.status] || 0) + 1
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [jobs])

  const fitData = useMemo(() => {
    const counts: Record<string, number> = { strong: 0, good: 0, neutral: 0, weak: 0, unscored: 0 }
    for (const j of jobs) {
      if (j.fitScore) counts[j.fitScore]++
      else counts.unscored++
    }
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }))
  }, [jobs])

  const topFit = useMemo(() => {
    return [...jobs]
      .filter((j) => j.fitScore === 'strong' || j.fitScore === 'good')
      .sort((a, b) => {
        const order: Record<string, number> = { strong: 0, good: 1 }
        return (order[a.fitScore ?? ''] ?? 2) - (order[b.fitScore ?? ''] ?? 2)
      })
      .slice(0, 5)
  }, [jobs])

  function exportCSV() {
    const headers = ['Title', 'Company', 'Status', 'Fit Score', 'Date Added', 'Date Applied', 'Salary', 'URL']
    const rows = jobs.map((j) =>
      [j.title, j.company, j.status, j.fitScore ?? '', j.dateAdded, j.dateApplied ?? '', j.salary ?? '', j.url]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'jobs.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported to CSV')
  }

  return (
    <div className="px-6 py-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Analytics across your job search</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Weekly applications bar chart */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold">Applications Per Week (12 Weeks)</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#00BFA5" radius={[4, 4, 0, 0]} name="Applied" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Status donut */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 flex justify-center">
            <PieChart width={220} height={200}>
              <Pie
                data={statusData}
                cx={110}
                cy={90}
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </CardContent>
        </Card>

        {/* Fit score distribution */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">Fit Score Distribution</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 flex justify-center">
            <PieChart width={220} height={200}>
              <Pie
                data={fitData}
                cx={110}
                cy={90}
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {fitData.map((entry) => (
                  <Cell key={entry.name} fill={FIT_COLORS[entry.name] ?? '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 fit jobs */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold">Top Fit Jobs</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          {topFit.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Score fit on your jobs to see top matches
            </p>
          ) : (
            topFit.map((job, i) => (
              <div key={job.id} className="flex items-center gap-3 p-2.5 rounded-lg border">
                <span className="text-muted-foreground text-sm w-5 text-right">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{job.company}</p>
                </div>
                <FitBadge score={job.fitScore} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
