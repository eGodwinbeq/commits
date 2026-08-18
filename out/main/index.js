import { app, session, ipcMain, BrowserWindow, shell, dialog, safeStorage } from "electron";
import { join, basename } from "path";
import { spawn, execFile } from "child_process";
import { homedir } from "os";
import https from "https";
import { existsSync, unlinkSync, writeFileSync, readFileSync } from "fs";
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
    icon: join(__dirname, "../../build/icon.png"),
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
const DEFAULT_TIMEOUT_MS$1 = 3e4;
const NETWORK_TIMEOUT_MS = 12e4;
const NETWORK_SUBCOMMANDS = /* @__PURE__ */ new Set(["push", "pull", "fetch", "clone"]);
function execGit(repoPath, args, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? (NETWORK_SUBCOMMANDS.has(args[0]) ? NETWORK_TIMEOUT_MS : DEFAULT_TIMEOUT_MS$1);
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
async function getCommitCount(path) {
  const emailResult = await execGit(path, ["config", "user.email"]);
  const author = emailResult.code === 0 ? emailResult.stdout.toString("utf-8").trim() : "";
  const args = ["rev-list", "--count", "HEAD"];
  if (author) args.push(`--author=${author}`);
  const result = await execGit(path, args);
  if (result.code !== 0) {
    return {
      ok: false,
      error: { code: "GIT_ERROR", message: "Could not count commits.", stderr: result.stderr }
    };
  }
  const count = parseInt(result.stdout.toString("utf-8").trim(), 10);
  return { ok: true, data: Number.isNaN(count) ? 0 : count };
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
  ipcMain.handle(IpcChannels.repoCommitCount, async (_evt, path) => {
    return getCommitCount(path);
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
    if (/no git remotes found|does not appear to be a git repository|unknown host/i.test(stderr)) {
      throw new GhCliError(
        'This repository has no GitHub remote that "gh" can resolve. Check "git remote -v".',
        "GH_ERROR"
      );
    }
    throw new GhCliError(stderr || `gh ${args[0]} failed (exit ${result.code})`, "GH_ERROR");
  }
  return result.stdout.toString("utf-8");
}
function parseJson(out, context) {
  try {
    return JSON.parse(out);
  } catch {
    throw new GhCliError(
      `Could not parse "gh"'s response while ${context}. Try running "gh --version" to confirm it's up to date.`,
      "GH_ERROR"
    );
  }
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
  const raw = parseJson(out, "listing pull requests");
  return raw.map(toPr);
}
async function getPullRequest(repoPath, number) {
  const out = await run(repoPath, ["pr", "view", String(number), "--json", VIEW_FIELDS]);
  return toPr(parseJson(out, "loading the pull request"));
}
async function getPullRequestDiff(repoPath, number) {
  const out = await run(repoPath, ["pr", "diff", String(number)]);
  return parseUnifiedDiff(out);
}
async function createPullRequest(repoPath, opts) {
  const args = ["pr", "create", "--title", opts.title, "--body", opts.body, "--base", opts.base];
  if (opts.head) args.push("--head", opts.head);
  if (opts.draft) args.push("--draft");
  if (opts.reviewers?.length) args.push("--reviewer", opts.reviewers.join(","));
  if (opts.labels?.length) args.push("--label", opts.labels.join(","));
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
const DEFAULT_TIMEOUT_MS = 6e4;
function execClaude(binPath, cwd, prompt, stdinInput, timeoutMs = DEFAULT_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const child = spawn(binPath, ["-p", prompt], {
      cwd,
      windowsHide: true,
      env: { ...process.env }
    });
    const stdoutChunks = [];
    const stderrChunks = [];
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`claude timed out after ${timeoutMs}ms`));
    }, timeoutMs);
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
const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const TIMEOUT_MS = 3e4;
function callAnthropicMessages(apiKey, opts) {
  const body = JSON.stringify({
    model: opts.model ?? DEFAULT_MODEL,
    max_tokens: opts.maxTokens ?? 300,
    system: opts.system,
    messages: [{ role: "user", content: opts.userMessage }]
  });
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.anthropic.com",
        path: "/v1/messages",
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-length": Buffer.byteLength(body)
        },
        timeout: TIMEOUT_MS
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf-8");
          if (!res.statusCode || res.statusCode >= 400) {
            let message = `Anthropic API request failed (HTTP ${res.statusCode ?? "unknown"}).`;
            try {
              const parsed = JSON.parse(text);
              if (parsed?.error?.message) message = parsed.error.message;
            } catch {
            }
            reject(new Error(message));
            return;
          }
          try {
            const parsed = JSON.parse(text);
            const content = parsed.content?.[0]?.text;
            if (!content) {
              reject(new Error("Anthropic API returned an empty response."));
              return;
            }
            resolve(content);
          } catch {
            reject(new Error("Failed to parse the Anthropic API response."));
          }
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Anthropic API request timed out."));
    });
    req.write(body);
    req.end();
  });
}
function candidatePaths() {
  const home = homedir();
  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA ?? join(home, "AppData", "Local");
    const appData = process.env.APPDATA ?? join(home, "AppData", "Roaming");
    const programFiles = process.env["ProgramFiles"] ?? "C:\\Program Files";
    return [
      join(home, ".claude", "local", "claude.exe"),
      join(localAppData, "Programs", "claude-code", "claude.exe"),
      join(localAppData, "AnthropicClaude", "claude.exe"),
      join(programFiles, "Claude", "claude.exe"),
      join(appData, "npm", "claude.cmd")
    ];
  }
  if (process.platform === "darwin") {
    return [
      join(home, ".claude", "local", "claude"),
      "/Applications/Claude.app/Contents/Resources/claude",
      "/opt/homebrew/bin/claude",
      "/usr/local/bin/claude"
    ];
  }
  return [join(home, ".claude", "local", "claude"), "/usr/local/bin/claude"];
}
function checkVersion(binPath) {
  return new Promise((resolve) => {
    execFile(binPath, ["--version"], { timeout: 5e3, windowsHide: true }, (err, stdout) => {
      resolve(err ? null : stdout.toString().trim());
    });
  });
}
let cached = null;
async function detectClaudeCli(forceRefresh = false) {
  if (cached && !forceRefresh) return cached;
  try {
    const candidates = ["claude", ...candidatePaths().filter((p) => existsSync(p))];
    const results = await Promise.all(
      candidates.map(async (path) => ({ path, version: await checkVersion(path) }))
    );
    const hit = results.find((r) => r.version);
    cached = hit ? { available: true, path: hit.path, version: hit.version } : { available: false };
  } catch {
    cached = { available: false };
  }
  return cached;
}
function settingsPath() {
  return join(app.getPath("userData"), "ai-settings.json");
}
function readStored() {
  const p = settingsPath();
  if (!existsSync(p)) return {};
  try {
    return JSON.parse(readFileSync(p, "utf-8"));
  } catch {
    return {};
  }
}
function writeStored(data) {
  writeFileSync(settingsPath(), JSON.stringify(data), "utf-8");
}
function getApiKey() {
  const stored = readStored();
  if (!stored.apiKeyEncrypted) return null;
  const buf = Buffer.from(stored.apiKeyEncrypted, "base64");
  if (!safeStorage.isEncryptionAvailable()) {
    return buf.toString("utf-8");
  }
  try {
    return safeStorage.decryptString(buf);
  } catch {
    return null;
  }
}
function hasApiKey() {
  return getApiKey() !== null;
}
function setApiKey(key) {
  const trimmed = key.trim();
  const encoded = safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(trimmed) : Buffer.from(trimmed, "utf-8");
  writeStored({ apiKeyEncrypted: encoded.toString("base64") });
}
function clearApiKey() {
  const p = settingsPath();
  if (existsSync(p)) unlinkSync(p);
}
class ClaudeCliError extends Error {
  code;
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}
const MAX_DIFF_CHARS = 6e4;
const INSTRUCTION = "You are generating a git commit message. Read the unified diff of staged changes given below and write a single, well-formed commit message for it: a concise imperative-mood subject line (max ~72 chars), and if useful, a blank line followed by a short body explaining the why. Output ONLY the commit message text - no preamble, explanation, code fences, or surrounding quotes.";
async function generateCommitMessage(repoPath) {
  const diff = await getWorkingDiffText(repoPath, { staged: true });
  if (!diff.trim()) {
    throw new ClaudeCliError("No staged changes to generate a message for.", "CLAUDE_NO_CHANGES");
  }
  const diffPayload = diff.length > MAX_DIFF_CHARS ? `${diff.slice(0, MAX_DIFF_CHARS)}

[diff truncated - showing first ${MAX_DIFF_CHARS} characters only]` : diff;
  const apiKey = getApiKey();
  if (apiKey) {
    try {
      const text = await callAnthropicMessages(apiKey, {
        system: INSTRUCTION,
        userMessage: `Staged diff:

${diffPayload}`
      });
      const message2 = text.trim();
      if (!message2) throw new Error("Anthropic API returned an empty response.");
      return message2;
    } catch (err) {
      throw new ClaudeCliError(err instanceof Error ? err.message : String(err), "CLAUDE_ERROR");
    }
  }
  const cli = await detectClaudeCli();
  if (!cli.available || !cli.path) {
    throw new ClaudeCliError(
      "No AI connection configured. Add an Anthropic API key or connect Claude Code in Settings.",
      "CLAUDE_NOT_CONFIGURED"
    );
  }
  let result;
  try {
    result = await execClaude(cli.path, repoPath, INSTRUCTION, diffPayload);
  } catch (err) {
    const message2 = err instanceof Error ? err.message : String(err);
    if (/ENOENT/.test(message2)) {
      throw new ClaudeCliError(
        "No AI connection configured. Add an Anthropic API key or connect Claude Code in Settings.",
        "CLAUDE_NOT_CONFIGURED"
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
function launchClaudeInTerminal(binPath) {
  if (process.platform === "win32") {
    const child2 = spawn("cmd.exe", ["/c", "start", '""', "cmd.exe", "/k", binPath], {
      detached: true,
      windowsHide: false,
      stdio: "ignore"
    });
    child2.unref();
    return;
  }
  if (process.platform === "darwin") {
    const escaped = binPath.replace(/"/g, '\\"');
    const child2 = spawn("osascript", ["-e", `tell application "Terminal" to do script "${escaped}"`], {
      detached: true,
      stdio: "ignore"
    });
    child2.unref();
    return;
  }
  const child = spawn("x-terminal-emulator", ["-e", binPath], { detached: true, stdio: "ignore" });
  child.unref();
}
const TEST_TIMEOUT_MS = 2e4;
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
  ipcMain.handle(IpcChannels.aiGetStatus, async () => {
    try {
      const cli = await detectClaudeCli();
      return {
        ok: true,
        data: {
          hasApiKey: hasApiKey(),
          cliAvailable: cli.available,
          cliVersion: cli.version,
          cliPath: cli.path
        }
      };
    } catch (err) {
      return {
        ok: false,
        error: { code: "AI_STATUS_ERROR", message: err instanceof Error ? err.message : String(err) }
      };
    }
  });
  ipcMain.handle(IpcChannels.aiSetApiKey, (_evt, key) => {
    if (!key || !key.trim()) {
      return Promise.resolve({
        ok: false,
        error: { code: "INVALID_KEY", message: "API key cannot be empty." }
      });
    }
    setApiKey(key);
    return Promise.resolve({ ok: true, data: void 0 });
  });
  ipcMain.handle(IpcChannels.aiClearApiKey, () => {
    clearApiKey();
    return Promise.resolve({ ok: true, data: void 0 });
  });
  ipcMain.handle(
    IpcChannels.aiTestClaudeCli,
    () => safe(async () => {
      const cli = await detectClaudeCli(true);
      if (!cli.available || !cli.path) {
        throw new ClaudeCliError(
          'Claude Code was not found. Install it, or use "Open Claude Code to Sign In" once it is.',
          "CLAUDE_NOT_CONFIGURED"
        );
      }
      const result = await execClaude(
        cli.path,
        homedir(),
        "Reply with exactly the single word OK and nothing else.",
        "",
        TEST_TIMEOUT_MS
      );
      if (result.code !== 0) {
        throw new ClaudeCliError(
          result.stderr.trim() || "Claude Code did not respond successfully - you may need to sign in first.",
          "CLAUDE_ERROR"
        );
      }
      const reply = result.stdout.toString("utf-8").trim();
      return reply || "Connected";
    })
  );
  ipcMain.handle(
    IpcChannels.aiLaunchClaudeSignIn,
    () => safe(async () => {
      const cli = await detectClaudeCli();
      if (!cli.available || !cli.path) {
        throw new ClaudeCliError(
          "Claude Code was not found on this machine. Install it first.",
          "CLAUDE_NOT_CONFIGURED"
        );
      }
      launchClaudeInTerminal(cli.path);
    })
  );
}
let activeChild = null;
const DEVICE_CODE_RE = /([A-Z0-9]{4}-[A-Z0-9]{4})/;
function startGithubDeviceAuth(onEvent) {
  if (activeChild) {
    onEvent({ type: "error", message: "A GitHub sign-in is already in progress." });
    return;
  }
  let child;
  try {
    child = spawn(
      "gh",
      ["auth", "login", "--hostname", "github.com", "--git-protocol", "https", "--web"],
      { windowsHide: true, env: { ...process.env } }
    );
  } catch (err) {
    onEvent({ type: "error", message: err instanceof Error ? err.message : String(err) });
    return;
  }
  activeChild = child;
  let buffer = "";
  let codeSent = false;
  const handleChunk = (chunk) => {
    buffer += chunk.toString("utf-8");
    if (codeSent) return;
    const match = buffer.match(DEVICE_CODE_RE);
    if (match) {
      codeSent = true;
      onEvent({ type: "code", code: match[1], url: "https://github.com/login/device" });
      child.stdin.write("\n");
    }
  };
  child.stdout.on("data", handleChunk);
  child.stderr.on("data", handleChunk);
  child.on("error", (err) => {
    activeChild = null;
    onEvent({
      type: "error",
      message: /ENOENT/.test(err.message) ? 'GitHub CLI ("gh") was not found on PATH.' : err.message
    });
  });
  child.on("close", (exitCode) => {
    activeChild = null;
    if (exitCode === 0) {
      onEvent({ type: "done", ok: true });
    } else {
      onEvent({
        type: "done",
        ok: false,
        message: buffer.trim() || `gh auth login exited with code ${exitCode}`
      });
    }
  });
}
function cancelGithubDeviceAuth() {
  if (activeChild) {
    activeChild.kill();
    activeChild = null;
  }
}
function registerGhAuthHandlers() {
  ipcMain.handle(IpcChannels.ghStartDeviceAuth, (evt) => {
    startGithubDeviceAuth((event) => {
      if (event.type === "code" && event.url) {
        shell.openExternal(event.url);
      }
      if (!evt.sender.isDestroyed()) {
        evt.sender.send(IpcChannels.ghAuthEvent, event);
      }
    });
  });
  ipcMain.handle(IpcChannels.ghCancelDeviceAuth, () => {
    cancelGithubDeviceAuth();
  });
}
function registerIpcHandlers() {
  ipcMain.handle(IpcChannels.appPing, () => "pong");
  registerAppHandlers();
  registerRepoHandlers();
  registerGitReadHandlers();
  registerGitWriteHandlers();
  registerPrHandlers();
  registerAiHandlers();
  registerGhAuthHandlers();
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
