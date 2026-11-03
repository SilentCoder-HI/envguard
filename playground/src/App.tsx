import { useMemo, useState } from 'react'
import './App.css'
import { buildExample, parseEnv } from '@silentcoderhi/envguard'
import { envSchema } from '../env.config'

const validExample = `NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://user:pass@localhost:5432/mydb
JWT_SECRET=dummy_secret_key_that_is_32_chars_long_ok
ENABLE_AI=true`

const invalidExample = `NODE_ENV=staging
PORT=abc
DATABASE_URL=not a url
JWT_SECRET=short
ENABLE_AI=maybe`

type Command = 'check' | 'example' | 'scan' | 'doctor'

const commands: { id: Command; label: string; command: string; summary: string }[] = [
  { id: 'check', label: 'Check', command: 'npx envguard check', summary: 'Validate values in your .env file.' },
  { id: 'example', label: 'Example', command: 'npx envguard example', summary: 'Generate .env.example from your schema.' },
  { id: 'scan', label: 'Scan', command: 'npx envguard scan', summary: 'Find environment references missing from the schema.' },
  { id: 'doctor', label: 'Doctor', command: 'npx envguard doctor', summary: 'Review common environment safety risks.' },
]

const sampleSource = [
  'const port = ' + 'process' + '.env.PORT',
  'const mode = ' + 'process' + '.env.NODE_ENV',
  'const oldFlag = ' + 'process' + '.env.LEGACY_FLAG',
].join('\n')

function findSourceUsages(source: string) {
  const pattern = /(?:process\.env|import\.meta\.env)\.([A-Za-z_][A-Za-z0-9_]*)|(?:process\.env|import\.meta\.env)\[\s*["'`]([A-Za-z_][A-Za-z0-9_]*)["'`]\s*\]/g
  return [...source.matchAll(pattern)].map((match) => ({
    name: match[1] ?? match[2]!,
    line: source.slice(0, match.index).split('\n').length,
  }))
}

function App() {
  const [envText, setEnvText] = useState(validExample)
  const [sourceText, setSourceText] = useState(sampleSource)
  const [activeCommand, setActiveCommand] = useState<Command>('check')
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => envSchema.safeParse(parseEnv(envText)), [envText])
  const exampleText = useMemo(() => buildExample(envSchema.shape), [])
  const usages = useMemo(() => findSourceUsages(sourceText), [sourceText])
  const declared = new Set(Object.keys(envSchema.shape))
  const undeclared = usages.filter(({ name }) => !declared.has(name))
  const unused = [...declared].filter((name) => !usages.some((usage) => usage.name === name))
  const publicSecrets = Object.entries(envSchema.shape).filter(([name, field]) =>
    field.meta.secret && /^(NEXT_PUBLIC_|VITE_|PUBLIC_|REACT_APP_|EXPO_PUBLIC_|NUXT_PUBLIC_)/.test(name),
  )
  const command = commands.find(({ id }) => id === activeCommand)!

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  function downloadExample() {
    const url = URL.createObjectURL(new Blob([exampleText], { type: 'text/plain' }))
    const link = document.createElement('a')
    link.href = url
    link.download = '.env.example'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="EnvGuard home">
          <span className="brand-mark">E</span>
          <span>envguard</span>
        </a>
        <span className="topbar-note"><span className="online-dot" /> Browser playground</span>
      </header>

      <section className="intro" id="top">
        <div className="eyebrow"><span>ENVIRONMENT TOOLKIT</span><span className="eyebrow-line" /></div>
        <h1>Make environment<br /><span>variables safer.</span></h1>
        <p>Try EnvGuard’s schema-driven checks. Edit the examples and see the results instantly.</p>
        <div className="command-callout">
          <span className="terminal-icon">›_</span>
          <code>{command.command}</code>
          <button type="button" className="copy-command" onClick={() => void copy(command.command)}>
            {copied ? 'Copied' : 'Copy'}
          </button>
          <span className="run-note">Run in your project terminal</span>
        </div>
      </section>

      <section className="workbench" aria-label="EnvGuard command playground">
        <nav className="command-tabs" aria-label="Choose a command">
          {commands.map(({ id, label }, index) => (
            <button
              key={id}
              type="button"
              className={`command-tab${activeCommand === id ? ' active' : ''}`}
              aria-pressed={activeCommand === id}
              onClick={() => setActiveCommand(id)}
            >
              <span className="tab-index">0{index + 1}</span>{label}
            </button>
          ))}
        </nav>

        <div className="workbench-heading">
          <div>
            <span className="section-kicker">{command.command}</span>
            <h2>{command.summary}</h2>
          </div>
          <span className="demo-badge">INTERACTIVE DEMO</span>
        </div>

        {activeCommand === 'check' && (
          <div className="demo-grid">
            <div className="editor-panel">
              <div className="panel-heading"><span><i className="file-dot" /> .env</span><span>EDIT VALUES</span></div>
              <div className="editor-actions">
                <button type="button" onClick={() => setEnvText(validExample)}>Load valid</button>
                <button type="button" onClick={() => setEnvText(invalidExample)}>Load invalid</button>
              </div>
              <textarea aria-label="Environment file contents" spellCheck={false} value={envText} onChange={(event) => setEnvText(event.target.value)} />
            </div>
            <div className="result-panel">
              <div className="panel-heading"><span>VALIDATION RESULT</span><span className={`status-pill ${result.success ? 'success' : 'error'}`}><i />{result.success ? 'VALID' : 'NEEDS ATTENTION'}</span></div>
              {result.success ? (
                <>
                  <p className="result-message">All {Object.keys(envSchema.shape).length} variables match the schema.</p>
                  <pre className="result-code">{JSON.stringify(result.data, null, 2)}</pre>
                </>
              ) : (
                <>
                  <p className="result-message">Fix these values to satisfy your schema.</p>
                  <ul className="finding-list">{Object.entries(result.errors).map(([name, message]) => <li key={name}><span className="finding-key">{name}</span><span>{message}</span></li>)}</ul>
                </>
              )}
            </div>
          </div>
        )}

        {activeCommand === 'example' && (
          <div className="single-demo">
            <div className="panel-heading"><span><i className="file-dot" /> .env.example</span><span>GENERATED FROM SCHEMA</span></div>
            <p className="result-message">Descriptions become comments. Secret values are intentionally left blank.</p>
            <pre className="result-code example-output">{exampleText}</pre>
            <div className="button-row">
              <button className="primary-button" type="button" onClick={downloadExample}>Download .env.example</button>
              <button className="secondary-button" type="button" onClick={() => void copy(exampleText)}>{copied ? 'Copied' : 'Copy contents'}</button>
            </div>
          </div>
        )}

        {activeCommand === 'scan' && (
          <div className="demo-grid">
            <div className="editor-panel">
              <div className="panel-heading"><span><i className="file-dot code-dot" /> src/server.ts</span><span>PASTE SOURCE</span></div>
              <textarea aria-label="Source code to scan" className="source-editor" spellCheck={false} value={sourceText} onChange={(event) => setSourceText(event.target.value)} />
            </div>
            <div className="result-panel">
              <div className="panel-heading"><span>SCAN RESULT</span><span className={`status-pill ${undeclared.length ? 'error' : 'success'}`}><i />{undeclared.length ? 'MISSING VARIABLES' : 'SCHEMA MATCH'}</span></div>
              {undeclared.length ? <ul className="finding-list">{undeclared.map(({ name, line }, index) => <li key={`${name}-${line}-${index}`}><span className="finding-key">{name}</span><span>Not declared in schema · line {line}</span></li>)}</ul> : <p className="result-message">Every detected environment variable is declared.</p>}
              {unused.length > 0 && <p className="muted-note">Unused in this sample: {unused.join(', ')}</p>}
              <p className="muted-note">The browser demo scans direct dot and quoted-bracket access. The CLI scans your project files.</p>
            </div>
          </div>
        )}

        {activeCommand === 'doctor' && (
          <div className="single-demo">
            <div className="panel-heading"><span>SAFETY REVIEW</span><span className="status-pill success"><i />SCHEMA CHECKS PASSED</span></div>
            <ul className="doctor-list">
              <li><span className="check-mark">✓</span><span><strong>Example template is safe</strong><small>Generated secret values are blank; no recognizable secret patterns found.</small></span><span className="doctor-state">PASS</span></li>
              <li><span className="check-mark">{publicSecrets.length ? '!' : '✓'}</span><span><strong>Secrets are not exposed by public prefixes</strong><small>{publicSecrets.length ? `Review: ${publicSecrets.map(([name]) => name).join(', ')}` : 'No .secret() fields use a browser-exposed prefix.'}</small></span><span className={`doctor-state${publicSecrets.length ? ' warning' : ''}`}>{publicSecrets.length ? 'REVIEW' : 'PASS'}</span></li>
              <li className="cli-only-row"><span className="info-mark">i</span><span><strong>Git checks require the CLI</strong><small>The browser cannot inspect your .gitignore or Git tracking status.</small></span><span className="doctor-state neutral">CLI ONLY</span></li>
            </ul>
          </div>
        )}

        <footer className="workbench-footer"><span>Using the sample schema in <code>env.config.ts</code></span><span>Changes stay in this browser</span></footer>
      </section>

      <section className="cli-guide">
        <div><span className="section-kicker">USE IT FOR REAL</span><h2>Run the same checks<br />in your project.</h2></div>
        <div className="cli-list">{commands.map(({ id, command: cliCommand, summary }) => <button key={id} type="button" onClick={() => { setActiveCommand(id); window.scrollTo({ top: 0, behavior: 'smooth' }) }}><code>{cliCommand}</code><span>{summary}</span><b>↗</b></button>)}</div>
        <p className="cli-disclaimer">The interactive panels demonstrate browser-safe checks. These commands run against your real files when executed from your project directory.</p>
      </section>

      <footer className="page-footer"><span>ENVGUARD <span>·</span> SAFER CONFIGURATION, LESS GUESSWORK</span><a href="https://www.npmjs.com/package/@silentcoderhi/envguard" target="_blank" rel="noreferrer">View package ↗</a></footer>
    </main>
  )
}

export default App