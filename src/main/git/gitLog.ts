import { execGit } from './gitExecutor'
import type { Commit, CommitRef } from '@shared/types'

// git log's --format supports %xNN hex-escapes, which git itself expands into the
// corresponding raw byte in its *output*. We must pass the textual escape ("%x00") in the
// argv, not an embedded NUL byte - an actual NUL inside a single argv element is unsafe
// (it's the C-string terminator and can truncate the argument before it reaches git).
const FORMAT_FIELD_SEP = '%x00'
const FORMAT_RECORD_SEP = '%x1e'

// The actual bytes git emits once it expands the escapes above - used to split stdout.
const OUT_FIELD_SEP = '\x00'
const OUT_RECORD_SEP = '\x1e'

const LOG_FORMAT =
  ['%H', '%P', '%an', '%ae', '%ad', '%s', '%D'].join(FORMAT_FIELD_SEP) + FORMAT_RECORD_SEP

function parseRefs(refString: string): CommitRef[] {
  if (!refString) return []
  return refString
    .split(', ')
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((raw) => {
      if (raw === 'HEAD' || raw.startsWith('HEAD ->')) {
        const name = raw.startsWith('HEAD ->') ? raw.replace('HEAD -> ', '') : 'HEAD'
        return { name, type: raw === 'HEAD' ? 'head' : 'local-branch' } as CommitRef
      }
      if (raw.startsWith('tag: ')) {
        return { name: raw.replace('tag: ', ''), type: 'tag' } as CommitRef
      }
      if (raw.includes('/')) {
        return { name: raw, type: 'remote-branch' } as CommitRef
      }
      return { name: raw, type: 'local-branch' } as CommitRef
    })
}

export async function getLog(
  repoPath: string,
  opts: { maxCount?: number; skip?: number; branch?: string } = {}
): Promise<Commit[]> {
  const maxCount = opts.maxCount ?? 500
  const args = [
    'log',
    opts.branch ?? '--all',
    '--parents',
    '--date=iso-strict',
    `--format=${LOG_FORMAT}`,
    `-n${maxCount}`
  ]
  if (opts.skip) args.push(`--skip=${opts.skip}`)

  const result = await execGit(repoPath, args)
  if (result.code !== 0) {
    throw new Error(`git log failed: ${result.stderr}`)
  }

  const text = result.stdout.toString('utf-8')
  const records = text.split(OUT_RECORD_SEP).filter((r) => r.trim().length > 0)

  return records.map((record) => {
    const fields = record.replace(/^\n/, '').split(OUT_FIELD_SEP)
    const [sha, parents, authorName, authorEmail, date, subject, refs] = fields
    return {
      sha,
      parents: parents ? parents.split(' ').filter(Boolean) : [],
      authorName,
      authorEmail,
      date,
      subject,
      refs: parseRefs(refs ?? '')
    }
  })
}
