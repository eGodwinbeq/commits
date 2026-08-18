import { homedir } from 'os'
import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import type { AiStatus, GitResult } from '@shared/types'
import { ClaudeCliError, generateCommitMessage } from '../claude/generateCommitMessage'
import { detectClaudeCli } from '../claude/detectClaude'
import { execClaude } from '../claude/claudeExecutor'
import { launchClaudeInTerminal } from '../claude/launchSignIn'
import { clearApiKey, hasApiKey, setApiKey } from '../ai/aiSettings'

const TEST_TIMEOUT_MS = 20_000

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

export function registerAiHandlers(): void {
  ipcMain.handle(
    IpcChannels.aiGenerateCommitMessage,
    (_evt, repoPath: string): Promise<GitResult<string>> => safe(() => generateCommitMessage(repoPath))
  )

  ipcMain.handle(IpcChannels.aiGetStatus, async (): Promise<GitResult<AiStatus>> => {
    const cli = await detectClaudeCli()
    return {
      ok: true,
      data: {
        hasApiKey: hasApiKey(),
        cliAvailable: cli.available,
        cliVersion: cli.version,
        cliPath: cli.path
      }
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

  ipcMain.handle(IpcChannels.aiTestClaudeCli, (): Promise<GitResult<string>> =>
    safe(async () => {
      const cli = await detectClaudeCli(true)
      if (!cli.available || !cli.path) {
        throw new ClaudeCliError(
          'Claude Code was not found. Install it, or use "Open Claude Code to Sign In" once it is.',
          'CLAUDE_NOT_CONFIGURED'
        )
      }
      const result = await execClaude(
        cli.path,
        homedir(),
        'Reply with exactly the single word OK and nothing else.',
        '',
        TEST_TIMEOUT_MS
      )
      if (result.code !== 0) {
        throw new ClaudeCliError(
          result.stderr.trim() ||
            'Claude Code did not respond successfully - you may need to sign in first.',
          'CLAUDE_ERROR'
        )
      }
      const reply = result.stdout.toString('utf-8').trim()
      return reply || 'Connected'
    })
  )

  ipcMain.handle(IpcChannels.aiLaunchClaudeSignIn, (): Promise<GitResult<void>> =>
    safe(async () => {
      const cli = await detectClaudeCli()
      if (!cli.available || !cli.path) {
        throw new ClaudeCliError(
          'Claude Code was not found on this machine. Install it first.',
          'CLAUDE_NOT_CONFIGURED'
        )
      }
      launchClaudeInTerminal(cli.path)
    })
  )
}
