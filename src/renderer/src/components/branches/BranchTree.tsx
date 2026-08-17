import { useMemo, useState } from 'react'
import { useBranchStore, currentBranchName } from '../../store/branchStore'
import { useRepoStore } from '../../store/repoStore'
import { buildTree, type TreeNode } from './branchTreeUtils'
import { BranchContextMenu } from './BranchContextMenu'
import { invalidate } from '../../lib/invalidate'
import { IconBranch, IconChevron, IconRemote, IconTag } from '../common/icons'
import type { Branch } from '@shared/types'

function TreeNodeRow({
  node,
  depth,
  onContextMenu
}: {
  node: TreeNode
  depth: number
  onContextMenu: (e: React.MouseEvent, branch: Branch) => void
}): React.JSX.Element {
  const [expanded, setExpanded] = useState(true)
  const repoPath = useRepoStore((s) => s.repoPath)
  const hasChildren = node.children.size > 0
  const isHead = !!node.branch?.isHead

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
        className={`group flex cursor-pointer items-center gap-1.5 rounded-md py-1 pr-2 text-[13px] transition-colors duration-100 ${
          isHead ? 'bg-ide-accent/15 font-medium text-ide-accent' : 'text-ide-text hover:bg-ide-hover'
        }`}
        style={{ paddingLeft: depth * 14 + 8 }}
        onClick={handleClick}
        onContextMenu={(e) => {
          e.preventDefault()
          if (node.branch) onContextMenu(e, node.branch)
        }}
      >
        {hasChildren ? (
          <IconChevron open={expanded} className="h-3 w-3 shrink-0 text-ide-textDim" />
        ) : (
          <span className="w-3 shrink-0" />
        )}
        {!hasChildren && node.branch && (
          <IconBranch
            className={`h-3.5 w-3.5 shrink-0 ${isHead ? 'text-ide-accent' : 'text-ide-textDim'}`}
          />
        )}
        <span className="truncate">{node.name}</span>
        {isHead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ide-accent" />}
        {node.branch?.ahead ? (
          <span className="ml-auto shrink-0 text-[11px] font-medium text-ide-green">
            ↑{node.branch.ahead}
          </span>
        ) : null}
        {node.branch?.behind ? (
          <span className="shrink-0 text-[11px] font-medium text-ide-red">↓{node.branch.behind}</span>
        ) : null}
      </div>
      {hasChildren &&
        expanded &&
        Array.from(node.children.values())
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((child) => (
            <TreeNodeRow key={child.fullPath} node={child} depth={depth + 1} onContextMenu={onContextMenu} />
          ))}
    </div>
  )
}

function Section({
  title,
  icon: Icon,
  branches,
  onContextMenu
}: {
  title: string
  icon: typeof IconBranch
  branches: Branch[]
  onContextMenu: (e: React.MouseEvent, branch: Branch) => void
}): React.JSX.Element {
  const [expanded, setExpanded] = useState(true)
  const tree = useMemo(() => buildTree(branches), [branches])

  if (branches.length === 0) return <></>

  return (
    <div className="mb-1 px-2">
      <div
        className="flex cursor-pointer items-center gap-1.5 rounded-md px-1 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ide-textDim hover:text-ide-text"
        onClick={() => setExpanded((e) => !e)}
      >
        <IconChevron open={expanded} className="h-3 w-3 shrink-0" />
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1">{title}</span>
        <span className="text-[10px] font-medium text-ide-textDim/70">{branches.length}</span>
      </div>
      {expanded &&
        Array.from(tree.children.values())
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((child) => <TreeNodeRow key={child.fullPath} node={child} depth={1} onContextMenu={onContextMenu} />)}
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
      <Section title="Local Branches" icon={IconBranch} branches={local} onContextMenu={openMenu} />
      <Section title="Remotes" icon={IconRemote} branches={remote} onContextMenu={openMenu} />
      <Section title="Tags" icon={IconTag} branches={tags} onContextMenu={openMenu} />
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
