import { create } from 'zustand'
import type { DiffFile, PrMergeMethod, PrStateFilter, PullRequest } from '@shared/types'

interface PrState {
  pullRequests: PullRequest[]
  isLoading: boolean
  error: string | null
  errorCode: string | null
  stateFilter: PrStateFilter
  selected: PullRequest | null
  diffFiles: DiffFile[]
  isDiffLoading: boolean
  diffError: string | null
  isMutating: boolean

  load: (repoPath: string) => Promise<void>
  setStateFilter: (repoPath: string, filter: PrStateFilter) => Promise<void>
  select: (repoPath: string, pr: PullRequest) => Promise<void>
  clearSelection: () => void
  merge: (
    repoPath: string,
    method: PrMergeMethod,
    deleteBranch: boolean
  ) => Promise<{ ok: true } | { ok: false; message: string }>
  close: (repoPath: string) => Promise<{ ok: true } | { ok: false; message: string }>
  create: (
    repoPath: string,
    opts: { title: string; body: string; base: string; draft?: boolean }
  ) => Promise<{ ok: true; pr: PullRequest } | { ok: false; message: string }>
}

export const usePrStore = create<PrState>((set, get) => ({
  pullRequests: [],
  isLoading: false,
  error: null,
  errorCode: null,
  stateFilter: 'open',
  selected: null,
  diffFiles: [],
  isDiffLoading: false,
  diffError: null,
  isMutating: false,

  load: async (repoPath: string) => {
    set({ isLoading: true, error: null, errorCode: null })
    const result = await window.gitApi.listPullRequests(repoPath, get().stateFilter)
    if (!result.ok) {
      set({ isLoading: false, error: result.error.message, errorCode: result.error.code, pullRequests: [] })
      return
    }
    set({ pullRequests: result.data, isLoading: false })
  },

  setStateFilter: async (repoPath: string, filter: PrStateFilter) => {
    set({ stateFilter: filter, selected: null, diffFiles: [] })
    await get().load(repoPath)
  },

  select: async (repoPath: string, pr: PullRequest) => {
    set({ selected: pr, diffFiles: [], isDiffLoading: true, diffError: null })
    const result = await window.gitApi.getPullRequestDiff(repoPath, pr.number)
    if (!result.ok) {
      set({ isDiffLoading: false, diffError: result.error.message })
      return
    }
    set({ diffFiles: result.data, isDiffLoading: false })
  },

  clearSelection: () => set({ selected: null, diffFiles: [], diffError: null }),

  merge: async (repoPath: string, method: PrMergeMethod, deleteBranch: boolean) => {
    const pr = get().selected
    if (!pr) return { ok: false, message: 'No pull request selected.' }
    set({ isMutating: true })
    const result = await window.gitApi.mergePullRequest(repoPath, pr.number, { method, deleteBranch })
    set({ isMutating: false })
    if (!result.ok) return { ok: false, message: result.error.message }
    set({ selected: null, diffFiles: [] })
    await get().load(repoPath)
    return { ok: true }
  },

  close: async (repoPath: string) => {
    const pr = get().selected
    if (!pr) return { ok: false, message: 'No pull request selected.' }
    set({ isMutating: true })
    const result = await window.gitApi.closePullRequest(repoPath, pr.number)
    set({ isMutating: false })
    if (!result.ok) return { ok: false, message: result.error.message }
    set({ selected: null, diffFiles: [] })
    await get().load(repoPath)
    return { ok: true }
  },

  create: async (repoPath: string, opts: { title: string; body: string; base: string; draft?: boolean }) => {
    set({ isMutating: true })
    const result = await window.gitApi.createPullRequest(repoPath, opts)
    set({ isMutating: false })
    if (!result.ok) return { ok: false, message: result.error.message }
    await get().load(repoPath)
    return { ok: true, pr: result.data }
  }
}))
