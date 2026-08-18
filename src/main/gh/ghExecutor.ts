import { spawn } from 'child_process'

export interface ExecGhResult {
  stdout: Buffer
  stderr: string
  code: number | null
}

const TIMEOUT_MS = 30_000

export function execGh(repoPath: string, args: string[]): Promise<ExecGhResult> {
  return new Promise((resolve, reject) => {
    const child = spawn('gh', args, {
      cwd: repoPath,
      windowsHide: true,
      env: { ...process.env, GH_PAGER: 'cat', NO_COLOR: '1' }
    })

    const stdoutChunks: Buffer[] = []
    const stderrChunks: Buffer[] = []

    const timer = setTimeout(() => {
      child.kill()
      reject(new Error(`gh ${args[0]} timed out after ${TIMEOUT_MS}ms`))
    }, TIMEOUT_MS)

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
  })
}
