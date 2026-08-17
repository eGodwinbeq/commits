import { create } from 'zustand'

type CenterTab = 'log' | 'changes'

interface UiState {
  activeTab: CenterTab
  setActiveTab: (tab: CenterTab) => void
  branchSwitcherOpen: boolean
  setBranchSwitcherOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  activeTab: 'log',
  setActiveTab: (tab) => set({ activeTab: tab }),
  branchSwitcherOpen: false,
  setBranchSwitcherOpen: (open) => set({ branchSwitcherOpen: open })
}))
