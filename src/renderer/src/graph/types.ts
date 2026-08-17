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
}
