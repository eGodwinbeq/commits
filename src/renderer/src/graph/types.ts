import type { Commit } from '@shared/types'

export type EdgeType = 'straight' | 'merge' | 'branch'

export interface GraphEdge {
  fromLane: number
  toLane: number
  type: EdgeType
}

export interface GraphRow {
  commit: Commit
  lane: number
  laneCount: number
  color: number
  edges: GraphEdge[]
  /** Lanes (other than `lane`) that have a pending commit continuing straight through this
   * row untouched - the only ones that should get a pass-through line drawn. */
  passThroughLanes: number[]
}
