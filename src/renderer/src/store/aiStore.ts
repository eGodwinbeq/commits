import { create } from 'zustand'
import type { AiStatus } from '@shared/types'

interface AiState {
  status: AiStatus | null
  isLoading: boolean
  error: string | null
  isTestingCli: boolean
  cliTestResult: { ok: boolean; message: string } | null
  refresh: () => Promise<void>
  saveApiKey: (key: string) => Promise<{ ok: true } | { ok: false; message: string }>
  removeApiKey: () => Promise<void>
  testClaudeCli: () => Promise<void>
  launchClaudeSignIn: () => Promise<{ ok: true } | { ok: false; message: string }>
}

export const useAiStore = create<AiState>((set, get) => ({
  status: null,
  isLoading: false,
  error: null,
  isTestingCli: false,
  cliTestResult: null,

  refresh: async () => {
    set({ isLoading: true, error: null })
    try {
      const result = await window.gitApi.getAiStatus()
      if (!result.ok) {
        set({ isLoading: false, error: result.error.message })
        return
      }
      set({ status: result.data, isLoading: false })
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : String(err) })
    }
  },

  saveApiKey: async (key: string) => {
    try {
      const result = await window.gitApi.setAiApiKey(key)
      if (!result.ok) return { ok: false, message: result.error.message }
      await get().refresh()
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : String(err) }
    }
  },

  removeApiKey: async () => {
    try {
      await window.gitApi.clearAiApiKey()
    } finally {
      await get().refresh()
    }
  },

  testClaudeCli: async () => {
    set({ isTestingCli: true, cliTestResult: null })
    try {
      const result = await window.gitApi.testClaudeCli()
      set({
        isTestingCli: false,
        cliTestResult: result.ok
          ? { ok: true, message: 'Connected - Claude Code responded successfully.' }
          : { ok: false, message: result.error.message }
      })
    } catch (err) {
      set({
        isTestingCli: false,
        cliTestResult: { ok: false, message: err instanceof Error ? err.message : String(err) }
      })
    }
    await get().refresh()
  },

  launchClaudeSignIn: async () => {
    try {
      const result = await window.gitApi.launchClaudeSignIn()
      if (!result.ok) return { ok: false, message: result.error.message }
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : String(err) }
    }
  }
}))
