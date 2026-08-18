import { spawn, type ChildProcessWithoutNullStreams } from 'child_process'
import type { GithubAuthEvent } from '@shared/types'

let activeChild: ChildProcessWithoutNullStreams | null = null

const DEVICE_CODE_RE = /([A-Z0-9]{4}-[A-Z0-9]{4})/

/** Drives `gh auth login --web` (GitHub's own OAuth device-code flow) headlessly so users
 * never need to open a terminal: we parse the one-time code out of gh's output as soon as it
 * appears and hand it back to the renderer, then feed Enter to stdin ourselves since gh
 * normally waits for that keypress before proceeding (it can't detect our GUI is "attached"). */
export function startGithubDeviceAuth(onEvent: (evt: GithubAuthEvent) => void): void {
  if (activeChild) {
    onEvent({ type: 'error', message: 'A GitHub sign-in is already in progress.' })
    return
  }

  let child: ChildProcessWithoutNullStreams
  try {
    child = spawn(
      'gh',
      ['auth', 'login', '--hostname', 'github.com', '--git-protocol', 'https', '--web'],
      { windowsHide: true, env: { ...process.env } }
    )
  } catch (err) {
    onEvent({ type: 'error', message: err instanceof Error ? err.message : String(err) })
    return
  }
  activeChild = child

  let buffer = ''
  let codeSent = false

  const handleChunk = (chunk: Buffer): void => {
    buffer += chunk.toString('utf-8')
    if (codeSent) return
    const match = buffer.match(DEVICE_CODE_RE)
    if (match) {
      codeSent = true
      onEvent({ type: 'code', code: match[1], url: 'https://github.com/login/device' })
      child.stdin.write('\n')
    }
  }

  child.stdout.on('data', handleChunk)
  child.stderr.on('data', handleChunk)

  child.on('error', (err) => {
    activeChild = null
    onEvent({
      type: 'error',
      message: /ENOENT/.test(err.message)
        ? 'GitHub CLI ("gh") was not found on PATH.'
        : err.message
    })
  })

  child.on('close', (exitCode) => {
    activeChild = null
    if (exitCode === 0) {
      onEvent({ type: 'done', ok: true })
    } else {
      onEvent({
        type: 'done',
        ok: false,
        message: buffer.trim() || `gh auth login exited with code ${exitCode}`
      })
    }
  })
}

export function cancelGithubDeviceAuth(): void {
  if (activeChild) {
    activeChild.kill()
    activeChild = null
  }
}
