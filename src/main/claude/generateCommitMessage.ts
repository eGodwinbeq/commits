import { execClaude } from './claudeExecutor'
import { callAnthropicMessages } from './anthropicClient'
import { getApiKey } from '../ai/aiSettings'
import { getWorkingDiffText } from '../git/gitDiff'

export type ClaudeErrorCode = 'CLAUDE_NOT_CONFIGURED' | 'CLAUDE_NO_CHANGES' | 'CLAUDE_ERROR'

export class ClaudeCliError extends Error {
  code: ClaudeErrorCode
  constructor(message: string, code: ClaudeErrorCode) {
    super(message)
    this.code = code
  }
}

const MAX_DIFF_CHARS = 60_000

const INSTRUCTION =
  'You are generating a git commit message. Read the unified diff of staged changes given below ' +
  'and write a single, well-formed commit message for it: a concise imperative-mood subject line ' +
  '(max ~72 chars), and if useful, a blank line followed by a short body explaining the why. ' +
  'Output ONLY the commit message text - no preamble, explanation, code fences, or surrounding quotes.'

export async function generateCommitMessage(repoPath: string): Promise<string> {
  const diff = await getWorkingDiffText(repoPath, { staged: true })
  if (!diff.trim()) {
    throw new ClaudeCliError('No staged changes to generate a message for.', 'CLAUDE_NO_CHANGES')
  }
  const diffPayload =
    diff.length > MAX_DIFF_CHARS
      ? `${diff.slice(0, MAX_DIFF_CHARS)}\n\n[diff truncated - showing first ${MAX_DIFF_CHARS} characters only]`
      : diff

  const apiKey = getApiKey()
  if (apiKey) {
    try {
      const text = await callAnthropicMessages(apiKey, {
        system: INSTRUCTION,
        userMessage: `Staged diff:\n\n${diffPayload}`
      })
      const message = text.trim()
      if (!message) throw new Error('Anthropic API returned an empty response.')
      return message
    } catch (err) {
      throw new ClaudeCliError(err instanceof Error ? err.message : String(err), 'CLAUDE_ERROR')
    }
  }

  let result: Awaited<ReturnType<typeof execClaude>>
  try {
    result = await execClaude(repoPath, INSTRUCTION, diffPayload)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (/ENOENT/.test(message)) {
      throw new ClaudeCliError(
        'No AI connection configured. Add an Anthropic API key or install the Claude Code CLI in Settings.',
        'CLAUDE_NOT_CONFIGURED'
      )
    }
    throw new ClaudeCliError(message, 'CLAUDE_ERROR')
  }

  if (result.code !== 0) {
    throw new ClaudeCliError(
      result.stderr.trim() || 'Claude Code failed to generate a commit message.',
      'CLAUDE_ERROR'
    )
  }

  const message = result.stdout.toString('utf-8').trim()
  if (!message) {
    throw new ClaudeCliError('Claude Code returned an empty response.', 'CLAUDE_ERROR')
  }
  return message
}
