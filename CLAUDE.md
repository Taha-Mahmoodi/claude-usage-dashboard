# Claude usage dashboard

Personal dashboard tracking Claude Code token usage across devices on a shared Max20x plan.
See `brief.md`, `implementation.md`, `handling-protocols.md`, `github-workflow.md`, and the
design spec under `docs/superpowers/specs/` for the full picture. `STATE.md` is the session tracker.

## Deploy Configuration (configured by /setup-deploy)
- Platform: VPS (Ubuntu 24.04, nginx via aaPanel) at `147.93.138.77`, SSH alias `lucifers-vps` (root)
- Production URL: https://cos.piiix.org
- Serving model: static export (`next build` with `output: 'export'`) → nginx serves `out/`
- Webroot: `/www/wwwroot/cos.piiix.org`  ·  vhost: `/www/server/panel/vhost/nginx/cos.piiix.org.conf`
- TLS: Let's Encrypt via acme.sh (auto-renew), cert at `/www/server/panel/vhost/cert/cos.piiix.org/`
- Deploy command: `./scripts/deploy.sh` (builds + rsyncs `out/` + verifies 200)
- Health check: `curl -sf https://cos.piiix.org/`
- Coexists with the live `lucifersdiary.com` site — deploys are additive, never touch it.

### Data flow
The site is fully static; it fetches usage data client-side from the public data repo
(`raw.githubusercontent.com/Taha-Mahmoodi/claude-usage-data/main/`). It shows an empty
state until the collector hook (`plugin/`, see its README) runs on a device and pushes data.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
