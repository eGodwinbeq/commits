import { spawn } from 'child_process'

export interface ExecGitResult {
  stdout: Buffer
  stderr: string
  code: number | null
}

export class GitCommandError extends Error {
  code: string
  stderr: string

  constructor(message: string, code: string, stderr: string) {
    super(message)
    this.code = code
    this.stderr = stderr
  }
}

const DEFAULT_TIMEOUT_MS = 30_000
const NETWORK_TIMEOUT_MS = 120_000

const NETWORK_SUBCOMMANDS = new Set(['push', 'pull', 'fetch', 'clone'])

export function execGit(
  repoPath: string,
  args: string[],
  opts: { timeoutMs?: number } = {}
): Promise<ExecGitResult> {
  const timeoutMs =
    opts.timeoutMs ?? (NETWORK_SUBCOMMANDS.has(args[0]) ? NETWORK_TIMEOUT_MS : DEFAULT_TIMEOUT_MS)

  return new Promise((resolve, reject) => {
    const child = spawn('git', args, {
      cwd: repoPath,
      windowsHide: true,
      env: { ...process.env, GIT_PAGER: 'cat', GIT_TERMINAL_PROMPT: '0' }
    })

    const stdoutChunks: Buffer[] = []
    const stderrChunks: Buffer[] = []

    const timer = setTimeout(() => {
      child.kill()
      reject(new GitCommandError(`git ${args[0]} timed out after ${timeoutMs}ms`, 'TIMEOUT', ''))
    }, timeoutMs)

    child.stdout.on('data', (chunk: Buffer) => stdoutChunks.push(chunk))
    child.stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk))

    child.on('error', (err) => {
      clearTimeout(timer)
      reject(new GitCommandError(err.message, 'SPAWN_ERROR', ''))
    })

    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({
        stdout: Buffer.concat(stdoutChunks),
        stderr: Buffer.concat(stderrChunks).toString('utf-8'),
        code
      })
    })
  })
}

/** Runs git and throws GitCommandError on non-zero exit. Use for commands where any failure is unexpected. */
export async function execGitOrThrow(repoPath: string, args: string[]): Promise<string> {
  const result = await execGit(repoPath, args)
  if (result.code !== 0) {
    throw new GitCommandError(`git ${args.join(' ')} failed`, 'GIT_ERROR', result.stderr)
  }
  return result.stdout.toString('utf-8')
}
