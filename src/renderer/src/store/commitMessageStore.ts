import { create } from 'zustand'

interface CommitMessageState {
  message: string
  setMessage: (message: string) => void
  clear: () => void
}

// Kept in a store (rather than local component state) so the draft survives switching
// away from the Changes tab and back - only cleared explicitly after a successful commit.
export const useCommitMessageStore = create<CommitMessageState>((set) => ({
  message: '',
  setMessage: (message) => set({ message }),
  clear: () => set({ message: '' })
}))
