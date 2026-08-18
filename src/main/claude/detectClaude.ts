import { execFile } from 'child_process'
import { existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

export interface ClaudeCliInfo {
  available: boolean
  path?: string
  version?: string
}

// Claude Code's own installer puts the CLI at ~/.claude/local/claude on every platform, which
// is often not on PATH (especially for the desktop app's bundled install). Check that and a
// handful of other common install locations before giving up.
function candidatePaths(): string[] {
  const home = homedir()
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA ?? join(home, 'AppData', 'Local')
    const appData = process.env.APPDATA ?? join(home, 'AppData', 'Roaming')
    const programFiles = process.env['ProgramFiles'] ?? 'C:\\Program Files'
    return [
      join(home, '.claude', 'local', 'claude.exe'),
      join(localAppData, 'Programs', 'claude-code', 'claude.exe'),
      join(localAppData, 'AnthropicClaude', 'claude.exe'),
      join(programFiles, 'Claude', 'claude.exe'),
      join(appData, 'npm', 'claude.cmd')
    ]
  }
  if (process.platform === 'darwin') {
    return [
      join(home, '.claude', 'local', 'claude'),
      '/Applications/Claude.app/Contents/Resources/claude',
      '/opt/homebrew/bin/claude',
      '/usr/local/bin/claude'
    ]
  }
  return [join(home, '.claude', 'local', 'claude'), '/usr/local/bin/claude']
}

function checkVersion(binPath: string): Promise<string | null> {
  return new Promise((resolve) => {
    execFile(binPath, ['--version'], { timeout: 5000, windowsHide: true }, (err, stdout) => {
      resolve(err ? null : stdout.toString().trim())
    })
  })
}

let cached: ClaudeCliInfo | null = null

export async function detectClaudeCli(forceRefresh = false): Promise<ClaudeCliInfo> {
  if (cached && !forceRefresh) return cached

  try {
    // Check every candidate in parallel (each capped at 5s by checkVersion's own timeout) so
    // detection never takes longer than the slowest single check, even with several
    // candidates to try.
    const candidates = ['claude', ...candidatePaths().filter((p) => existsSync(p))]
    const results = await Promise.all(
      candidates.map(async (path) => ({ path, version: await checkVersion(path) }))
    )
    const hit = results.find((r) => r.version)
    cached = hit ? { available: true, path: hit.path, version: hit.version as string } : { available: false }
  } catch {
    cached = { available: false }
  }

  return cached
}
