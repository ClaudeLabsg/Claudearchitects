# Save points

Known-good snapshots of the live site, taken before rounds of major change so there
is always something to fall back to. Each one is a branch pinned to a commit that was
verified running in production, plus the Vercel deployment that was serving it.

Save points are **branches, not tags**: this repo is worked on from Claude Code cloud
sessions, whose proxy refuses tag writes (403 on `refs/tags/*`, over both git and the
API). A branch pinned to a commit restores identically, so nothing is lost by it. Tags
can still be pushed from a local machine if anyone wants them.

| Version | Commit | Branch | Vercel deployment | Taken |
|---|---|---|---|---|
| V2 | `9d29909` | [`v2`](https://github.com/ClaudeLabsg/Claudearchitects/tree/v2) | `dpl_BXwGykCScpcH45N4Ahysi4wZxEjx` | 2026-11-06 |
| V1 | `aacf1e2` | [`v1`](https://github.com/ClaudeLabsg/Claudearchitects/tree/v1) | `dpl_3fDcm3cEjbuR4y17aiPMkuPWNFdJ` | 2026-10-07 |

`main` moves on after a save point is taken, so a save point branch is normally behind
it. That is the point of them; do not merge `main` into one or push to one.

## Restoring

Two independent routes, so a save point survives one of them being unavailable.

**Vercel instant rollback** — fastest, and the right choice for an outage. Roll back to
the deployment ID above from the project's Deployments tab. It takes seconds, needs no
build, and does not touch git, so the code and the live site disagree until you also
restore the code.

**Git** — rebuilds from source and brings the two back into agreement:

```sh
git fetch origin v2
git checkout -B main origin/v2
git push --force-with-lease origin main
```

Force-pushing `main` discards whatever came after the save point, so prefer branching
off the save point and merging forward if any of that work is worth keeping.

## Adding one

Take a save point from a commit that is actually live, never from local work:

```sh
git fetch origin main
git branch v3 origin/main
git push -u origin refs/heads/v3:refs/heads/v3
```

Then record it in the table above with the production deployment ID that was serving
that commit, and check the commit in the deployment's metadata matches the one you
pinned — a deploy can lag a push.
