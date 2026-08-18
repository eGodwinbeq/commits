"use strict";
const electron = require("electron");
const electronAPI = {
  ipcRenderer: {
    send(channel, ...args) {
      electron.ipcRenderer.send(channel, ...args);
    },
    sendTo(webContentsId, channel, ...args) {
      const electronVer = process.versions.electron;
      const electronMajorVer = electronVer ? parseInt(electronVer.split(".")[0]) : 0;
      if (electronMajorVer >= 28) {
        throw new Error('"sendTo" method has been removed since Electron 28.');
      } else {
        electron.ipcRenderer.sendTo(webContentsId, channel, ...args);
      }
    },
    sendSync(channel, ...args) {
      return electron.ipcRenderer.sendSync(channel, ...args);
    },
    sendToHost(channel, ...args) {
      electron.ipcRenderer.sendToHost(channel, ...args);
    },
    postMessage(channel, message, transfer) {
      electron.ipcRenderer.postMessage(channel, message, transfer);
    },
    invoke(channel, ...args) {
      return electron.ipcRenderer.invoke(channel, ...args);
    },
    on(channel, listener) {
      electron.ipcRenderer.on(channel, listener);
      return () => {
        electron.ipcRenderer.removeListener(channel, listener);
      };
    },
    once(channel, listener) {
      electron.ipcRenderer.once(channel, listener);
      return () => {
        electron.ipcRenderer.removeListener(channel, listener);
      };
    },
    removeListener(channel, listener) {
      electron.ipcRenderer.removeListener(channel, listener);
      return this;
    },
    removeAllListeners(channel) {
      electron.ipcRenderer.removeAllListeners(channel);
    }
  },
  webFrame: {
    insertCSS(css) {
      return electron.webFrame.insertCSS(css);
    },
    setZoomFactor(factor) {
      if (typeof factor === "number" && factor > 0) {
        electron.webFrame.setZoomFactor(factor);
      }
    },
    setZoomLevel(level) {
      if (typeof level === "number") {
        electron.webFrame.setZoomLevel(level);
      }
    }
  },
  webUtils: {
    getPathForFile(file) {
      return electron.webUtils.getPathForFile(file);
    }
  },
  process: {
    get platform() {
      return process.platform;
    },
    get versions() {
      return process.versions;
    },
    get env() {
      return { ...process.env };
    }
  }
};
const IpcChannels = {
  appPing: "app:ping",
  appSetTitleBarTheme: "app:setTitleBarTheme",
  repoOpenFolderDialog: "repo:openFolderDialog",
  repoValidate: "repo:validate",
  repoTrustDirectory: "repo:trustDirectory",
  repoCommitCount: "repo:commitCount",
  gitLog: "git:log",
  gitBranches: "git:branches",
  gitStatus: "git:status",
  gitDiff: "git:diff",
  gitShow: "git:show",
  gitStageFile: "git:stageFile",
  gitUnstageFile: "git:unstageFile",
  gitStagePaths: "git:stagePaths",
  gitUnstagePaths: "git:unstagePaths",
  gitDiscardChanges: "git:discardChanges",
  gitCommit: "git:commit",
  gitCheckout: "git:checkout",
  gitCreateBranch: "git:createBranch",
  gitRenameBranch: "git:renameBranch",
  gitDeleteBranch: "git:deleteBranch",
  gitMerge: "git:merge",
  gitRebase: "git:rebase",
  gitPush: "git:push",
  gitPull: "git:pull",
  gitFetch: "git:fetch",
  prList: "pr:list",
  prGet: "pr:get",
  prDiff: "pr:diff",
  prCreate: "pr:create",
  prMerge: "pr:merge",
  prClose: "pr:close",
  ghStartDeviceAuth: "gh:startDeviceAuth",
  ghCancelDeviceAuth: "gh:cancelDeviceAuth",
  ghAuthEvent: "gh:authEvent",
  aiGenerateCommitMessage: "ai:generateCommitMessage",
  aiGetStatus: "ai:getStatus",
  aiSetApiKey: "ai:setApiKey",
  aiClearApiKey: "ai:clearApiKey",
  aiTestClaudeCli: "ai:testClaudeCli",
  aiLaunchClaudeSignIn: "ai:launchClaudeSignIn"
};
const gitApi = {
  ping: () => electron.ipcRenderer.invoke(IpcChannels.appPing),
  setTitleBarTheme: (theme) => electron.ipcRenderer.invoke(IpcChannels.appSetTitleBarTheme, theme),
  openFolderDialog: () => electron.ipcRenderer.invoke(IpcChannels.repoOpenFolderDialog),
  validateRepo: (path) => electron.ipcRenderer.invoke(IpcChannels.repoValidate, path),
  trustDirectory: (path) => electron.ipcRenderer.invoke(IpcChannels.repoTrustDirectory, path),
  getCommitCount: (path) => electron.ipcRenderer.invoke(IpcChannels.repoCommitCount, path),
  getLog: (repoPath, opts) => electron.ipcRenderer.invoke(IpcChannels.gitLog, repoPath, opts),
  getBranches: (repoPath) => electron.ipcRenderer.invoke(IpcChannels.gitBranches, repoPath),
  getStatus: (repoPath) => electron.ipcRenderer.invoke(IpcChannels.gitStatus, repoPath),
  getDiff: (repoPath, opts) => electron.ipcRenderer.invoke(IpcChannels.gitDiff, repoPath, opts),
  getShow: (repoPath, sha) => electron.ipcRenderer.invoke(IpcChannels.gitShow, repoPath, sha),
  stageFile: (repoPath, path) => electron.ipcRenderer.invoke(IpcChannels.gitStageFile, repoPath, path),
  unstageFile: (repoPath, path) => electron.ipcRenderer.invoke(IpcChannels.gitUnstageFile, repoPath, path),
  stagePaths: (repoPath, paths) => electron.ipcRenderer.invoke(IpcChannels.gitStagePaths, repoPath, paths),
  unstagePaths: (repoPath, paths) => electron.ipcRenderer.invoke(IpcChannels.gitUnstagePaths, repoPath, paths),
  discardChanges: (repoPath, path) => electron.ipcRenderer.invoke(IpcChannels.gitDiscardChanges, repoPath, path),
  commit: (repoPath, message, opts) => electron.ipcRenderer.invoke(IpcChannels.gitCommit, repoPath, message, opts),
  checkout: (repoPath, ref, kind) => electron.ipcRenderer.invoke(IpcChannels.gitCheckout, repoPath, ref, kind),
  createBranch: (repoPath, name, startPoint, doCheckout) => electron.ipcRenderer.invoke(IpcChannels.gitCreateBranch, repoPath, name, startPoint, doCheckout),
  renameBranch: (repoPath, oldName, newName) => electron.ipcRenderer.invoke(IpcChannels.gitRenameBranch, repoPath, oldName, newName),
  deleteBranch: (repoPath, name, force) => electron.ipcRenderer.invoke(IpcChannels.gitDeleteBranch, repoPath, name, force),
  merge: (repoPath, sourceRef) => electron.ipcRenderer.invoke(IpcChannels.gitMerge, repoPath, sourceRef),
  rebase: (repoPath, ontoRef) => electron.ipcRenderer.invoke(IpcChannels.gitRebase, repoPath, ontoRef),
  push: (repoPath, opts) => electron.ipcRenderer.invoke(IpcChannels.gitPush, repoPath, opts),
  pull: (repoPath, opts) => electron.ipcRenderer.invoke(IpcChannels.gitPull, repoPath, opts),
  fetch: (repoPath, remote) => electron.ipcRenderer.invoke(IpcChannels.gitFetch, repoPath, remote),
  listPullRequests: (repoPath, state) => electron.ipcRenderer.invoke(IpcChannels.prList, repoPath, state),
  getPullRequest: (repoPath, number) => electron.ipcRenderer.invoke(IpcChannels.prGet, repoPath, number),
  getPullRequestDiff: (repoPath, number) => electron.ipcRenderer.invoke(IpcChannels.prDiff, repoPath, number),
  createPullRequest: (repoPath, opts) => electron.ipcRenderer.invoke(IpcChannels.prCreate, repoPath, opts),
  mergePullRequest: (repoPath, number, opts) => electron.ipcRenderer.invoke(IpcChannels.prMerge, repoPath, number, opts),
  closePullRequest: (repoPath, number) => electron.ipcRenderer.invoke(IpcChannels.prClose, repoPath, number),
  generateCommitMessage: (repoPath) => electron.ipcRenderer.invoke(IpcChannels.aiGenerateCommitMessage, repoPath),
  getAiStatus: () => electron.ipcRenderer.invoke(IpcChannels.aiGetStatus),
  setAiApiKey: (key) => electron.ipcRenderer.invoke(IpcChannels.aiSetApiKey, key),
  clearAiApiKey: () => electron.ipcRenderer.invoke(IpcChannels.aiClearApiKey),
  testClaudeCli: () => electron.ipcRenderer.invoke(IpcChannels.aiTestClaudeCli),
  launchClaudeSignIn: () => electron.ipcRenderer.invoke(IpcChannels.aiLaunchClaudeSignIn),
  startGithubDeviceAuth: () => electron.ipcRenderer.invoke(IpcChannels.ghStartDeviceAuth),
  cancelGithubDeviceAuth: () => electron.ipcRenderer.invoke(IpcChannels.ghCancelDeviceAuth),
  onGithubAuthEvent: (callback) => {
    const listener = (_evt, data) => callback(data);
    electron.ipcRenderer.on(IpcChannels.ghAuthEvent, listener);
    return () => electron.ipcRenderer.removeListener(IpcChannels.ghAuthEvent, listener);
  }
};
if (process.contextIsolated) {
  electron.contextBridge.exposeInMainWorld("electron", electronAPI);
  electron.contextBridge.exposeInMainWorld("gitApi", gitApi);
} else {
  window.electron = electronAPI;
  window.gitApi = gitApi;
}
