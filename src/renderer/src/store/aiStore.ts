import { create } from 'zustand'
import type { AiStatus } from '@shared/types'

interface AiState {
  status: AiStatus | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  saveApiKey: (key: string) => Promise<{ ok: true } | { ok: false; message: string }>
  removeApiKey: () => Promise<void>
}

export const useAiStore = create<AiState>((set, get) => ({
  status: null,
  isLoading: false,
  error: null,

  refresh: async () => {
    set({ isLoading: true, error: null })
    const result = await window.gitApi.getAiStatus()
    if (!result.ok) {
      set({ isLoading: false, error: result.error.message })
      return
    }
    set({ status: result.data, isLoading: false })
  },

  saveApiKey: async (key: string) => {
    const result = await window.gitApi.setAiApiKey(key)
    if (!result.ok) return { ok: false, message: result.error.message }
    await get().refresh()
    return { ok: true }
  },

  removeApiKey: async () => {
    await window.gitApi.clearAiApiKey()
    await get().refresh()
  }
}))
