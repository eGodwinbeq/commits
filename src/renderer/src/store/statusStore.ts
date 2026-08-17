import { create } from 'zustand'
import type { RepoStatus } from '@shared/types'

interface StatusState {
  status: RepoStatus | null
  isLoading: boolean
  error: string | null
  load: (repoPath: string) => Promise<void>
}

export const useStatusStore = create<StatusState>((set) => ({
  status: null,
  isLoading: false,
  error: null,

  load: async (repoPath: string) => {
    set({ isLoading: true, error: null })
    const result = await window.gitApi.getStatus(repoPath)
    if (!result.ok) {
      set({ isLoading: false, error: result.error.message })
      return
    }
    set({ status: result.data, isLoading: false })
  }
}))
