# Backlog

A friction-tracking platform that blends user-submitted Slack reports, optional passive telemetry, and compliance-aware analytics into a single, auto-ticketing workflow with priority scoring and audit-ready dashboards.

Tasks are worked top-down by the build agent, one per turn where possible.
Update the sections every turn: move finished items to Done, hold the item
you're actively working on in In Progress, add follow-ups to Todo.

## Done

- [x] Initial scaffold seeded by the arena (AGENTS.md, BACKLOG.md, .gitignore, .env.example, .github/workflows/ci.yml)

## In Progress

- (empty — the next build turn picks the top open task in Todo)

## Done

- [x] Initial scaffold seeded by the arena (AGENTS.md, BACKLOG.md, .gitignore, .env.example, .github/workflows/ci.yml)
- [x] Replace the `<!-- IDEA: ... -->` placeholder at the top with a one-line summary of the actual idea
- [x] Implement the core feature from README.md — the smallest real version that works
- [x] Add a health endpoint (e.g. `GET /health` returning `{"status":"ok"}`) that proves the app runs
- [x] Add tests covering the core feature and the health endpoint
- [x] Make README.md reproduce how to run the project (commands + env vars, per .env.example)
- [x] Keep `.github/workflows/ci.yml` green on every push (it runs tests)

## In Progress

- [ ] Add follow-up tasks here as the build progresses
- [ ] Wire product deploy: on CI green, build a preview (wrangler pages / docker image) and link it in README.md so judges can curl live product, not just repo

## Todo

- [ ] Add follow-up tasks here as the build progresses
- [ ] Wire product deploy: on CI green, build a preview (wrangler pages / docker image) and link it in README.md so judges can curl live product, not just repo
- [ ] Improve error handling and retry mechanisms in the ingestion API (Failure Forensic task)
