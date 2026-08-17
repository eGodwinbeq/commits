import { useLogStore } from '../store/logStore'
import { useBranchStore } from '../store/branchStore'
import { useStatusStore } from '../store/statusStore'

/** Re-fetches the given slices after a mutating git operation. */
export async function invalidate(
  repoPath: string,
  parts: Array<'log' | 'branches' | 'status'>
): Promise<void> {
  const tasks: Promise<void>[] = []
  if (parts.includes('log')) tasks.push(useLogStore.getState().load(repoPath))
  if (parts.includes('branches')) tasks.push(useBranchStore.getState().load(repoPath))
  if (parts.includes('status')) tasks.push(useStatusStore.getState().load(repoPath))
  await Promise.all(tasks)
}
