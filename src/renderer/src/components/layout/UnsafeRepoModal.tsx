import { useRepoStore } from '../../store/repoStore'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'

export function UnsafeRepoModal(): React.JSX.Element | null {
  const unsafeRepoPath = useRepoStore((s) => s.unsafeRepoPath)
  const isLoading = useRepoStore((s) => s.isLoading)
  const trustUnsafeRepo = useRepoStore((s) => s.trustUnsafeRepo)
  const dismissUnsafeRepo = useRepoStore((s) => s.dismissUnsafeRepo)

  if (!unsafeRepoPath) return null

  return (
    <Modal onClose={dismissUnsafeRepo}>
      <h2 className="mb-2 text-[15px] font-semibold text-ide-text">Unsafe Repository</h2>
      <p className="mb-1 text-[13px] text-ide-textDim">
        Git blocked this folder because it&apos;s owned by a different user account on this
        machine:
      </p>
      <p className="mb-4 truncate rounded bg-ide-bg px-2 py-1 font-mono text-[12px] text-ide-text">
        {unsafeRepoPath}
      </p>
      <p className="mb-4 text-[13px] text-ide-textDim">
        Only continue if you trust this repository. This adds it to git&apos;s global{' '}
        <code className="text-ide-text">safe.directory</code> list, the same as running{' '}
        <code className="text-ide-text">git config --global --add safe.directory</code>.
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="default" disabled={isLoading} onClick={dismissUnsafeRepo}>
          Cancel
        </Button>
        <Button variant="primary" loading={isLoading} onClick={trustUnsafeRepo}>
          Trust This Repository
        </Button>
      </div>
    </Modal>
  )
}
