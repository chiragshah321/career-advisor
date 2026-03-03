import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { getWeek, getYear } from 'date-fns'

export type JobStatus = 'bookmarked' | 'applied' | 'interviewed' | 'offer' | 'archived'
export type FitScore = 'strong' | 'good' | 'neutral' | 'weak'

export interface Contact {
  name: string
  linkedinUrl: string
  notes: string
}

export interface ActivityEntry {
  action: string
  timestamp: string
}

export interface Job {
  id: string
  title: string
  company: string
  url: string
  status: JobStatus
  fitScore: FitScore | null
  fitReasoning: string
  notes: string
  salary: string | null
  contacts: Contact[]
  activityLog: ActivityEntry[]
  followUpDate: string | null
  dateAdded: string
  dateApplied: string | null
  recruiterOutreach: string | null
  weekApplied: string | null
  description: string | null
}

interface JobStore {
  jobs: Job[]
  addJob: (job: Omit<Job, 'id' | 'dateAdded' | 'activityLog' | 'weekApplied'>) => Job
  updateJob: (id: string, patch: Partial<Job>) => void
  updateStatus: (id: string, status: JobStatus) => void
  deleteJob: (id: string) => void
  addContact: (jobId: string, contact: Contact) => void
  removeContact: (jobId: string, contactIndex: number) => void
  logActivity: (jobId: string, action: string) => void
  setFitScore: (jobId: string, fitScore: FitScore, fitReasoning: string) => void
  setRecruiterOutreach: (jobId: string, outreach: string) => void
  clearAll: () => void
}

function getWeekApplied(): string {
  const now = new Date()
  return `${getYear(now)}-W${String(getWeek(now)).padStart(2, '0')}`
}

// Custom storage that uses the shared localStorage key
const STORAGE_KEY = 'job_tracker_jobs'

export const useJobStore = create<JobStore>()(
  persist(
    (set, _get) => ({
      jobs: [],

      addJob: (jobData) => {
        const now = new Date().toISOString()
        const job: Job = {
          ...jobData,
          id: uuidv4(),
          dateAdded: now,
          activityLog: [{ action: 'Job added', timestamp: now }],
          weekApplied: jobData.status === 'applied' ? getWeekApplied() : null,
        }
        set((state) => ({ jobs: [job, ...state.jobs] }))
        return job
      },

      updateJob: (id, patch) => {
        set((state) => ({
          jobs: state.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)),
        }))
      },

      updateStatus: (id, status) => {
        const now = new Date().toISOString()
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === id
              ? {
                  ...j,
                  status,
                  dateApplied: status === 'applied' && !j.dateApplied ? now : j.dateApplied,
                  weekApplied: status === 'applied' && !j.weekApplied ? getWeekApplied() : j.weekApplied,
                  activityLog: [
                    ...j.activityLog,
                    { action: `Status changed to ${status}`, timestamp: now },
                  ],
                }
              : j
          ),
        }))
      },

      deleteJob: (id) => {
        set((state) => ({ jobs: state.jobs.filter((j) => j.id !== id) }))
      },

      addContact: (jobId, contact) => {
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === jobId ? { ...j, contacts: [...j.contacts, contact] } : j
          ),
        }))
      },

      removeContact: (jobId, contactIndex) => {
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === jobId
              ? { ...j, contacts: j.contacts.filter((_, i) => i !== contactIndex) }
              : j
          ),
        }))
      },

      logActivity: (jobId, action) => {
        const now = new Date().toISOString()
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === jobId
              ? { ...j, activityLog: [...j.activityLog, { action, timestamp: now }] }
              : j
          ),
        }))
      },

      setFitScore: (jobId, fitScore, fitReasoning) => {
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === jobId ? { ...j, fitScore, fitReasoning } : j
          ),
        }))
      },

      setRecruiterOutreach: (jobId, outreach) => {
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === jobId ? { ...j, recruiterOutreach: outreach } : j
          ),
        }))
      },

      clearAll: () => set({ jobs: [] }),
    }),
    {
      name: STORAGE_KEY,
      // Store only jobs array so extension can read the same key
      partialize: (state) => ({ jobs: state.jobs }),
    }
  )
)
