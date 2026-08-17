import type { Branch } from '@shared/types'

export interface TreeNode {
  name: string
  fullPath: string
  branch?: Branch
  children: Map<string, TreeNode>
}

export function buildTree(branches: Branch[]): TreeNode {
  const root: TreeNode = { name: '', fullPath: '', children: new Map() }
  for (const branch of branches) {
    const parts = branch.name.split('/')
    let node = root
    let pathSoFar = ''
    parts.forEach((part, i) => {
      pathSoFar = pathSoFar ? `${pathSoFar}/${part}` : part
      if (!node.children.has(part)) {
        node.children.set(part, { name: part, fullPath: pathSoFar, children: new Map() })
      }
      node = node.children.get(part)!
      if (i === parts.length - 1) node.branch = branch
    })
  }
  return root
}
