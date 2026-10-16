// Builds llms-full.txt from llms.txt, the specs and the developer guides.
// Runs from prepublishOnly; edit the sources, not llms-full.txt.
import { readFileSync, writeFileSync } from 'node:fs'

const sources = [
  'llms.txt',
  'spec/protocol.md',
  'spec/voting.md',
  'docs/signet-in-5-minutes.md',
  'docs/implementation-levels.md',
]

const read = (path) => {
  const text = readFileSync(path, 'utf8')
  // Links in spec/ are relative to spec/; llms-full.txt sits at the root.
  return path.startsWith('spec/') ? text.replaceAll('](protocol.md)', '](spec/protocol.md)') : text
}

const out = sources.map((path) => read(path).trimEnd()).join('\n\n\n---\n\n') + '\n'

if (process.argv.includes('--check')) {
  if (readFileSync('llms-full.txt', 'utf8') !== out) {
    console.error('llms-full.txt is stale: run npm run build:llms')
    process.exit(1)
  }
} else {
  writeFileSync('llms-full.txt', out)
}
