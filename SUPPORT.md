# EnvGuard Support

Thanks for using EnvGuard. This page explains where to get help, how to report a problem, and how to help improve or share the project. For the complete installation, schema, and command reference, see the [README](README.md).

## Get started

Install EnvGuard in your app:

```bash
npm install @silentcoderhi/envguard
```

Create an `env.config.ts` that exports an `envSchema`, then use that schema in your application and run the CLI from your project directory:

```bash
npx envguard check
npx envguard example
npx envguard scan
npx envguard doctor
```

See the [README quick start](README.md#quick-start) for a working schema example and the [CLI reference](README.md#cli-reference) for options.

## Before asking for help

1. Check the README and the known [limitations](README.md#limitations).
2. Make sure your terminal is in the project directory containing `env.config.ts`.
3. Run `npx envguard --help` and confirm your Node.js version with `node --version` (EnvGuard requires Node.js 18 or newer).
4. Copy the full error message and note which command you ran.
5. Try to reproduce the issue with the smallest possible schema and example project.

A successful `scan` means it didn't find undeclared names in the files it scanned; it does not type-check your application. `check` validates values from `.env` or the system environment. See the README for exact behavior.

## Report a bug or request a feature

Open an issue at [GitHub Issues](https://github.com/SilentCoder-HI/envguard/issues). For a useful report, include:

- What you expected and what happened instead.
- The exact command and its exit code.
- EnvGuard version, Node.js version, operating system, and package manager.
- A minimal, sanitized schema and reproduction steps, if possible.

**Never post real `.env` contents, passwords, API keys, tokens, private keys, or production logs containing secrets.** Replace sensitive values with fake placeholders before sharing. If you think you found a security vulnerability, do not publish exploit details in a public issue; contact the project maintainer privately through the repository profile first.

## Contribute a fix

Small, focused pull requests are welcome. A typical contribution flow is:

1. Fork the repository and create a branch for your change.
2. Install dependencies with `npm install`.
3. Make the change and add or update tests for behavior changes.
4. Run the checks before opening a pull request:

   ```bash
   npm test
   npm run typecheck
   npm run build
   ```

5. Open a pull request describing the problem, the solution, and the checks you ran.

Keep the core library browser-safe and dependency-light: `src/core/` and `src/index.ts` should not import CLI code or Node-only APIs. CLI-specific functionality belongs under `src/cli/`. If a change affects documented behavior, update the README as well.

Do not commit `.env` files, credentials, generated build output, or unrelated formatting changes. The project maintainer handles releases and npm publishing; contributors should not publish package releases themselves.

## Help others discover EnvGuard

You can support the project by sharing the [README](README.md) or the [npm package page](https://www.npmjs.com/package/@silentcoderhi/envguard), trying it in a sample project, and reporting clear bug reports or contributing improvements. When describing it, be precise: EnvGuard validates environment values against a schema, generates `.env.example`, searches common source patterns for undeclared environment-variable names, and checks for several common safety issues. It does not replace TypeScript, load `.env` files into an application, or guarantee that a secret is safe in every setup.

## Project links

- [README and usage guide](README.md)
- [GitHub repository](https://github.com/SilentCoder-HI/envguard)
- [Bug reports and feature requests](https://github.com/SilentCoder-HI/envguard/issues)
- [npm package](https://www.npmjs.com/package/@silentcoderhi/envguard)
