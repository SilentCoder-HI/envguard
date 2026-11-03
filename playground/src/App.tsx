import { useMemo, useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import { env, parseEnv, buildExample } from '@silentcoderhi/envguard'

const schema = env.object({
  NODE_ENV: env.enum(['development', 'production', 'test']).default('development'),
  PORT: env.number().port().default(3000).describe('Server port'),
  DATABASE_URL: env.string().url().describe('Postgres connection string'),
  JWT_SECRET: env.string().min(32).secret().describe('Token signing key'),
  ENABLE_AI: env.boolean().default(false),
})

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

function App() {
  const [envText, setEnvText] = useState(validExample)
  const [tab, setTab] = useState<'validate' | 'example'>('validate')

  const result = useMemo(() => schema.safeParse(parseEnv(envText)), [envText])
  const exampleText = useMemo(() => buildExample(schema.shape), [])

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>EnvGuard playground</h1>
          <p>Paste a <code>.env</code> file and validate it against a preset schema.</p>
        </div>

        <div>
          <button type="button" onClick={() => setTab('validate')}>Validate</button>
          <button type="button" onClick={() => setTab('example')}>Generated example</button>
        </div>

        {tab === 'validate' ? (
          <>
            <div>
              <button type="button" onClick={() => setEnvText(validExample)}>Load valid example</button>
              <button type="button" onClick={() => setEnvText(invalidExample)}>Load invalid example</button>
            </div>
            <textarea
              value={envText}
              onChange={(e) => setEnvText(e.target.value)}
              rows={8}
              cols={60}
            />
            {result.success ? (
              <pre>{JSON.stringify(result.data, null, 2)}</pre>
            ) : (
              <ul>
                {Object.entries(result.errors).map(([k, m]) => (
                  <li key={k}>
                    <strong>{k}</strong>: {m}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <pre>{exampleText}</pre>
        )}
      </section>
      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App