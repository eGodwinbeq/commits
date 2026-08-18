# Privacy Policy for Commits

**Effective date:** [insert date]

Commits ("the App") is a desktop Git client. This policy explains what data the App accesses, where it goes, and what stays on your device. It covers the App itself — not any third-party service you choose to connect it to (GitHub, Anthropic), which is governed by that service's own privacy policy.

## Summary

Commits does not operate any servers of its own, does not collect analytics or telemetry, and does not have user accounts. Everything the App does happens either entirely on your device or through a direct connection from your device to a third-party service you explicitly configure (GitHub CLI, Anthropic API). We (the developer) never see your code, commit history, or credentials.

## Data the App reads

To function, Commits reads, on your local machine:

- The Git repositories you explicitly open (commit history, branches, diffs, file status, tags).
- Your local Git configuration (e.g. `user.name`, `user.email`) to attribute actions and label your own commits.

None of this is transmitted anywhere by the App itself. It is used only to render the App's UI and to run the Git commands you request (stage, commit, push, pull, merge, checkout, etc.), which go directly from your machine to the Git remotes you've configured (e.g. `origin`) — the same as running `git` from a terminal.

## Data stored locally

- **Recent repositories** (file paths) and **theme preference** — stored in the App's local browser storage on your device.
- **Anthropic API key**, if you choose to add one for AI commit-message generation — encrypted using your operating system's credential store (Windows Credential Manager / macOS Keychain / Linux Secret Service, via Electron's `safeStorage`) and saved in a local settings file in the App's application-data folder on your device. It is never transmitted anywhere except directly to Anthropic's API when you use the AI generation feature, and never to us.

None of the above leaves your device except as described below.

## Third-party connections you control

Commits integrates with two third-party services, both **only when you use the related feature**, and both authenticated with **your own credentials** — the App never asks you to create an account with it and never proxies these connections through any server we operate:

- **GitHub** (via the `gh` CLI, using your existing GitHub CLI login, or a device-code sign-in flow the App can launch on your behalf). Used for the Pull Requests feature: listing, viewing, creating, merging, and closing pull requests. This talks directly to GitHub's API using your GitHub credentials. See [GitHub's Privacy Statement](https://docs.github.com/site-policy/privacy-policies/github-privacy-statement).
- **Anthropic (Claude)**, used only for the optional "Generate with AI" commit-message feature. If you connect an Anthropic API key, the diff of your **staged changes** is sent directly from your device to Anthropic's API to generate a suggested commit message. If you instead use the Claude Code CLI, the same diff is passed to that CLI, which is subject to your own Claude Code authentication and Anthropic's terms. This feature is entirely opt-in — nothing is sent unless you click "Generate with AI." See [Anthropic's Privacy Policy](https://www.anthropic.com/legal/privacy).

## What we do not do

- We do not run analytics, crash reporting, or usage tracking of any kind.
- We do not collect or transmit your source code, commit history, or diffs to any server we control.
- We do not have a login system, and we do not know who you are.
- We do not sell or share data, because we do not collect any to begin with.

## Security

Your Anthropic API key is encrypted at rest via your OS's native credential store. Git and GitHub credentials are managed entirely by `git` and `gh`, not stored by the App. If your device is compromised, locally stored data (including the encrypted key file and your repositories) could be at risk, as with any desktop application.

## Children's privacy

Commits is a developer tool not directed at children and is not intended for use by anyone under 13.

## Changes to this policy

If the App's data practices change (for example, adding new integrations), this document will be updated and the effective date above will change accordingly.

## Contact

Questions about this policy: [insert contact email]
