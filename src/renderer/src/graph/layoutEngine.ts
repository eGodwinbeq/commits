import type { Commit } from '@shared/types'
import type { GraphEdge, GraphRow } from './types'

/**
 * Assigns each commit to a lane (column) for graph rendering, mirroring the
 * approach `git log --graph` uses internally: a single top-to-bottom pass
 * over commits in the order git emits them (parents after children), tracking
 * which lane each "expected" commit occupies.
 */
export function computeGraphLayout(commits: Commit[]): GraphRow[] {
  const activeLanes: (string | null)[] = []
  const laneColor = new Map<number, number>()
  let nextColor = 0

  const findLane = (sha: string): number => activeLanes.indexOf(sha)

  const allocateLane = (): number => {
    const freeIdx = activeLanes.indexOf(null)
    if (freeIdx !== -1) return freeIdx
    activeLanes.push(null)
    return activeLanes.length - 1
  }

  const rows: GraphRow[] = []

  for (const commit of commits) {
    let lane = findLane(commit.sha)
    if (lane === -1) {
      lane = allocateLane()
      laneColor.set(lane, nextColor++ % 12)
    }
    if (!laneColor.has(lane)) laneColor.set(lane, nextColor++ % 12)

    const edges: GraphEdge[] = []
    const [firstParent, ...restParents] = commit.parents

    if (firstParent) {
      const existingLane = findLane(firstParent)
      if (existingLane !== -1 && existingLane !== lane) {
        // first parent already tracked in another lane (criss-cross merge target) - just
        // connect to it, don't move this lane's occupant.
        edges.push({ fromLane: lane, toLane: existingLane, type: 'merge' })
      } else {
        activeLanes[lane] = firstParent
        edges.push({ fromLane: lane, toLane: lane, type: 'straight' })
      }
    } else {
      activeLanes[lane] = null
    }

    for (const parent of restParents) {
      let parentLane = findLane(parent)
      if (parentLane === -1) {
        parentLane = allocateLane()
        activeLanes[parentLane] = parent
        laneColor.set(parentLane, nextColor++ % 12)
      }
      edges.push({ fromLane: lane, toLane: parentLane, type: 'merge' })
    }

    // free lanes that no longer have any pending occupant referenced elsewhere
    // (occupant sha appears exactly once in activeLanes and nothing points to it anymore
    // is handled implicitly: a lane stays occupied until its sha is reached as a row)

    rows.push({
      commit,
      lane,
      laneCount: activeLanes.length,
      color: laneColor.get(lane) ?? 0,
      edges
    })
  }

  const maxLaneCount = rows.reduce((max, r) => Math.max(max, r.laneCount), 0)
  return rows.map((r) => ({ ...r, laneCount: maxLaneCount }))
}
