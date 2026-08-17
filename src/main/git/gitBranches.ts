import { execGit } from './gitExecutor'
import type { Branch } from '@shared/types'

// git for-each-ref's --format does NOT support %xNN hex-escapes (unlike git log's
// pretty-format) - any text between placeholders is included in the output literally.
// So the separator must be a real character embedded directly in the argv. Use the unit
// separator (0x1F) rather than NUL: an actual NUL inside an argv element is unsafe (it's
// the C-string terminator and can truncate the argument before it reaches git).
const FIELD_SEP = '\x1f'

function parseTrack(track: string): { ahead: number; behind: number } {
  const aheadMatch = track.match(/ahead (\d+)/)
  const behindMatch = track.match(/behind (\d+)/)
  return {
    ahead: aheadMatch ? parseInt(aheadMatch[1], 10) : 0,
    behind: behindMatch ? parseInt(behindMatch[1], 10) : 0
  }
}

export async function getBranches(repoPath: string): Promise<Branch[]> {
  const format = ['%(refname)', '%(objectname)', '%(upstream)', '%(upstream:track)', '%(HEAD)'].join(
    FIELD_SEP
  )
  const result = await execGit(repoPath, [
    'for-each-ref',
    `--format=${format}`,
    'refs/heads',
    'refs/remotes',
    'refs/tags'
  ])
  if (result.code !== 0) {
    throw new Error(`git for-each-ref failed: ${result.stderr}`)
  }

  const text = result.stdout.toString('utf-8')
  const lines = text.split('\n').filter((l) => l.trim().length > 0)

  return lines.map((line) => {
    const [refname, sha, upstream, track, head] = line.split(FIELD_SEP)
    const isHead = head === '*'

    let kind: Branch['kind'] = 'local'
    let name = refname
    let remote: string | undefined

    if (refname.startsWith('refs/heads/')) {
      kind = 'local'
      name = refname.replace('refs/heads/', '')
    } else if (refname.startsWith('refs/remotes/')) {
      kind = 'remote'
      name = refname.replace('refs/remotes/', '')
      remote = name.split('/')[0]
    } else if (refname.startsWith('refs/tags/')) {
      kind = 'tag'
      name = refname.replace('refs/tags/', '')
    }

    const { ahead, behind } = parseTrack(track ?? '')

    return {
      refName: refname,
      name,
      sha,
      isHead,
      kind,
      remote,
      upstream: upstream || undefined,
      ahead,
      behind
    }
  })
}
