#!/usr/bin/env node
import { readdirSync, statSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const audioDir = join(here, '..', 'public', 'audio')
const manifestPath = join(audioDir, 'manifest.json')
const allowed = new Set(['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.oga', '.flac', '.webm'])

if (!existsSync(audioDir)) {
  mkdirSync(audioDir, { recursive: true })
}

const subdirs = readdirSync(audioDir)
  .filter((name) => !name.startsWith('.'))
  .filter((name) => statSync(join(audioDir, name)).isDirectory())
  .sort((a, b) => a.localeCompare(b))

const files = []
for (const sub of subdirs) {
  const entries = readdirSync(join(audioDir, sub))
    .filter((name) => !name.startsWith('.'))
    .filter((name) => allowed.has(extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b))
  for (const name of entries) {
    files.push({
      name: name.replace(extname(name), ''),
      file: `${sub}/${name}`,
      category: sub,
    })
  }
}

writeFileSync(manifestPath, JSON.stringify({ files }, null, 2) + '\n')
console.log(`[manifest] ${files.length} file(s) across ${subdirs.length} folder(s) -> public/audio/manifest.json`)
