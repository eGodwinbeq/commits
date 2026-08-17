import { useMemo, useState } from 'react'
import { useBranchStore, currentBranchName } from '../../store/branchStore'
import { useRepoStore } from '../../store/repoStore'
import { buildTree, type TreeNode } from './branchTreeUtils'
import { BranchContextMenu } from './BranchContextMenu'
import { invalidate } from '../../lib/invalidate'
import type { Branch } from '@shared/types'

function TreeNodeRow({
  node,
  depth,
  headBranch,
  onContextMenu
}: {
  node: TreeNode
  depth: number
  headBranch: string | null
  onContextMenu: (e: React.MouseEvent, branch: Branch) => void
}): React.JSX.Element {
  const [expanded, setExpanded] = useState(true)
  const repoPath = useRepoStore((s) => s.repoPath)
  const hasChildren = node.children.size > 0

  const handleClick = async (): Promise<void> => {
    if (hasChildren) {
      setExpanded((e) => !e)
      return
    }
    if (node.branch && repoPath && !node.branch.isHead) {
      const result = await window.gitApi.checkout(repoPath, node.branch.name)
      if (!result.ok) window.alert(result.error.message)
      await invalidate(repoPath, ['log', 'branches', 'status'])
    }
  }

  return (
    <div>
      <div
        className={`flex cursor-pointer items-center gap-1 rounded px-1.5 py-1 text-[13px] hover:bg-ide-hover ${
          node.branch?.isHead ? 'font-semibold text-ide-accent' : 'text-ide-text'
        }`}
        style={{ paddingLeft: depth * 14 + 6 }}
        onClick={handleClick}
        onContextMenu={(e) => {
          e.preventDefault()
          if (node.branch) onContextMenu(e, node.branch)
        }}
      >
        {hasChildren && <span className="w-3 text-ide-textDim">{expanded ? '▾' : '▸'}</span>}
        {!hasChildren && <span className="w-3" />}
        <span className="truncate">{node.name}</span>
        {node.branch?.ahead ? (
          <span className="text-[11px] text-ide-green">↑{node.branch.ahead}</span>
        ) : null}
        {node.branch?.behind ? (
          <span className="text-[11px] text-ide-red">↓{node.branch.behind}</span>
        ) : null}
      </div>
      {hasChildren &&
        expanded &&
        Array.from(node.children.values())
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((child) => (
            <TreeNodeRow
              key={child.fullPath}
              node={child}
              depth={depth + 1}
              headBranch={headBranch}
              onContextMenu={onContextMenu}
            />
          ))}
    </div>
  )
}

function Section({
  title,
  branches,
  headBranch,
  onContextMenu
}: {
  title: string
  branches: Branch[]
  headBranch: string | null
  onContextMenu: (e: React.MouseEvent, branch: Branch) => void
}): React.JSX.Element {
  const [expanded, setExpanded] = useState(true)
  const tree = useMemo(() => buildTree(branches), [branches])

  return (
    <div className="mb-2">
      <div
        className="flex cursor-pointer items-center gap-1 px-2 py-1 text-[11px] font-semibold uppercase text-ide-textDim hover:text-ide-text"
        onClick={() => setExpanded((e) => !e)}
      >
        <span className="w-3">{expanded ? '▾' : '▸'}</span>
        {title}
      </div>
      {expanded &&
        Array.from(tree.children.values())
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((child) => (
            <TreeNodeRow
              key={child.fullPath}
              node={child}
              depth={1}
              headBranch={headBranch}
              onContextMenu={onContextMenu}
            />
          ))}
    </div>
  )
}

export function BranchTree(): React.JSX.Element {
  const branches = useBranchStore((s) => s.branches)
  const [menu, setMenu] = useState<{ x: number; y: number; branch: Branch } | null>(null)

  const local = branches.filter((b) => b.kind === 'local')
  const remote = branches.filter((b) => b.kind === 'remote')
  const tags = branches.filter((b) => b.kind === 'tag')
  const head = currentBranchName(branches)

  const openMenu = (e: React.MouseEvent, branch: Branch): void => {
    setMenu({ x: e.clientX, y: e.clientY, branch })
  }

  return (
    <div className="h-full overflow-auto py-2">
      <Section title="Local Branches" branches={local} headBranch={head} onContextMenu={openMenu} />
      <Section title="Remotes" branches={remote} headBranch={head} onContextMenu={openMenu} />
      <Section title="Tags" branches={tags} headBranch={head} onContextMenu={openMenu} />
      {menu && (
        <BranchContextMenu
          x={menu.x}
          y={menu.y}
          branch={menu.branch}
          currentBranchName={head}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  )
}
