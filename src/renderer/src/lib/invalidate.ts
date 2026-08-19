import { useLogStore } from '../store/logStore'
import { useBranchStore } from '../store/branchStore'
import { useStatusStore } from '../store/statusStore'

/** Re-fetches the given slices after a mutating git operation.
 *
 * `branches` is awaited before `log` (rather than run in parallel) because the log's default
 * "current branch" filter resolves against whatever `branchStore.branches` says HEAD is right
 * now - loading them in parallel could resolve that against the branch we just checked out
 * *from* instead of the one we're on now. */
export async function invalidate(
  repoPath: string,
  parts: Array<'log' | 'branches' | 'status'>
): Promise<void> {
  if (parts.includes('branches')) await useBranchStore.getState().load(repoPath)
  const tasks: Promise<void>[] = []
  if (parts.includes('log')) tasks.push(useLogStore.getState().load(repoPath))
  if (parts.includes('status')) tasks.push(useStatusStore.getState().load(repoPath))
  await Promise.all(tasks)
}
