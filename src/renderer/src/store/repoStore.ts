import { create } from 'zustand'

const RECENT_KEY = 'commits.recentRepos'

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveRecent(paths: string[]): void {
  localStorage.setItem(RECENT_KEY, JSON.stringify(paths))
}

interface RepoState {
  repoPath: string | null
  repoName: string | null
  recentRepos: string[]
  error: string | null
  isLoading: boolean
  openFolderDialog: () => Promise<void>
  openRepo: (path: string) => Promise<void>
  closeRepo: () => void
}

export const useRepoStore = create<RepoState>((set, get) => ({
  repoPath: null,
  repoName: null,
  recentRepos: loadRecent(),
  error: null,
  isLoading: false,

  openFolderDialog: async () => {
    const path = await window.gitApi.openFolderDialog()
    if (path) await get().openRepo(path)
  },

  openRepo: async (path: string) => {
    set({ isLoading: true, error: null })
    const result = await window.gitApi.validateRepo(path)
    if (!result.ok) {
      set({ isLoading: false, error: result.error.message })
      return
    }
    const recent = [result.data.path, ...get().recentRepos.filter((p) => p !== result.data.path)].slice(
      0,
      10
    )
    saveRecent(recent)
    set({
      repoPath: result.data.path,
      repoName: result.data.name,
      recentRepos: recent,
      isLoading: false
    })
  },

  closeRepo: () => set({ repoPath: null, repoName: null })
}))
