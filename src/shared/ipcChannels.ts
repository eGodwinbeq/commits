export const IpcChannels = {
  appPing: 'app:ping',
  appSetTitleBarTheme: 'app:setTitleBarTheme',

  repoOpenFolderDialog: 'repo:openFolderDialog',
  repoValidate: 'repo:validate',
  repoGetRecent: 'repo:getRecent',
  repoAddRecent: 'repo:addRecent',
  repoTrustDirectory: 'repo:trustDirectory',

  gitLog: 'git:log',
  gitBranches: 'git:branches',
  gitStatus: 'git:status',
  gitDiff: 'git:diff',
  gitShow: 'git:show',

  gitStageFile: 'git:stageFile',
  gitUnstageFile: 'git:unstageFile',
  gitStagePaths: 'git:stagePaths',
  gitUnstagePaths: 'git:unstagePaths',
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
  gitFetch: 'git:fetch',

  prList: 'pr:list',
  prGet: 'pr:get',
  prDiff: 'pr:diff',
  prCreate: 'pr:create',
  prMerge: 'pr:merge',
  prClose: 'pr:close',

  aiGenerateCommitMessage: 'ai:generateCommitMessage',
  aiGetStatus: 'ai:getStatus',
  aiSetApiKey: 'ai:setApiKey',
  aiClearApiKey: 'ai:clearApiKey',
  aiTestClaudeCli: 'ai:testClaudeCli',
  aiLaunchClaudeSignIn: 'ai:launchClaudeSignIn'
} as const

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels]
