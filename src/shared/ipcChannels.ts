export const IpcChannels = {
  appPing: 'app:ping',

  repoOpenFolderDialog: 'repo:openFolderDialog',
  repoValidate: 'repo:validate',
  repoGetRecent: 'repo:getRecent',
  repoAddRecent: 'repo:addRecent',

  gitLog: 'git:log',
  gitBranches: 'git:branches',
  gitStatus: 'git:status',
  gitDiff: 'git:diff',
  gitShow: 'git:show',

  gitStageFile: 'git:stageFile',
  gitUnstageFile: 'git:unstageFile',
  gitDiscardChanges: 'git:discardChanges',
  gitCommit: 'git:commit',

  gitCheckout: 'git:checkout',
  gitCreateBranch: 'git:createBranch',
  gitRenameBranch: 'git:renameBranch',
  gitDeleteBranch: 'git:deleteBranch',
  gitMerge: 'git:merge',
  gitRebase: 'git:rebase',
  gitPush: 'git:push',
  gitPull: 'git:pull',
  gitFetch: 'git:fetch'
} as const

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels]
