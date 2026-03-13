# Security Policy

## Reporting a Vulnerability

**Do NOT open a public GitHub issue for security vulnerabilities.**

If you discover a security vulnerability in Niotebook, please report it
responsibly by emailing:

**niotebook@gmail.com**

Include the following in your report:

- A clear description of the vulnerability
- Steps to reproduce the issue
- Affected components (e.g., API route, Convex function, runtime executor)
- Any potential impact assessment

We will acknowledge your report within **48 hours** and work with you to
understand and address the issue before any public disclosure.

## Security Posture

Niotebook employs several layers of defense:

- **TypeScript strict mode** with `no-any` enforcement in backend and test code
- **BYOK encryption** — user API keys are encrypted client-side with AES-256-GCM
  before storage
- **Rate limiting** on API endpoints to prevent abuse
- **Prompt injection defense** in the Nio AI chat pipeline
- **COOP/COEP sandbox headers** on the editor sandbox iframe for secure WASM
  execution
- **Clerk JWT authentication** with Convex identity verification

For a comprehensive security audit, see
[`docs/OSS_PRODUCTION_READINESS_AUDIT.md`](docs/OSS_PRODUCTION_READINESS_AUDIT.md).
