import { create } from 'zustand'
import type { Commit } from '@shared/types'
import { computeGraphLayout } from '../graph/layoutEngine'
import type { GraphRow } from '../graph/types'

export interface LogFilters {
  search: string
  authorEmail: string | null
  since: string | null
  until: string | null
}

const EMPTY_FILTERS: LogFilters = { search: '', authorEmail: null, since: null, until: null }

function applyFilters(commits: Commit[], filters: LogFilters): Commit[] {
  const hasDateFilter = filters.since || filters.until
  const since = filters.since ? new Date(filters.since) : null
  let until: Date | null = null
  if (filters.until) {
    until = new Date(filters.until)
    until.setHours(23, 59, 59, 999)
  }
  const q = filters.search.trim().toLowerCase()

  if (!q && !filters.authorEmail && !hasDateFilter) return commits

  return commits.filter((c) => {
    if (filters.authorEmail && c.authorEmail !== filters.authorEmail) return false
    if (since || until) {
      const d = new Date(c.date)
      if (since && d < since) return false
      if (until && d > until) return false
    }
    if (q) {
      const haystack = `${c.subject} ${c.authorName} ${c.authorEmail} ${c.sha}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
}

interface LogState {
  commits: Commit[]
  graphRows: GraphRow[]
  isLoading: boolean
  error: string | null
  branch: string | null
  filters: LogFilters
  load: (repoPath: string) => Promise<void>
  setBranch: (repoPath: string, branch: string | null) => Promise<void>
  setFilters: (patch: Partial<LogFilters>) => void
  clearFilters: () => void
}

export const useLogStore = create<LogState>((set, get) => ({
  commits: [],
  graphRows: [],
  isLoading: false,
  error: null,
  branch: null,
  filters: EMPTY_FILTERS,

  load: async (repoPath: string) => {
    set({ isLoading: true, error: null })
    const branch = get().branch
    const result = await window.gitApi.getLog(repoPath, {
      maxCount: 1000,
      branch: branch ?? undefined
    })
    if (!result.ok) {
      set({ isLoading: false, error: result.error.message })
      return
    }
    set({
      commits: result.data,
      graphRows: computeGraphLayout(applyFilters(result.data, get().filters)),
      isLoading: false
    })
  },

  setBranch: async (repoPath: string, branch: string | null) => {
    set({ branch })
    await get().load(repoPath)
  },

  setFilters: (patch: Partial<LogFilters>) => {
    const filters = { ...get().filters, ...patch }
    set({ filters, graphRows: computeGraphLayout(applyFilters(get().commits, filters)) })
  },

  clearFilters: () => {
    set({ filters: EMPTY_FILTERS, graphRows: computeGraphLayout(get().commits) })
  }
}))
