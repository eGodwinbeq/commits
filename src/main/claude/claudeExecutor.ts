import { spawn } from 'child_process'

export interface ExecClaudeResult {
  stdout: Buffer
  stderr: string
  code: number | null
}

const DEFAULT_TIMEOUT_MS = 60_000

/** Runs the Claude Code CLI in non-interactive print mode, feeding `stdinInput` as the
 * subject material and `prompt` as the instruction. Relies entirely on whatever auth the
 * resolved `claude` install already has - the app never touches API keys for this path. */
export function execClaude(
  binPath: string,
  cwd: string,
  prompt: string,
  stdinInput: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<ExecClaudeResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(binPath, ['-p', prompt], {
      cwd,
      windowsHide: true,
      env: { ...process.env }
    })

    const stdoutChunks: Buffer[] = []
    const stderrChunks: Buffer[] = []

    const timer = setTimeout(() => {
      child.kill()
      reject(new Error(`claude timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    child.stdout.on('data', (chunk: Buffer) => stdoutChunks.push(chunk))
    child.stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk))

    child.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })

    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({
        stdout: Buffer.concat(stdoutChunks),
        stderr: Buffer.concat(stderrChunks).toString('utf-8'),
        code
      })
    })

    child.stdin.write(stdinInput)
    child.stdin.end()
  })
}
