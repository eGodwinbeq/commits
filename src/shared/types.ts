export interface GitResultOk<T> {
  ok: true
  data: T
}

export interface GitResultErr {
  ok: false
  error: {
    code: string
    message: string
    stderr?: string
  }
}

export type GitResult<T> = GitResultOk<T> | GitResultErr

export interface RepoInfo {
  path: string
  name: string
}

export interface CommitRef {
  name: string
  type: 'head' | 'local-branch' | 'remote-branch' | 'tag'
}

export interface Commit {
  sha: string
  parents: string[]
  authorName: string
  authorEmail: string
  date: string
  subject: string
  refs: CommitRef[]
}

export interface Branch {
  refName: string
  name: string
  sha: string
  isHead: boolean
  kind: 'local' | 'remote' | 'tag'
  remote?: string
  upstream?: string
  ahead?: number
  behind?: number
}

export type FileStatusCode =
  | 'modified'
  | 'added'
  | 'deleted'
  | 'renamed'
  | 'copied'
  | 'untracked'
  | 'conflicted'

export interface FileStatusEntry {
  path: string
  origPath?: string
  status: FileStatusCode
}

export interface RepoStatus {
  branch: string | null
  upstream: string | null
  ahead: number
  behind: number
  staged: FileStatusEntry[]
  unstaged: FileStatusEntry[]
  untracked: FileStatusEntry[]
  conflicted: FileStatusEntry[]
}

export type DiffLineType = 'context' | 'add' | 'del' | 'hunk-header' | 'meta'

export interface DiffLine {
  type: DiffLineType
  text: string
  oldLineNo?: number
  newLineNo?: number
}

export interface DiffHunk {
  header: string
  lines: DiffLine[]
}

export interface DiffFile {
  path: string
  origPath?: string
  isBinary: boolean
  isRename: boolean
  isNew: boolean
  isDeleted: boolean
  hunks: DiffHunk[]
}

export interface DiffTarget {
  commit?: string
  path?: string
  staged?: boolean
}

export interface CommitDetail {
  commit: Commit
  files: DiffFile[]
}
