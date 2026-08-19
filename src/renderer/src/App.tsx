import { useEffect, useState } from 'react'
import { useRepoStore } from './store/repoStore'
import { useLogStore } from './store/logStore'
import { useBranchStore } from './store/branchStore'
import { useStatusStore } from './store/statusStore'
import { useUiStore } from './store/uiStore'
import { WelcomeScreen } from './components/layout/WelcomeScreen'
import { TopBar } from './components/layout/TopBar'
import { StatusBar } from './components/layout/StatusBar'
import { BranchTree } from './components/branches/BranchTree'
import { SideNav } from './components/layout/SideNav'
import { BranchSwitcherPopup } from './components/branches/BranchSwitcherPopup'
import { CommitLogTable } from './components/log/CommitLogTable'
import { ChangesPanel } from './components/changes/ChangesPanel'
import { DiffViewer } from './components/diff/DiffViewer'
import { ActivityView } from './components/activity/ActivityView'
import { PullRequestsPanel } from './components/prs/PullRequestsPanel'
import { useAutoRefresh } from './lib/useAutoRefresh'
import { ResizeHandle } from './components/common/ResizeHandle'

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

function RepoWorkspace(): React.JSX.Element {
  const repoPath = useRepoStore((s) => s.repoPath)
  const loadLog = useLogStore((s) => s.load)
  const loadBranches = useBranchStore((s) => s.load)
  const loadStatus = useStatusStore((s) => s.load)
  const activeTab = useUiStore((s) => s.activeTab)

  const [sidebarWidth, setSidebarWidth] = useState(256)
  const [diffWidth, setDiffWidth] = useState(460)

  useEffect(() => {
    if (!repoPath) return
    // Branches must resolve first: the log's default "current branch" filter reads HEAD
    // from the branch store, so loading it after (or in parallel with) the log would race.
    loadBranches(repoPath).then(() => {
      loadLog(repoPath)
      loadStatus(repoPath)
    })
  }, [repoPath])

  useAutoRefresh(repoPath)

  return (
    <div className="flex h-full flex-col gap-2 bg-ide-bg p-2">
      <div className="shrink-0 overflow-hidden rounded-lg border border-ide-border">
        <TopBar />
      </div>
      <div className="flex min-h-0 flex-1 items-stretch gap-1.5">
        <div
          className="flex shrink-0 flex-col overflow-hidden rounded-lg border border-ide-border bg-ide-panelAlt"
          style={{ width: sidebarWidth }}
        >
          <SideNav />
          <div className="min-h-0 flex-1 overflow-auto">
            <BranchTree />
          </div>
        </div>

        <ResizeHandle onResize={(dx) => setSidebarWidth((w) => clamp(w + dx, 180, 480))} />

        <div className="min-w-0 flex-1 overflow-hidden rounded-lg border border-ide-border bg-ide-panel">
          {activeTab === 'log' && <CommitLogTable />}
          {activeTab === 'changes' && <ChangesPanel />}
          {activeTab === 'activity' && <ActivityView />}
          {activeTab === 'pullRequests' && <PullRequestsPanel />}
        </div>

        {activeTab !== 'activity' && activeTab !== 'pullRequests' && (
          <>
            <ResizeHandle onResize={(dx) => setDiffWidth((w) => clamp(w - dx, 280, 900))} />

            <div
              className="shrink-0 overflow-hidden rounded-lg border border-ide-border bg-ide-panel"
              style={{ width: diffWidth }}
            >
              <DiffViewer />
            </div>
          </>
        )}
      </div>
      <div className="shrink-0 overflow-hidden rounded-lg border border-ide-border">
        <StatusBar />
      </div>
      <BranchSwitcherPopup />
    </div>
  )
}

// Electron's `titleBarStyle: 'hidden'` removes the native drag behavior from the window,
// so the page must expose its own drag region matching the titleBarOverlay height (see
// src/main/window.ts) or the window becomes undraggable.
const dragRegionStyle = { WebkitAppRegion: 'drag' } as React.CSSProperties

export default function App(): React.JSX.Element {
  const repoPath = useRepoStore((s) => s.repoPath)
  const repoName = useRepoStore((s) => s.repoName)

  useEffect(() => {
    document.title = repoName ? `${repoName} — Commits` : 'Commits'
  }, [repoName])

  return (
    <div className="flex h-screen flex-col">
      <div className="h-10 shrink-0" style={dragRegionStyle} />
      <div className="min-h-0 flex-1">{repoPath ? <RepoWorkspace /> : <WelcomeScreen />}</div>
    </div>
  )
}
