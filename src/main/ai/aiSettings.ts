import { app, safeStorage } from 'electron'
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { join } from 'path'

function settingsPath(): string {
  return join(app.getPath('userData'), 'ai-settings.json')
}

interface StoredSettings {
  apiKeyEncrypted?: string
}

function readStored(): StoredSettings {
  const p = settingsPath()
  if (!existsSync(p)) return {}
  try {
    return JSON.parse(readFileSync(p, 'utf-8')) as StoredSettings
  } catch {
    return {}
  }
}

function writeStored(data: StoredSettings): void {
  writeFileSync(settingsPath(), JSON.stringify(data), 'utf-8')
}

/** Reads the stored Anthropic API key. Encrypted at rest via Electron's OS-keychain-backed
 * safeStorage when available; falls back to a locally-stored plain value only if the OS has
 * no keychain (the key is still never transmitted anywhere but Anthropic's API). */
export function getApiKey(): string | null {
  const stored = readStored()
  if (!stored.apiKeyEncrypted) return null
  const buf = Buffer.from(stored.apiKeyEncrypted, 'base64')
  if (!safeStorage.isEncryptionAvailable()) {
    return buf.toString('utf-8')
  }
  try {
    return safeStorage.decryptString(buf)
  } catch {
    return null
  }
}

export function hasApiKey(): boolean {
  return getApiKey() !== null
}

export function setApiKey(key: string): void {
  const trimmed = key.trim()
  const encoded = safeStorage.isEncryptionAvailable()
    ? safeStorage.encryptString(trimmed)
    : Buffer.from(trimmed, 'utf-8')
  writeStored({ apiKeyEncrypted: encoded.toString('base64') })
}

export function clearApiKey(): void {
  const p = settingsPath()
  if (existsSync(p)) unlinkSync(p)
}
