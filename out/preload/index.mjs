import { webUtils, webFrame, ipcRenderer, contextBridge } from "electron";
const electronAPI = {
  ipcRenderer: {
    send(channel, ...args) {
      ipcRenderer.send(channel, ...args);
    },
    sendTo(webContentsId, channel, ...args) {
      const electronVer = process.versions.electron;
      const electronMajorVer = electronVer ? parseInt(electronVer.split(".")[0]) : 0;
      if (electronMajorVer >= 28) {
        throw new Error('"sendTo" method has been removed since Electron 28.');
      } else {
        ipcRenderer.sendTo(webContentsId, channel, ...args);
      }
    },
    sendSync(channel, ...args) {
      return ipcRenderer.sendSync(channel, ...args);
    },
    sendToHost(channel, ...args) {
      ipcRenderer.sendToHost(channel, ...args);
    },
    postMessage(channel, message, transfer) {
      ipcRenderer.postMessage(channel, message, transfer);
    },
    invoke(channel, ...args) {
      return ipcRenderer.invoke(channel, ...args);
    },
    on(channel, listener) {
      ipcRenderer.on(channel, listener);
      return () => {
        ipcRenderer.removeListener(channel, listener);
      };
    },
    once(channel, listener) {
      ipcRenderer.once(channel, listener);
      return () => {
        ipcRenderer.removeListener(channel, listener);
      };
    },
    removeListener(channel, listener) {
      ipcRenderer.removeListener(channel, listener);
      return this;
    },
    removeAllListeners(channel) {
      ipcRenderer.removeAllListeners(channel);
    }
  },
  webFrame: {
    insertCSS(css) {
      return webFrame.insertCSS(css);
    },
    setZoomFactor(factor) {
      if (typeof factor === "number" && factor > 0) {
        webFrame.setZoomFactor(factor);
      }
    },
    setZoomLevel(level) {
      if (typeof level === "number") {
        webFrame.setZoomLevel(level);
      }
    }
  },
  webUtils: {
    getPathForFile(file) {
      return webUtils.getPathForFile(file);
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
  repoOpenFolderDialog: "repo:openFolderDialog",
  repoValidate: "repo:validate",
  gitLog: "git:log",
  gitBranches: "git:branches",
  gitStatus: "git:status",
  gitDiff: "git:diff",
  gitShow: "git:show",
  gitStageFile: "git:stageFile",
  gitUnstageFile: "git:unstageFile",
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
  gitFetch: "git:fetch"
};
const gitApi = {
  ping: () => ipcRenderer.invoke(IpcChannels.appPing),
  openFolderDialog: () => ipcRenderer.invoke(IpcChannels.repoOpenFolderDialog),
  validateRepo: (path) => ipcRenderer.invoke(IpcChannels.repoValidate, path),
  getLog: (repoPath, opts) => ipcRenderer.invoke(IpcChannels.gitLog, repoPath, opts),
  getBranches: (repoPath) => ipcRenderer.invoke(IpcChannels.gitBranches, repoPath),
  getStatus: (repoPath) => ipcRenderer.invoke(IpcChannels.gitStatus, repoPath),
  getDiff: (repoPath, opts) => ipcRenderer.invoke(IpcChannels.gitDiff, repoPath, opts),
  getShow: (repoPath, sha) => ipcRenderer.invoke(IpcChannels.gitShow, repoPath, sha),
  stageFile: (repoPath, path) => ipcRenderer.invoke(IpcChannels.gitStageFile, repoPath, path),
  unstageFile: (repoPath, path) => ipcRenderer.invoke(IpcChannels.gitUnstageFile, repoPath, path),
  discardChanges: (repoPath, path) => ipcRenderer.invoke(IpcChannels.gitDiscardChanges, repoPath, path),
  commit: (repoPath, message, opts) => ipcRenderer.invoke(IpcChannels.gitCommit, repoPath, message, opts),
  checkout: (repoPath, ref) => ipcRenderer.invoke(IpcChannels.gitCheckout, repoPath, ref),
  createBranch: (repoPath, name, startPoint, doCheckout) => ipcRenderer.invoke(IpcChannels.gitCreateBranch, repoPath, name, startPoint, doCheckout),
  renameBranch: (repoPath, oldName, newName) => ipcRenderer.invoke(IpcChannels.gitRenameBranch, repoPath, oldName, newName),
  deleteBranch: (repoPath, name, force) => ipcRenderer.invoke(IpcChannels.gitDeleteBranch, repoPath, name, force),
  merge: (repoPath, sourceRef) => ipcRenderer.invoke(IpcChannels.gitMerge, repoPath, sourceRef),
  rebase: (repoPath, ontoRef) => ipcRenderer.invoke(IpcChannels.gitRebase, repoPath, ontoRef),
  push: (repoPath, opts) => ipcRenderer.invoke(IpcChannels.gitPush, repoPath, opts),
  pull: (repoPath, opts) => ipcRenderer.invoke(IpcChannels.gitPull, repoPath, opts),
  fetch: (repoPath, remote) => ipcRenderer.invoke(IpcChannels.gitFetch, repoPath, remote)
};
if (process.contextIsolated) {
  contextBridge.exposeInMainWorld("electron", electronAPI);
  contextBridge.exposeInMainWorld("gitApi", gitApi);
} else {
  window.electron = electronAPI;
  window.gitApi = gitApi;
}
