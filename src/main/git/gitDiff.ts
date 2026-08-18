import { execGit } from './gitExecutor'
import type { DiffFile, DiffHunk, DiffLine } from '@shared/types'

export function parseUnifiedDiff(text: string): DiffFile[] {
  const files: DiffFile[] = []
  const fileBlocks = text.split(/^diff --git /m).filter((b) => b.trim().length > 0)

  for (const block of fileBlocks) {
    const lines = block.split('\n')
    const headerLine = lines[0]
    const pathMatch = headerLine.match(/a\/(.+?) b\/(.+)$/)
    let path = pathMatch ? pathMatch[2] : headerLine.trim()
    let origPath = pathMatch ? pathMatch[1] : undefined

    const isBinary = block.includes('Binary files ')
    let isRename = false
    let isNew = false
    let isDeleted = false

    const hunks: DiffHunk[] = []
    let currentHunk: DiffHunk | null = null
    let oldLineNo = 0
    let newLineNo = 0

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]

      if (line.startsWith('rename from ')) isRename = true
      else if (line.startsWith('new file mode')) isNew = true
      else if (line.startsWith('deleted file mode')) isDeleted = true
      else if (line.startsWith('rename to ')) {
        path = line.replace('rename to ', '').trim()
      } else if (line.startsWith('+++ ')) {
        const m = line.match(/\+\+\+ b\/(.+)$/)
        if (m) path = m[1]
      } else if (line.startsWith('--- ')) {
        const m = line.match(/--- a\/(.+)$/)
        if (m) origPath = m[1]
      } else if (line.startsWith('@@')) {
        const hunkMatch = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
        oldLineNo = hunkMatch ? parseInt(hunkMatch[1], 10) : 0
        newLineNo = hunkMatch ? parseInt(hunkMatch[2], 10) : 0
        currentHunk = { header: line, lines: [] }
        hunks.push(currentHunk)
      } else if (currentHunk) {
        if (line.startsWith('+')) {
          currentHunk.lines.push({ type: 'add', text: line.slice(1), newLineNo: newLineNo++ })
        } else if (line.startsWith('-')) {
          currentHunk.lines.push({ type: 'del', text: line.slice(1), oldLineNo: oldLineNo++ })
        } else if (line.startsWith(' ') || line === '') {
          currentHunk.lines.push({
            type: 'context',
            text: line.slice(1),
            oldLineNo: oldLineNo++,
            newLineNo: newLineNo++
          } as DiffLine)
        } else if (line.startsWith('\\')) {
          // "\ No newline at end of file" - ignore
        }
      }
    }

    files.push({
      path,
      origPath: origPath !== path ? origPath : undefined,
      isBinary,
      isRename,
      isNew,
      isDeleted,
      hunks
    })
  }

  return files
}

export async function getWorkingDiff(
  repoPath: string,
  opts: { path?: string; staged?: boolean } = {}
): Promise<DiffFile[]> {
  const args = ['diff', '--no-color', '-M']
  if (opts.staged) args.push('--cached')
  if (opts.path) args.push('--', opts.path)

  const result = await execGit(repoPath, args)
  if (result.code !== 0 && result.code !== 1) {
    throw new Error(`git diff failed: ${result.stderr}`)
  }
  return parseUnifiedDiff(result.stdout.toString('utf-8'))
}

export async function getCommitDiff(repoPath: string, sha: string): Promise<DiffFile[]> {
  const result = await execGit(repoPath, ['show', '--no-color', '-M', '--format=', sha])
  if (result.code !== 0) {
    throw new Error(`git show failed: ${result.stderr}`)
  }
  return parseUnifiedDiff(result.stdout.toString('utf-8'))
}
