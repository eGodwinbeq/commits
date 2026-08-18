import { useMemo, useState } from 'react'
import { useBranchStore, currentBranchName } from '../../store/branchStore'
import { useRepoStore } from '../../store/repoStore'
import { buildTree, type TreeNode } from './branchTreeUtils'
import { BranchContextMenu } from './BranchContextMenu'
import { invalidate } from '../../lib/invalidate'
import { IconBranch, IconChevron, IconClose, IconRemote, IconSearch, IconTag } from '../common/icons'
import type { Branch } from '@shared/types'

function TreeNodeRow({
  node,
  depth,
  selectedRef,
  onSelect,
  onContextMenu,
  forceExpanded
}: {
  node: TreeNode
  depth: number
  selectedRef: string | null
  onSelect: (refName: string) => void
  onContextMenu: (e: React.MouseEvent, branch: Branch) => void
  forceExpanded: boolean
}): React.JSX.Element {
  const [expanded, setExpanded] = useState(false)
  const isExpanded = expanded || forceExpanded
  const repoPath = useRepoStore((s) => s.repoPath)
  const hasChildren = node.children.size > 0
  const isHead = !!node.branch?.isHead
  const isSelected = !!node.branch && node.branch.refName === selectedRef

  const checkout = async (): Promise<void> => {
    if (!node.branch || !repoPath || node.branch.isHead) return
    if (node.branch.kind === 'tag') {
      const proceed = window.confirm(
        `Checking out tag "${node.branch.name}" leaves you in a detached HEAD state (tags aren't branches). Continue?`
      )
      if (!proceed) return
    }
    const result = await window.gitApi.checkout(repoPath, node.branch.name, node.branch.kind)
    if (!result.ok) window.alert(result.error.message)
    await invalidate(repoPath, ['log', 'branches', 'status'])
  }

  const handleClick = (): void => {
    if (hasChildren) {
      setExpanded((e) => !e)
      return
    }
    if (node.branch) onSelect(node.branch.refName)
  }

  return (
    <div>
      <div
        className={`group flex cursor-pointer items-center gap-1.5 rounded-md py-1 pr-2 text-[13px] transition-colors duration-100 ${
          isHead
            ? 'bg-ide-accent/15 font-medium text-ide-accent'
            : isSelected
              ? 'bg-ide-selected text-ide-text'
              : 'text-ide-text hover:bg-ide-hover'
        }`}
        style={{ paddingLeft: depth * 14 + 8 }}
        onClick={handleClick}
        onDoubleClick={() => !hasChildren && checkout()}
        onContextMenu={(e) => {
          e.preventDefault()
          if (node.branch) onContextMenu(e, node.branch)
        }}
      >
        {hasChildren ? (
          <IconChevron open={isExpanded} className="h-3 w-3 shrink-0 text-ide-textDim" />
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
        isExpanded &&
        Array.from(node.children.values())
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((child) => (
            <TreeNodeRow
              key={child.fullPath}
              node={child}
              depth={depth + 1}
              selectedRef={selectedRef}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              forceExpanded={forceExpanded}
            />
          ))}
    </div>
  )
}

function Section({
  title,
  icon: Icon,
  branches,
  selectedRef,
  onSelect,
  onContextMenu,
  forceExpanded
}: {
  title: string
  icon: typeof IconBranch
  branches: Branch[]
  selectedRef: string | null
  onSelect: (refName: string) => void
  onContextMenu: (e: React.MouseEvent, branch: Branch) => void
  forceExpanded: boolean
}): React.JSX.Element {
  const [expanded, setExpanded] = useState(false)
  const isExpanded = expanded || forceExpanded
  const tree = useMemo(() => buildTree(branches), [branches])

  if (branches.length === 0) return <></>

  return (
    <div className="mb-1 px-2">
      <div
        className="flex cursor-pointer items-center gap-1.5 rounded-md px-1 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ide-textDim hover:text-ide-text"
        onClick={() => setExpanded((e) => !e)}
      >
        <IconChevron open={isExpanded} className="h-3 w-3 shrink-0" />
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1">{title}</span>
        <span className="text-[10px] font-medium text-ide-textDim/70">{branches.length}</span>
      </div>
      {isExpanded &&
        Array.from(tree.children.values())
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((child) => (
            <TreeNodeRow
              key={child.fullPath}
              node={child}
              depth={1}
              selectedRef={selectedRef}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              forceExpanded={forceExpanded}
            />
          ))}
    </div>
  )
}

export function BranchTree(): React.JSX.Element {
  const branches = useBranchStore((s) => s.branches)
  const [menu, setMenu] = useState<{ x: number; y: number; branch: Branch } | null>(null)
  const [selectedRef, setSelectedRef] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const filtered = q ? branches.filter((b) => b.name.toLowerCase().includes(q)) : branches
  const local = filtered.filter((b) => b.kind === 'local')
  const remote = filtered.filter((b) => b.kind === 'remote')
  const tags = filtered.filter((b) => b.kind === 'tag')
  const head = currentBranchName(branches)

  const openMenu = (e: React.MouseEvent, branch: Branch): void => {
    setMenu({ x: e.clientX, y: e.clientY, branch })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-2 pt-2">
        <div className="flex items-center gap-1.5 rounded-md border border-ide-border bg-ide-bg px-2 py-1">
          <IconSearch className="h-3.5 w-3.5 shrink-0 text-ide-textDim" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search branches…"
            className="min-w-0 flex-1 bg-transparent text-[12px] text-ide-text outline-none placeholder:text-ide-textDim"
          />
          {query && (
            <button
              className="shrink-0 text-ide-textDim hover:text-ide-text"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <IconClose className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto py-2">
        <Section
          title="Local Branches"
          icon={IconBranch}
          branches={local}
          selectedRef={selectedRef}
          onSelect={setSelectedRef}
          onContextMenu={openMenu}
          forceExpanded={!!q}
        />
        <Section
          title="Remotes"
          icon={IconRemote}
          branches={remote}
          selectedRef={selectedRef}
          onSelect={setSelectedRef}
          onContextMenu={openMenu}
          forceExpanded={!!q}
        />
        <Section
          title="Tags"
          icon={IconTag}
          branches={tags}
          selectedRef={selectedRef}
          onSelect={setSelectedRef}
          onContextMenu={openMenu}
          forceExpanded={!!q}
        />
        {q && local.length === 0 && remote.length === 0 && tags.length === 0 && (
          <div className="px-3 py-4 text-center text-[12px] text-ide-textDim">
            No branches match &quot;{query}&quot;
          </div>
        )}
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
    </div>
  )
}
