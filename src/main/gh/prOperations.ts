import { execGh } from './ghExecutor'
import { parseUnifiedDiff } from '../git/gitDiff'
import type { DiffFile, PrMergeMethod, PrStateFilter, PullRequest } from '@shared/types'

export type GhErrorCode = 'GH_NOT_FOUND' | 'GH_NOT_AUTHENTICATED' | 'GH_ERROR'

export class GhCliError extends Error {
  code: GhErrorCode
  constructor(message: string, code: GhErrorCode) {
    super(message)
    this.code = code
  }
}

const LIST_FIELDS =
  'number,title,author,headRefName,baseRefName,isDraft,state,url,createdAt,updatedAt,mergeable,reviewDecision,additions,deletions,changedFiles'
const VIEW_FIELDS = `${LIST_FIELDS},body`

interface RawPr {
  number: number
  title: string
  body?: string
  author?: { login?: string }
  headRefName: string
  baseRefName: string
  isDraft?: boolean
  state: string
  url: string
  createdAt: string
  updatedAt: string
  mergeable?: string
  reviewDecision?: string
  additions?: number
  deletions?: number
  changedFiles?: number
}

function toPr(raw: RawPr): PullRequest {
  return {
    number: raw.number,
    title: raw.title,
    body: raw.body ?? '',
    author: raw.author?.login ?? 'unknown',
    state: raw.state === 'MERGED' ? 'merged' : raw.state === 'CLOSED' ? 'closed' : 'open',
    isDraft: !!raw.isDraft,
    headRefName: raw.headRefName,
    baseRefName: raw.baseRefName,
    url: raw.url,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    mergeable: raw.mergeable === 'CONFLICTING' ? 'CONFLICTING' : raw.mergeable === 'MERGEABLE' ? 'MERGEABLE' : 'UNKNOWN',
    reviewDecision: raw.reviewDecision || undefined,
    additions: raw.additions ?? 0,
    deletions: raw.deletions ?? 0,
    changedFiles: raw.changedFiles ?? 0
  }
}

async function run(repoPath: string, args: string[]): Promise<string> {
  let result: Awaited<ReturnType<typeof execGh>>
  try {
    result = await execGh(repoPath, args)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (/ENOENT/.test(message)) {
      throw new GhCliError(
        'GitHub CLI ("gh") was not found on PATH. Install it from cli.github.com to use Pull Requests.',
        'GH_NOT_FOUND'
      )
    }
    throw new GhCliError(message, 'GH_ERROR')
  }
  if (result.code !== 0) {
    const stderr = result.stderr.trim()
    if (/gh auth login|not logged into/i.test(stderr)) {
      throw new GhCliError(
        'Not authenticated with GitHub CLI. Run "gh auth login" in a terminal, then retry.',
        'GH_NOT_AUTHENTICATED'
      )
    }
    if (/no git remotes found|does not appear to be a git repository|unknown host/i.test(stderr)) {
      throw new GhCliError(
        'This repository has no GitHub remote that "gh" can resolve. Check "git remote -v".',
        'GH_ERROR'
      )
    }
    throw new GhCliError(stderr || `gh ${args[0]} failed (exit ${result.code})`, 'GH_ERROR')
  }
  return result.stdout.toString('utf-8')
}

function parseJson<T>(out: string, context: string): T {
  try {
    return JSON.parse(out) as T
  } catch {
    throw new GhCliError(
      `Could not parse "gh"'s response while ${context}. Try running "gh --version" to confirm it's up to date.`,
      'GH_ERROR'
    )
  }
}

export async function listPullRequests(
  repoPath: string,
  state: PrStateFilter = 'open'
): Promise<PullRequest[]> {
  const out = await run(repoPath, [
    'pr',
    'list',
    '--state',
    state,
    '--json',
    LIST_FIELDS,
    '--limit',
    '100'
  ])
  const raw = parseJson<RawPr[]>(out, 'listing pull requests')
  return raw.map(toPr)
}

export async function getPullRequest(repoPath: string, number: number): Promise<PullRequest> {
  const out = await run(repoPath, ['pr', 'view', String(number), '--json', VIEW_FIELDS])
  return toPr(parseJson<RawPr>(out, 'loading the pull request'))
}

export async function getPullRequestDiff(repoPath: string, number: number): Promise<DiffFile[]> {
  const out = await run(repoPath, ['pr', 'diff', String(number)])
  return parseUnifiedDiff(out)
}

export async function createPullRequest(
  repoPath: string,
  opts: {
    title: string
    body: string
    base: string
    head?: string
    draft?: boolean
    reviewers?: string[]
    labels?: string[]
  }
): Promise<PullRequest> {
  const args = ['pr', 'create', '--title', opts.title, '--body', opts.body, '--base', opts.base]
  if (opts.head) args.push('--head', opts.head)
  if (opts.draft) args.push('--draft')
  if (opts.reviewers?.length) args.push('--reviewer', opts.reviewers.join(','))
  if (opts.labels?.length) args.push('--label', opts.labels.join(','))
  const out = await run(repoPath, args)
  const match = out.trim().match(/\/pull\/(\d+)/)
  const number = match ? parseInt(match[1], 10) : NaN
  if (Number.isNaN(number)) {
    throw new GhCliError('Pull request was created but its number could not be determined.', 'GH_ERROR')
  }
  return getPullRequest(repoPath, number)
}

export async function mergePullRequest(
  repoPath: string,
  number: number,
  opts: { method: PrMergeMethod; deleteBranch?: boolean }
): Promise<void> {
  const args = ['pr', 'merge', String(number), `--${opts.method}`]
  if (opts.deleteBranch) args.push('--delete-branch')
  await run(repoPath, args)
}

export async function closePullRequest(repoPath: string, number: number): Promise<void> {
  await run(repoPath, ['pr', 'close', String(number)])
}
