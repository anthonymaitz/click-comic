# ClickComic — Agent Instructions

Shared homelab dev conventions first, then project-specific detail.

<!-- baseline:start -->
## Homelab dev environment

This repo runs on the homelab dev server, not a laptop.

- **Running it:** the dev server is a container in the `personal-projects` stack
  (`~/projects/docker-compose.yml`), viewable LAN/Tailscale-only at `<host>.maitz.casa`.
  Do NOT run the dev server as a raw host process — the host firewall (nftables,
  default-deny) drops arbitrary ports; only Traefik's 80/443 are open. Restart after a
  config change: `docker compose -p personal-projects restart <service>`.
- **Package manager:** npm — pinned via `packageManager` in package.json. Don't switch
  managers or mix lockfiles.
- **Node 20** (`.nvmrc`) — matches the container runtime; install under it to keep native
  modules ABI-compatible with what the containers run.
- **Isolated tasks (`wt`):** for any non-trivial task — and always when several agents work at
  once — spin up a worktree instead of editing the main checkout. From the repo run
  `wt new <task> --agent opencode|claude`: it creates a git worktree, its own dev container, a
  live preview at `https://<task>.wt.maitz.casa`, and opens the agent in a tmux window scoped to
  that worktree. `wt ls` lists tasks, `wt rm <task>` tears one down. Parallel work never collides
  in one checkout, and every task gets a URL you can open to *see* it.
- **Secrets:** never read, print, or echo `.env` / key / token *values* — diagnose from
  variable names and metadata only. `.env` is gitignored; never stage it.
- **Remote:** GitHub-only (`origin`); PRs via `gh`.
<!-- baseline:end -->

---

# ClickComic

A comic-panel cutscene engine (web component). Consumed as a module by the `tactical-rpg`
game app (as `click-comics`) to play panel-based cutscenes.
