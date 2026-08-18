import { execFile } from 'child_process'
import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import type { AiStatus, GitResult } from '@shared/types'
import { ClaudeCliError, generateCommitMessage } from '../claude/generateCommitMessage'
import { clearApiKey, hasApiKey, setApiKey } from '../ai/aiSettings'

async function safe<T>(fn: () => Promise<T>): Promise<GitResult<T>> {
  try {
    return { ok: true, data: await fn() }
  } catch (err) {
    if (err instanceof ClaudeCliError) {
      return { ok: false, error: { code: err.code, message: err.message } }
    }
    return {
      ok: false,
      error: { code: 'CLAUDE_ERROR', message: err instanceof Error ? err.message : String(err) }
    }
  }
}

function detectClaudeCli(): Promise<{ available: boolean; version?: string }> {
  return new Promise((resolve) => {
    execFile('claude', ['--version'], { timeout: 5000, windowsHide: true }, (err, stdout) => {
      if (err) {
        resolve({ available: false })
        return
      }
      resolve({ available: true, version: stdout.toString().trim() })
    })
  })
}

export function registerAiHandlers(): void {
  ipcMain.handle(
    IpcChannels.aiGenerateCommitMessage,
    (_evt, repoPath: string): Promise<GitResult<string>> => safe(() => generateCommitMessage(repoPath))
  )

  ipcMain.handle(IpcChannels.aiGetStatus, async (): Promise<GitResult<AiStatus>> => {
    const cli = await detectClaudeCli()
    return {
      ok: true,
      data: { hasApiKey: hasApiKey(), cliAvailable: cli.available, cliVersion: cli.version }
    }
  })

  ipcMain.handle(IpcChannels.aiSetApiKey, (_evt, key: string): Promise<GitResult<void>> => {
    if (!key || !key.trim()) {
      return Promise.resolve({
        ok: false,
        error: { code: 'INVALID_KEY', message: 'API key cannot be empty.' }
      })
    }
    setApiKey(key)
    return Promise.resolve({ ok: true, data: undefined })
  })

  ipcMain.handle(IpcChannels.aiClearApiKey, (): Promise<GitResult<void>> => {
    clearApiKey()
    return Promise.resolve({ ok: true, data: undefined })
  })
}
