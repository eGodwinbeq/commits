import { app, session, ipcMain, BrowserWindow, shell, dialog } from "electron";
import { join, basename } from "path";
import { spawn } from "child_process";
import { homedir } from "os";
import __cjs_mod__ from "node:module";
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const require2 = __cjs_mod__.createRequire(import.meta.url);
const is = {
  dev: !app.isPackaged
};
const platform = {
  isWindows: process.platform === "win32",
  isMacOS: process.platform === "darwin",
  isLinux: process.platform === "linux"
};
const electronApp = {
  setAppUserModelId(id) {
    if (platform.isWindows)
      app.setAppUserModelId(is.dev ? process.execPath : id);
  },
  setAutoLaunch(auto) {
    if (platform.isLinux)
      return false;
    const isOpenAtLogin = () => {
      return app.getLoginItemSettings().openAtLogin;
    };
    if (isOpenAtLogin() !== auto) {
      app.setLoginItemSettings({ openAtLogin: auto });
      return isOpenAtLogin() === auto;
    } else {
      return true;
    }
  },
  skipProxy() {
    return session.defaultSession.setProxy({ mode: "direct" });
  }
};
const optimizer = {
  watchWindowShortcuts(window, shortcutOptions) {
    if (!window)
      return;
    const { webContents } = window;
    const { escToCloseWindow = false, zoom = false } = shortcutOptions || {};
    webContents.on("before-input-event", (event, input) => {
      if (input.type === "keyDown") {
        if (!is.dev) {
          if (input.code === "KeyR" && (input.control || input.meta))
            event.preventDefault();
          if (input.code === "KeyI" && (input.alt && input.meta || input.control && input.shift)) {
            event.preventDefault();
          }
        } else {
          if (input.code === "F12") {
            if (webContents.isDevToolsOpened()) {
              webContents.closeDevTools();
            } else {
              webContents.openDevTools({ mode: "undocked" });
              console.log("Open dev tool...");
            }
          }
        }
        if (escToCloseWindow) {
          if (input.code === "Escape" && input.key !== "Process") {
            window.close();
            event.preventDefault();
          }
        }
        if (!zoom) {
          if (input.code === "Minus" && (input.control || input.meta))
            event.preventDefault();
          if (input.code === "Equal" && input.shift && (input.control || input.meta))
            event.preventDefault();
        }
      }
    });
  },
  registerFramelessWindowIpc() {
    ipcMain.on("win:invoke", (event, action) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) {
        if (action === "show") {
          win.show();
        } else if (action === "showInactive") {
          win.showInactive();
        } else if (action === "min") {
          win.minimize();
        } else if (action === "max") {
          const isMaximized = win.isMaximized();
          if (isMaximized) {
            win.unmaximize();
          } else {
            win.maximize();
          }
        } else if (action === "close") {
          win.close();
        }
      }
    });
  }
};
function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#1e1f22",
    // Windows/Linux draw the native title bar at a fixed ~32px height. Using 'hidden' +
    // titleBarOverlay keeps the native min/max/close buttons but lets us pick the height
    // of the strip they sit in, so it can be taller than the OS default.
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#1e1f22",
      symbolColor: "#dfe1e5",
      height: 40
    },
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
  return mainWindow;
}
const IpcChannels = {
  appPing: "app:ping",
  appSetTitleBarTheme: "app:setTitleBarTheme",
  repoOpenFolderDialog: "repo:openFolderDialog",
  repoValidate: "repo:validate",
  repoTrustDirectory: "repo:trustDirectory",
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
  aiGenerateCommitMessage: "ai:generateCommitMessage"
};
const OVERLAY_COLORS = {
  dark: { color: "#1e1f22", symbolColor: "#dfe1e5" },
  light: { color: "#f2f2f2", symbolColor: "#1e1e1e" }
};
function registerAppHandlers() {
  ipcMain.handle(IpcChannels.appSetTitleBarTheme, (evt, theme) => {
    const win = BrowserWindow.fromWebContents(evt.sender);
    try {
      win?.setTitleBarOverlay({ ...OVERLAY_COLORS[theme], height: 40 });
    } catch {
    }
  });
}
class GitCommandError extends Error {
  code;
  stderr;
  constructor(message, code, stderr) {
    super(message);
    this.code = code;
    this.stderr = stderr;
  }
}
const DEFAULT_TIMEOUT_MS = 3e4;
const NETWORK_TIMEOUT_MS = 12e4;
const NETWORK_SUBCOMMANDS = /* @__PURE__ */ new Set(["push", "pull", "fetch", "clone"]);
function execGit(repoPath, args, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? (NETWORK_SUBCOMMANDS.has(args[0]) ? NETWORK_TIMEOUT_MS : DEFAULT_TIMEOUT_MS);
  return new Promise((resolve, reject) => {
    const child = spawn("git", args, {
      cwd: repoPath,
      windowsHide: true,
      env: { ...process.env, GIT_PAGER: "cat", GIT_TERMINAL_PROMPT: "0" }
    });
    const stdoutChunks = [];
    const stderrChunks = [];
    const timer = setTimeout(() => {
      child.kill();
      reject(new GitCommandError(`git ${args[0]} timed out after ${timeoutMs}ms`, "TIMEOUT", ""));
    }, timeoutMs);
    child.stdout.on("data", (chunk) => stdoutChunks.push(chunk));
    child.stderr.on("data", (chunk) => stderrChunks.push(chunk));
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(new GitCommandError(err.message, "SPAWN_ERROR", ""));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        stdout: Buffer.concat(stdoutChunks),
        stderr: Buffer.concat(stderrChunks).toString("utf-8"),
        code
      });
    });
  });
}
const DUBIOUS_OWNERSHIP_RE = /detected dubious ownership in repository at '([^']+)'/i;
async function validateRepo(path) {
  const result = await execGit(path, ["rev-parse", "--show-toplevel"]);
  if (result.code !== 0) {
    const dubious = result.stderr.match(DUBIOUS_OWNERSHIP_RE);
    if (dubious) {
      return {
        ok: false,
        error: {
          code: "UNSAFE_REPO",
          message: "Git flagged this repository as unsafe because it is owned by a different user account.",
          stderr: result.stderr,
          path: dubious[1]
        }
      };
    }
    return {
      ok: false,
      error: {
        code: "NOT_A_REPO",
        message: "The selected folder is not a git repository.",
        stderr: result.stderr
      }
    };
  }
  const root = result.stdout.toString("utf-8").trim().replace(/\//g, "\\");
  return { ok: true, data: { path: root, name: basename(root) } };
}
async function trustDirectory(path) {
  const result = await execGit(homedir(), ["config", "--global", "--add", "safe.directory", path]);
  if (result.code !== 0) {
    return {
      ok: false,
      error: {
        code: "GIT_ERROR",
        message: "Failed to mark this directory as safe.",
        stderr: result.stderr
      }
    };
  }
  return { ok: true, data: void 0 };
}
function registerRepoHandlers() {
  ipcMain.handle(IpcChannels.repoOpenFolderDialog, async (evt) => {
    const win = BrowserWindow.fromWebContents(evt.sender);
    const res = win ? await dialog.showOpenDialog(win, { properties: ["openDirectory"] }) : await dialog.showOpenDialog({ properties: ["openDirectory"] });
    if (res.canceled || res.filePaths.length === 0) return null;
    return res.filePaths[0];
  });
  ipcMain.handle(IpcChannels.repoValidate, async (_evt, path) => {
    return validateRepo(path);
  });
  ipcMain.handle(IpcChannels.repoTrustDirectory, async (_evt, path) => {
    return trustDirectory(path);
  });
}
const FORMAT_FIELD_SEP = "%x00";
const FORMAT_RECORD_SEP = "%x1e";
const OUT_FIELD_SEP = "\0";
const OUT_RECORD_SEP = "";
const LOG_FORMAT = ["%H", "%P", "%an", "%ae", "%ad", "%s", "%D"].join(FORMAT_FIELD_SEP) + FORMAT_RECORD_SEP;
function parseRefs(refString) {
  if (!refString) return [];
  return refString.split(", ").map((raw) => raw.trim()).filter(Boolean).map((raw) => {
    if (raw === "HEAD" || raw.startsWith("HEAD ->")) {
      const name = raw.startsWith("HEAD ->") ? raw.replace("HEAD -> ", "") : "HEAD";
      return { name, type: raw === "HEAD" ? "head" : "local-branch" };
    }
    if (raw.startsWith("tag: ")) {
      return { name: raw.replace("tag: ", ""), type: "tag" };
    }
    if (raw.includes("/")) {
      return { name: raw, type: "remote-branch" };
    }
    return { name: raw, type: "local-branch" };
  });
}
async function getLog(repoPath, opts = {}) {
  const maxCount = opts.maxCount ?? 500;
  const args = [
    "log",
    opts.branch ?? "--all",
    "--parents",
    "--date=iso-strict",
    `--format=${LOG_FORMAT}`,
    `-n${maxCount}`
  ];
  if (opts.skip) args.push(`--skip=${opts.skip}`);
  const result = await execGit(repoPath, args);
  if (result.code !== 0) {
    throw new Error(`git log failed: ${result.stderr}`);
  }
  const text = result.stdout.toString("utf-8");
  const records = text.split(OUT_RECORD_SEP).filter((r) => r.trim().length > 0);
  return records.map((record) => {
    const fields = record.replace(/^\n/, "").split(OUT_FIELD_SEP);
    const [sha, parents, authorName, authorEmail, date, subject, refs] = fields;
    return {
      sha,
      parents: parents ? parents.split(" ").filter(Boolean) : [],
      authorName,
      authorEmail,
      date,
      subject,
      refs: parseRefs(refs ?? "")
    };
  });
}
const FIELD_SEP = "";
function parseTrack(track) {
  const aheadMatch = track.match(/ahead (\d+)/);
  const behindMatch = track.match(/behind (\d+)/);
  return {
    ahead: aheadMatch ? parseInt(aheadMatch[1], 10) : 0,
    behind: behindMatch ? parseInt(behindMatch[1], 10) : 0
  };
}
async function getBranches(repoPath) {
  const format = ["%(refname)", "%(objectname)", "%(upstream)", "%(upstream:track)", "%(HEAD)"].join(
    FIELD_SEP
  );
  const result = await execGit(repoPath, [
    "for-each-ref",
    `--format=${format}`,
    "refs/heads",
    "refs/remotes",
    "refs/tags"
  ]);
  if (result.code !== 0) {
    throw new Error(`git for-each-ref failed: ${result.stderr}`);
  }
  const text = result.stdout.toString("utf-8");
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  return lines.map((line) => {
    const [refname, sha, upstream, track, head] = line.split(FIELD_SEP);
    const isHead = head === "*";
    let kind = "local";
    let name = refname;
    let remote;
    if (refname.startsWith("refs/heads/")) {
      kind = "local";
      name = refname.replace("refs/heads/", "");
    } else if (refname.startsWith("refs/remotes/")) {
      kind = "remote";
      name = refname.replace("refs/remotes/", "");
      remote = name.split("/")[0];
    } else if (refname.startsWith("refs/tags/")) {
      kind = "tag";
      name = refname.replace("refs/tags/", "");
    }
    const { ahead, behind } = parseTrack(track ?? "");
    return {
      refName: refname,
      name,
      sha,
      isHead,
      kind,
      remote,
      upstream: upstream || void 0,
      ahead,
      behind
    };
  });
}
function xyToStatus(x, y) {
  const map = {
    M: "modified",
    A: "added",
    D: "deleted",
    R: "renamed",
    C: "copied"
  };
  return {
    staged: x !== "." && map[x] ? map[x] : void 0,
    unstaged: y !== "." && map[y] ? map[y] : void 0
  };
}
async function getStatus(repoPath) {
  const result = await execGit(repoPath, ["status", "--porcelain=v2", "--branch", "-z"]);
  if (result.code !== 0) {
    throw new Error(`git status failed: ${result.stderr}`);
  }
  const text = result.stdout.toString("utf-8");
  const records = text.split("\0").filter((r) => r.length > 0);
  const status = {
    branch: null,
    upstream: null,
    ahead: 0,
    behind: 0,
    staged: [],
    unstaged: [],
    untracked: [],
    conflicted: []
  };
  let i = 0;
  while (i < records.length) {
    const record = records[i];
    if (record.startsWith("# branch.head ")) {
      status.branch = record.replace("# branch.head ", "").trim();
    } else if (record.startsWith("# branch.upstream ")) {
      status.upstream = record.replace("# branch.upstream ", "").trim();
    } else if (record.startsWith("# branch.ab ")) {
      const m = record.match(/\+(\d+) -(\d+)/);
      if (m) {
        status.ahead = parseInt(m[1], 10);
        status.behind = parseInt(m[2], 10);
      }
    } else if (record.startsWith("1 ")) {
      const parts = record.split(" ");
      const xy = parts[1];
      const path = parts.slice(8).join(" ");
      const { staged, unstaged } = xyToStatus(xy[0], xy[1]);
      if (staged) status.staged.push({ path, status: staged });
      if (unstaged) status.unstaged.push({ path, status: unstaged });
    } else if (record.startsWith("2 ")) {
      const parts = record.split(" ");
      const xy = parts[1];
      const path = parts.slice(9).join(" ");
      i++;
      const origPath = records[i] ?? "";
      const { staged, unstaged } = xyToStatus(xy[0], xy[1]);
      if (staged) status.staged.push({ path, origPath, status: "renamed" });
      if (unstaged) status.unstaged.push({ path, origPath, status: unstaged ?? "renamed" });
    } else if (record.startsWith("u ")) {
      const parts = record.split(" ");
      const path = parts.slice(10).join(" ");
      status.conflicted.push({ path, status: "conflicted" });
    } else if (record.startsWith("? ")) {
      const path = record.slice(2);
      status.untracked.push({ path, status: "untracked" });
    }
    i++;
  }
  return status;
}
function parseUnifiedDiff(text) {
  const files = [];
  const fileBlocks = text.split(/^diff --git /m).filter((b) => b.trim().length > 0);
  for (const block of fileBlocks) {
    const lines = block.split("\n");
    const headerLine = lines[0];
    const pathMatch = headerLine.match(/a\/(.+?) b\/(.+)$/);
    let path = pathMatch ? pathMatch[2] : headerLine.trim();
    let origPath = pathMatch ? pathMatch[1] : void 0;
    const isBinary = block.includes("Binary files ");
    let isRename = false;
    let isNew = false;
    let isDeleted = false;
    const hunks = [];
    let currentHunk = null;
    let oldLineNo = 0;
    let newLineNo = 0;
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith("rename from ")) isRename = true;
      else if (line.startsWith("new file mode")) isNew = true;
      else if (line.startsWith("deleted file mode")) isDeleted = true;
      else if (line.startsWith("rename to ")) {
        path = line.replace("rename to ", "").trim();
      } else if (line.startsWith("+++ ")) {
        const m = line.match(/\+\+\+ b\/(.+)$/);
        if (m) path = m[1];
      } else if (line.startsWith("--- ")) {
        const m = line.match(/--- a\/(.+)$/);
        if (m) origPath = m[1];
      } else if (line.startsWith("@@")) {
        const hunkMatch = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
        oldLineNo = hunkMatch ? parseInt(hunkMatch[1], 10) : 0;
        newLineNo = hunkMatch ? parseInt(hunkMatch[2], 10) : 0;
        currentHunk = { header: line, lines: [] };
        hunks.push(currentHunk);
      } else if (currentHunk) {
        if (line.startsWith("+")) {
          currentHunk.lines.push({ type: "add", text: line.slice(1), newLineNo: newLineNo++ });
        } else if (line.startsWith("-")) {
          currentHunk.lines.push({ type: "del", text: line.slice(1), oldLineNo: oldLineNo++ });
        } else if (line.startsWith(" ") || line === "") {
          currentHunk.lines.push({
            type: "context",
            text: line.slice(1),
            oldLineNo: oldLineNo++,
            newLineNo: newLineNo++
          });
        } else if (line.startsWith("\\")) ;
      }
    }
    files.push({
      path,
      origPath: origPath !== path ? origPath : void 0,
      isBinary,
      isRename,
      isNew,
      isDeleted,
      hunks
    });
  }
  return files;
}
async function getWorkingDiffText(repoPath, opts = {}) {
  const args = ["diff", "--no-color", "-M"];
  if (opts.staged) args.push("--cached");
  if (opts.path) args.push("--", opts.path);
  const result = await execGit(repoPath, args);
  if (result.code !== 0 && result.code !== 1) {
    throw new Error(`git diff failed: ${result.stderr}`);
  }
  return result.stdout.toString("utf-8");
}
async function getWorkingDiff(repoPath, opts = {}) {
  return parseUnifiedDiff(await getWorkingDiffText(repoPath, opts));
}
async function getCommitDiff(repoPath, sha) {
  const result = await execGit(repoPath, ["show", "--no-color", "-M", "--format=", sha]);
  if (result.code !== 0) {
    throw new Error(`git show failed: ${result.stderr}`);
  }
  return parseUnifiedDiff(result.stdout.toString("utf-8"));
}
async function safe$2(fn) {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    return {
      ok: false,
      error: { code: "GIT_ERROR", message: err instanceof Error ? err.message : String(err) }
    };
  }
}
function registerGitReadHandlers() {
  ipcMain.handle(
    IpcChannels.gitLog,
    (_evt, repoPath, opts) => safe$2(() => getLog(repoPath, opts))
  );
  ipcMain.handle(
    IpcChannels.gitBranches,
    (_evt, repoPath) => safe$2(() => getBranches(repoPath))
  );
  ipcMain.handle(
    IpcChannels.gitStatus,
    (_evt, repoPath) => safe$2(() => getStatus(repoPath))
  );
  ipcMain.handle(
    IpcChannels.gitDiff,
    (_evt, repoPath, opts) => safe$2(() => getWorkingDiff(repoPath, opts))
  );
  ipcMain.handle(
    IpcChannels.gitShow,
    (_evt, repoPath, sha) => safe$2(() => getCommitDiff(repoPath, sha))
  );
}
async function run$1(repoPath, args) {
  const result = await execGit(repoPath, args);
  if (result.code !== 0) {
    return {
      ok: false,
      error: {
        code: "GIT_ERROR",
        message: `git ${args[0]} failed`,
        stderr: result.stderr
      }
    };
  }
  return { ok: true, data: result.stdout.toString("utf-8") };
}
const stageFile = (repoPath, path) => run$1(repoPath, ["add", "--", path]);
const unstageFile = (repoPath, path) => run$1(repoPath, ["restore", "--staged", "--", path]);
const stagePaths = (repoPath, paths) => run$1(repoPath, ["add", "--", ...paths]);
const unstagePaths = (repoPath, paths) => run$1(repoPath, ["restore", "--staged", "--", ...paths]);
const discardChanges = (repoPath, path) => run$1(repoPath, ["checkout", "--", path]);
const commit = (repoPath, message, opts = {}) => {
  const args = ["commit", "-m", message];
  if (opts.amend) args.push("--amend");
  return run$1(repoPath, args);
};
const checkout = async (repoPath, ref, kind) => {
  if (kind === "remote") {
    const shortName = ref.includes("/") ? ref.slice(ref.indexOf("/") + 1) : ref;
    const localExists = await execGit(repoPath, [
      "rev-parse",
      "--verify",
      "--quiet",
      `refs/heads/${shortName}`
    ]);
    if (localExists.code === 0) {
      return run$1(repoPath, ["checkout", shortName]);
    }
    return run$1(repoPath, ["checkout", "-b", shortName, "--track", ref]);
  }
  return run$1(repoPath, ["checkout", ref]);
};
const createBranch = (repoPath, name, startPoint, doCheckout) => {
  const args = [doCheckout ? "checkout" : "branch", doCheckout ? "-b" : "", name].filter(Boolean);
  if (startPoint) args.push(startPoint);
  return run$1(repoPath, args);
};
const renameBranch = (repoPath, oldName, newName) => run$1(repoPath, ["branch", "-m", oldName, newName]);
const deleteBranch = (repoPath, name, force) => run$1(repoPath, ["branch", force ? "-D" : "-d", name]);
const merge = (repoPath, sourceRef) => run$1(repoPath, ["merge", sourceRef]);
const rebase = (repoPath, ontoRef) => run$1(repoPath, ["rebase", ontoRef]);
const push = (repoPath, opts) => {
  const args = ["push"];
  if (opts.setUpstream) args.push("-u");
  if (opts.force) args.push("--force-with-lease");
  args.push(opts.remote, opts.branch);
  return run$1(repoPath, args);
};
const pull = (repoPath, opts) => {
  const args = ["pull"];
  if (opts.rebase) args.push("--rebase");
  args.push(opts.remote, opts.branch);
  return run$1(repoPath, args);
};
const fetch = (repoPath, remote) => run$1(repoPath, remote ? ["fetch", remote] : ["fetch", "--all"]);
function registerGitWriteHandlers() {
  ipcMain.handle(
    IpcChannels.gitStageFile,
    (_evt, repoPath, path) => stageFile(repoPath, path)
  );
  ipcMain.handle(
    IpcChannels.gitUnstageFile,
    (_evt, repoPath, path) => unstageFile(repoPath, path)
  );
  ipcMain.handle(
    IpcChannels.gitStagePaths,
    (_evt, repoPath, paths) => stagePaths(repoPath, paths)
  );
  ipcMain.handle(
    IpcChannels.gitUnstagePaths,
    (_evt, repoPath, paths) => unstagePaths(repoPath, paths)
  );
  ipcMain.handle(
    IpcChannels.gitDiscardChanges,
    (_evt, repoPath, path) => discardChanges(repoPath, path)
  );
  ipcMain.handle(
    IpcChannels.gitCommit,
    (_evt, repoPath, message, opts) => commit(repoPath, message, opts)
  );
  ipcMain.handle(
    IpcChannels.gitCheckout,
    (_evt, repoPath, ref, kind) => checkout(repoPath, ref, kind)
  );
  ipcMain.handle(
    IpcChannels.gitCreateBranch,
    (_evt, repoPath, name, startPoint, doCheckout) => createBranch(repoPath, name, startPoint, doCheckout)
  );
  ipcMain.handle(
    IpcChannels.gitRenameBranch,
    (_evt, repoPath, oldName, newName) => renameBranch(repoPath, oldName, newName)
  );
  ipcMain.handle(
    IpcChannels.gitDeleteBranch,
    (_evt, repoPath, name, force) => deleteBranch(repoPath, name, force)
  );
  ipcMain.handle(
    IpcChannels.gitMerge,
    (_evt, repoPath, sourceRef) => merge(repoPath, sourceRef)
  );
  ipcMain.handle(
    IpcChannels.gitRebase,
    (_evt, repoPath, ontoRef) => rebase(repoPath, ontoRef)
  );
  ipcMain.handle(
    IpcChannels.gitPush,
    (_evt, repoPath, opts) => push(repoPath, opts)
  );
  ipcMain.handle(
    IpcChannels.gitPull,
    (_evt, repoPath, opts) => pull(repoPath, opts)
  );
  ipcMain.handle(
    IpcChannels.gitFetch,
    (_evt, repoPath, remote) => fetch(repoPath, remote)
  );
}
const TIMEOUT_MS$1 = 3e4;
function execGh(repoPath, args) {
  return new Promise((resolve, reject) => {
    const child = spawn("gh", args, {
      cwd: repoPath,
      windowsHide: true,
      env: { ...process.env, GH_PAGER: "cat", NO_COLOR: "1" }
    });
    const stdoutChunks = [];
    const stderrChunks = [];
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`gh ${args[0]} timed out after ${TIMEOUT_MS$1}ms`));
    }, TIMEOUT_MS$1);
    child.stdout.on("data", (chunk) => stdoutChunks.push(chunk));
    child.stderr.on("data", (chunk) => stderrChunks.push(chunk));
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        stdout: Buffer.concat(stdoutChunks),
        stderr: Buffer.concat(stderrChunks).toString("utf-8"),
        code
      });
    });
  });
}
class GhCliError extends Error {
  code;
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}
const LIST_FIELDS = "number,title,author,headRefName,baseRefName,isDraft,state,url,createdAt,updatedAt,mergeable,reviewDecision,additions,deletions,changedFiles";
const VIEW_FIELDS = `${LIST_FIELDS},body`;
function toPr(raw) {
  return {
    number: raw.number,
    title: raw.title,
    body: raw.body ?? "",
    author: raw.author?.login ?? "unknown",
    state: raw.state === "MERGED" ? "merged" : raw.state === "CLOSED" ? "closed" : "open",
    isDraft: !!raw.isDraft,
    headRefName: raw.headRefName,
    baseRefName: raw.baseRefName,
    url: raw.url,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    mergeable: raw.mergeable === "CONFLICTING" ? "CONFLICTING" : raw.mergeable === "MERGEABLE" ? "MERGEABLE" : "UNKNOWN",
    reviewDecision: raw.reviewDecision || void 0,
    additions: raw.additions ?? 0,
    deletions: raw.deletions ?? 0,
    changedFiles: raw.changedFiles ?? 0
  };
}
async function run(repoPath, args) {
  let result;
  try {
    result = await execGh(repoPath, args);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/ENOENT/.test(message)) {
      throw new GhCliError(
        'GitHub CLI ("gh") was not found on PATH. Install it from cli.github.com to use Pull Requests.',
        "GH_NOT_FOUND"
      );
    }
    throw new GhCliError(message, "GH_ERROR");
  }
  if (result.code !== 0) {
    const stderr = result.stderr.trim();
    if (/gh auth login|not logged into/i.test(stderr)) {
      throw new GhCliError(
        'Not authenticated with GitHub CLI. Run "gh auth login" in a terminal, then retry.',
        "GH_NOT_AUTHENTICATED"
      );
    }
    throw new GhCliError(stderr || `gh ${args[0]} failed`, "GH_ERROR");
  }
  return result.stdout.toString("utf-8");
}
async function listPullRequests(repoPath, state = "open") {
  const out = await run(repoPath, [
    "pr",
    "list",
    "--state",
    state,
    "--json",
    LIST_FIELDS,
    "--limit",
    "100"
  ]);
  const raw = JSON.parse(out);
  return raw.map(toPr);
}
async function getPullRequest(repoPath, number) {
  const out = await run(repoPath, ["pr", "view", String(number), "--json", VIEW_FIELDS]);
  return toPr(JSON.parse(out));
}
async function getPullRequestDiff(repoPath, number) {
  const out = await run(repoPath, ["pr", "diff", String(number)]);
  return parseUnifiedDiff(out);
}
async function createPullRequest(repoPath, opts) {
  const args = ["pr", "create", "--title", opts.title, "--body", opts.body, "--base", opts.base];
  if (opts.draft) args.push("--draft");
  const out = await run(repoPath, args);
  const match = out.trim().match(/\/pull\/(\d+)/);
  const number = match ? parseInt(match[1], 10) : NaN;
  if (Number.isNaN(number)) {
    throw new GhCliError("Pull request was created but its number could not be determined.", "GH_ERROR");
  }
  return getPullRequest(repoPath, number);
}
async function mergePullRequest(repoPath, number, opts) {
  const args = ["pr", "merge", String(number), `--${opts.method}`];
  if (opts.deleteBranch) args.push("--delete-branch");
  await run(repoPath, args);
}
async function closePullRequest(repoPath, number) {
  await run(repoPath, ["pr", "close", String(number)]);
}
async function safe$1(fn) {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    if (err instanceof GhCliError) {
      return { ok: false, error: { code: err.code, message: err.message } };
    }
    return {
      ok: false,
      error: { code: "GH_ERROR", message: err instanceof Error ? err.message : String(err) }
    };
  }
}
function registerPrHandlers() {
  ipcMain.handle(
    IpcChannels.prList,
    (_evt, repoPath, state) => safe$1(() => listPullRequests(repoPath, state))
  );
  ipcMain.handle(
    IpcChannels.prGet,
    (_evt, repoPath, number) => safe$1(() => getPullRequest(repoPath, number))
  );
  ipcMain.handle(
    IpcChannels.prDiff,
    (_evt, repoPath, number) => safe$1(() => getPullRequestDiff(repoPath, number))
  );
  ipcMain.handle(
    IpcChannels.prCreate,
    (_evt, repoPath, opts) => safe$1(() => createPullRequest(repoPath, opts))
  );
  ipcMain.handle(
    IpcChannels.prMerge,
    (_evt, repoPath, number, opts) => safe$1(() => mergePullRequest(repoPath, number, opts))
  );
  ipcMain.handle(
    IpcChannels.prClose,
    (_evt, repoPath, number) => safe$1(() => closePullRequest(repoPath, number))
  );
}
const TIMEOUT_MS = 6e4;
function execClaude(repoPath, prompt, stdinInput) {
  return new Promise((resolve, reject) => {
    const child = spawn("claude", ["-p", prompt], {
      cwd: repoPath,
      windowsHide: true,
      env: { ...process.env }
    });
    const stdoutChunks = [];
    const stderrChunks = [];
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`claude timed out after ${TIMEOUT_MS}ms`));
    }, TIMEOUT_MS);
    child.stdout.on("data", (chunk) => stdoutChunks.push(chunk));
    child.stderr.on("data", (chunk) => stderrChunks.push(chunk));
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        stdout: Buffer.concat(stdoutChunks),
        stderr: Buffer.concat(stderrChunks).toString("utf-8"),
        code
      });
    });
    child.stdin.write(stdinInput);
    child.stdin.end();
  });
}
class ClaudeCliError extends Error {
  code;
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}
const MAX_DIFF_CHARS = 6e4;
const INSTRUCTION = "You are generating a git commit message. Read the unified diff of staged changes given on stdin and write a single, well-formed commit message for it: a concise imperative-mood subject line (max ~72 chars), and if useful, a blank line followed by a short body explaining the why. Output ONLY the commit message text - no preamble, explanation, code fences, or surrounding quotes.";
async function generateCommitMessage(repoPath) {
  const diff = await getWorkingDiffText(repoPath, { staged: true });
  if (!diff.trim()) {
    throw new ClaudeCliError("No staged changes to generate a message for.", "CLAUDE_NO_CHANGES");
  }
  const stdinPayload = diff.length > MAX_DIFF_CHARS ? `${diff.slice(0, MAX_DIFF_CHARS)}

[diff truncated - showing first ${MAX_DIFF_CHARS} characters only]` : diff;
  let result;
  try {
    result = await execClaude(repoPath, INSTRUCTION, stdinPayload);
  } catch (err) {
    const message2 = err instanceof Error ? err.message : String(err);
    if (/ENOENT/.test(message2)) {
      throw new ClaudeCliError(
        'Claude Code CLI ("claude") was not found on PATH. Install it and run "claude" once to sign in.',
        "CLAUDE_NOT_FOUND"
      );
    }
    throw new ClaudeCliError(message2, "CLAUDE_ERROR");
  }
  if (result.code !== 0) {
    throw new ClaudeCliError(
      result.stderr.trim() || "Claude Code failed to generate a commit message.",
      "CLAUDE_ERROR"
    );
  }
  const message = result.stdout.toString("utf-8").trim();
  if (!message) {
    throw new ClaudeCliError("Claude Code returned an empty response.", "CLAUDE_ERROR");
  }
  return message;
}
async function safe(fn) {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    if (err instanceof ClaudeCliError) {
      return { ok: false, error: { code: err.code, message: err.message } };
    }
    return {
      ok: false,
      error: { code: "CLAUDE_ERROR", message: err instanceof Error ? err.message : String(err) }
    };
  }
}
function registerAiHandlers() {
  ipcMain.handle(
    IpcChannels.aiGenerateCommitMessage,
    (_evt, repoPath) => safe(() => generateCommitMessage(repoPath))
  );
}
function registerIpcHandlers() {
  ipcMain.handle(IpcChannels.appPing, () => "pong");
  registerAppHandlers();
  registerRepoHandlers();
  registerGitReadHandlers();
  registerGitWriteHandlers();
  registerPrHandlers();
  registerAiHandlers();
}
app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.commits.app");
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });
  registerIpcHandlers();
  createMainWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
