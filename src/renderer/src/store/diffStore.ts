import { create } from 'zustand'
import type { DiffFile } from '@shared/types'

export type DiffTarget =
  | { type: 'commit'; sha: string }
  | { type: 'workingFile'; path: string; staged: boolean }
  | null

interface DiffState {
  target: DiffTarget
  files: DiffFile[]
  isLoading: boolean
  error: string | null
  selectCommit: (repoPath: string, sha: string) => Promise<void>
  selectWorkingFile: (repoPath: string, path: string, staged: boolean) => Promise<void>
  clear: () => void
}

export const useDiffStore = create<DiffState>((set) => ({
  target: null,
  files: [],
  isLoading: false,
  error: null,

  selectCommit: async (repoPath: string, sha: string) => {
    set({ target: { type: 'commit', sha }, isLoading: true, error: null })
    const result = await window.gitApi.getShow(repoPath, sha)
    if (!result.ok) {
      set({ isLoading: false, error: result.error.message })
      return
    }
    set({ files: result.data, isLoading: false })
  },

  selectWorkingFile: async (repoPath: string, path: string, staged: boolean) => {
    set({ target: { type: 'workingFile', path, staged }, isLoading: true, error: null })
    const result = await window.gitApi.getDiff(repoPath, { path, staged })
    if (!result.ok) {
      set({ isLoading: false, error: result.error.message })
      return
    }
    set({ files: result.data, isLoading: false })
  },

  clear: () => set({ target: null, files: [] })
}))
