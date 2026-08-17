import { create } from 'zustand'

interface TaskState {
  activeTask: string | null
  setActiveTask: (label: string | null) => void
}

// Drives the background-task indicator in the status bar (e.g. "Pushing…") while a
// long-running git operation (push/pull/fetch) is in flight.
export const useTaskStore = create<TaskState>((set) => ({
  activeTask: null,
  setActiveTask: (label) => set({ activeTask: label })
}))
