import { spawn } from 'child_process'

/** Opens a terminal window running the Claude Code CLI interactively so the user can complete
 * its own sign-in flow (browser OAuth or API key prompt) - we never reimplement that flow
 * ourselves, just hand off to the CLI's familiar one. Best-effort: silently does nothing
 * useful on platforms/terminals we don't recognize, since this is a convenience shortcut and
 * the user can always run `claude` themselves. */
export function launchClaudeInTerminal(binPath: string): void {
  if (process.platform === 'win32') {
    const child = spawn('cmd.exe', ['/c', 'start', '""', 'cmd.exe', '/k', binPath], {
      detached: true,
      windowsHide: false,
      stdio: 'ignore'
    })
    child.unref()
    return
  }
  if (process.platform === 'darwin') {
    const escaped = binPath.replace(/"/g, '\\"')
    const child = spawn('osascript', ['-e', `tell application "Terminal" to do script "${escaped}"`], {
      detached: true,
      stdio: 'ignore'
    })
    child.unref()
    return
  }
  const child = spawn('x-terminal-emulator', ['-e', binPath], { detached: true, stdio: 'ignore' })
  child.unref()
}
