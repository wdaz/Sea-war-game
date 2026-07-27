# Project Agent Guidelines

## Scope and context

- Inspect the relevant files and current Git state before making changes.
- Preserve user changes and avoid unrelated refactoring.
- Make reasonable assumptions only when they do not expand the requested scope.
- Report verified results; do not claim completion without running appropriate
  checks.

## Architecture

- Keep the project framework-free unless the user explicitly approves a
  dependency or framework change.
- Preserve the existing ES Module and class-based structure.
- Keep domain logic independent from DOM rendering.
- Put presentation and browser-event behavior in the UI layer.
- Prefer focused modules and behavior-based tests over monolithic files.

## Design documentation

- Store all approved design decisions in [`DESIGN.md`](DESIGN.md).
- Do not duplicate color, typography, spacing, component, responsive, or screen
  decisions in this file.
- Update `DESIGN.md` whenever an approved design decision changes.

## Testing and verification

- Run relevant unit tests after domain or game-flow changes.
- Run Playwright tests after UI behavior or interaction changes.
- Validate JSON and configuration files after editing them.
- For Pencil work, use Pencil MCP tools and verify affected layouts and
  screenshots before reporting completion.
- If a check fails, report the exact failure and distinguish pre-existing
  issues from regressions introduced by the current change.

## Security and repository hygiene

- Never commit API keys, credentials, `.env` files, or other secrets.
- Use placeholders or documented environment variables for credentials.
- Keep commits scoped and use clear commit messages.
- Do not overwrite, delete, or reset unrelated user work.
- Do not push, merge, or delete branches unless the user has authorized that
  action.

## Documentation

- Keep user-facing documentation concise and consistent with the code.
- Store implementation plans and detailed specifications under
  `docs/superpowers/`.
- Update exported design artifacts only when their source design changes.
