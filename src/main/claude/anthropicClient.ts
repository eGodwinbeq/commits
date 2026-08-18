import https from 'https'

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001'
const TIMEOUT_MS = 30_000

export function callAnthropicMessages(
  apiKey: string,
  opts: { system?: string; userMessage: string; model?: string; maxTokens?: number }
): Promise<string> {
  const body = JSON.stringify({
    model: opts.model ?? DEFAULT_MODEL,
    max_tokens: opts.maxTokens ?? 300,
    system: opts.system,
    messages: [{ role: 'user', content: opts.userMessage }]
  })

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-length': Buffer.byteLength(body)
        },
        timeout: TIMEOUT_MS
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer) => chunks.push(chunk))
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf-8')
          if (!res.statusCode || res.statusCode >= 400) {
            let message = `Anthropic API request failed (HTTP ${res.statusCode ?? 'unknown'}).`
            try {
              const parsed = JSON.parse(text) as { error?: { message?: string } }
              if (parsed?.error?.message) message = parsed.error.message
            } catch {
              // keep the generic message if the error body isn't JSON
            }
            reject(new Error(message))
            return
          }
          try {
            const parsed = JSON.parse(text) as { content?: { text?: string }[] }
            const content = parsed.content?.[0]?.text
            if (!content) {
              reject(new Error('Anthropic API returned an empty response.'))
              return
            }
            resolve(content)
          } catch {
            reject(new Error('Failed to parse the Anthropic API response.'))
          }
        })
      }
    )
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Anthropic API request timed out.'))
    })
    req.write(body)
    req.end()
  })
}
