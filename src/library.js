const base = import.meta.env.BASE_URL

export async function fetchLibrary() {
  const res = await fetch(`${base}audio/manifest.json`, { cache: 'no-cache' })
  if (!res.ok) {
    throw new Error(`Could not load audio manifest (${res.status})`)
  }
  const { files } = await res.json()
  return files ?? []
}

export function audioUrl(file) {
  const path = file.file.split('/').map(encodeURIComponent).join('/')
  return `${base}audio/${path}`
}
