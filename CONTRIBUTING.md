# Contributing to SUPRA Writer

Thank you for helping create a simple and accessible free word processor.

## Development

1. Fork the repository or create a branch.
2. Open `index.html` in a browser. Run it with a local server when testing PWA/offline caching (service workers do not register from `file:` URLs).
3. For browser tests, use Node 22+, `npm install`, `npx playwright install chromium`, and `npm test`.
4. Make a small change and test document editing, font presets, DOCX export, and mobile layouts.
5. Open a pull request explaining the change, tests, user impact and any license implications.

## Design rules

- Keep settings in plain English, with visible feedback and keyboard accessibility.
- Prefer one-click looks that bundle related formatting options.
- New features must not break offline editing or document export.
- Do not add tracking, telemetry, uploads, or third-party services without explicit opt-in and documentation.
- Avoid including fonts or assets without checking redistribution licenses; font names alone are not font binaries.
- Report security flaws privately where possible; see [SECURITY.md](SECURITY.md).

See [the roadmap](docs/ROADMAP.md) and the issue templates for tasks to work on.
