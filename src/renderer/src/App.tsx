import { useEffect } from 'react'
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

function RepoWorkspace(): React.JSX.Element {
  const repoPath = useRepoStore((s) => s.repoPath)
  const loadLog = useLogStore((s) => s.load)
  const loadBranches = useBranchStore((s) => s.load)
  const loadStatus = useStatusStore((s) => s.load)
  const activeTab = useUiStore((s) => s.activeTab)

  useEffect(() => {
    if (!repoPath) return
    loadLog(repoPath)
    loadBranches(repoPath)
    loadStatus(repoPath)
  }, [repoPath])

  return (
    <div className="flex h-screen flex-col">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <div className="flex w-64 shrink-0 flex-col border-r border-ide-border bg-ide-panelAlt">
          <SideNav />
          <div className="min-h-0 flex-1 overflow-auto">
            <BranchTree />
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1">
            <div className="min-w-0 flex-1 border-r border-ide-border">
              {activeTab === 'log' ? <CommitLogTable /> : <ChangesPanel />}
            </div>
            <div className="w-[45%] min-w-[320px]">
              <DiffViewer />
            </div>
          </div>
        </div>
      </div>
      <StatusBar />
      <BranchSwitcherPopup />
    </div>
  )
}

export default function App(): React.JSX.Element {
  const repoPath = useRepoStore((s) => s.repoPath)
  return repoPath ? <RepoWorkspace /> : <WelcomeScreen />
}
