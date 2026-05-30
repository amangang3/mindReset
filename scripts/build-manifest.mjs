#!/usr/bin/env node
import { readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const audioDir = join(here, '..', 'public', 'audio')
const manifestPath = join(audioDir, 'manifest.json')
const allowed = new Set(['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.oga', '.flac', '.webm'])

if (!existsSync(audioDir)) {
  mkdirSync(audioDir, { recursive: true })
}

const files = readdirSync(audioDir)
  .filter((name) => !name.startsWith('.') && name !== 'manifest.json')
  .filter((name) => allowed.has(extname(name).toLowerCase()))
  .sort((a, b) => a.localeCompare(b))
  .map((name) => ({ name: name.replace(extname(name), ''), file: name }))

writeFileSync(manifestPath, JSON.stringify({ files }, null, 2) + '\n')
console.log(`[manifest] ${files.length} file(s) -> public/audio/manifest.json`)
