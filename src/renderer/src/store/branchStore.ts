import { create } from 'zustand'
import type { Branch } from '@shared/types'

interface BranchState {
  branches: Branch[]
  isLoading: boolean
  error: string | null
  load: (repoPath: string) => Promise<void>
}

export const useBranchStore = create<BranchState>((set) => ({
  branches: [],
  isLoading: false,
  error: null,

  load: async (repoPath: string) => {
    set({ isLoading: true, error: null })
    const result = await window.gitApi.getBranches(repoPath)
    if (!result.ok) {
      set({ isLoading: false, error: result.error.message })
      return
    }
    set({ branches: result.data, isLoading: false })
  }
}))

export function currentBranchName(branches: Branch[]): string | null {
  return branches.find((b) => b.kind === 'local' && b.isHead)?.name ?? null
}
