import { create } from 'zustand'
import type { Commit } from '@shared/types'
import { computeGraphLayout } from '../graph/layoutEngine'
import type { GraphRow } from '../graph/types'

interface LogState {
  commits: Commit[]
  graphRows: GraphRow[]
  isLoading: boolean
  error: string | null
  load: (repoPath: string) => Promise<void>
}

export const useLogStore = create<LogState>((set) => ({
  commits: [],
  graphRows: [],
  isLoading: false,
  error: null,

  load: async (repoPath: string) => {
    set({ isLoading: true, error: null })
    const result = await window.gitApi.getLog(repoPath, { maxCount: 1000 })
    if (!result.ok) {
      set({ isLoading: false, error: result.error.message })
      return
    }
    set({
      commits: result.data,
      graphRows: computeGraphLayout(result.data),
      isLoading: false
    })
  }
}))
