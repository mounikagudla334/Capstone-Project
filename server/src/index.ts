import 'node:process'
import { join } from 'node:path'
import { createApp } from './app.ts'
import { openDb } from './db.ts'
import { createRepo } from './repo.ts'
import { createExtractor } from './extractor.ts'

const port = Number(process.env.PORT ?? 3000)
const db = openDb(process.env.DB_PATH ?? './data/notes.db')
const app = createApp({
  repo: createRepo(db),
  extractor: createExtractor({
    apiKey: process.env.ANTHROPIC_API_KEY || undefined,
    model: process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-20250514',
  }),
  appToken: process.env.APP_TOKEN || undefined,
  clientDir: join(process.cwd(), 'client', 'dist'),
})

app.listen(port, () => {
  console.log(`Meeting Notes Organizer listening on :${port}`)
  if (!process.env.ANTHROPIC_API_KEY) console.log('No ANTHROPIC_API_KEY set: using rule-based fallback extraction.')
})
