# Workspace Guidelines

This folder is the Explainery workspace: a thin repository whose sub-projects are the sibling folders, each its own git repository with its own `CLAUDE.md`. `explainery-core` is the public, open-source framework; the other sub-projects are stories that consume it as `link:../explainery-core`. The [README](README.md) explains membership (the GitHub topic `explainery`) and `scripts/sync.sh`.

## Start with the task

Read the target repository's instructions before changing it; read both when work crosses repositories.

- **Framework or player:** use core's [implementation and guard map](explainery-core/CLAUDE.md#find-the-implementation-and-its-guard). Scene focus and composition skills are unnecessary unless authored scenes also change.
- **Scene or narration:** start in the story repository and follow the shared [scene workflow](explainery-core/CLAUDE.md#editorial-scenes-and-session-focus), one editorial scene at a time.
- **Research or proposal:** follow the [research and review guidance](explainery-core/docs/authoring.md#research-and-review-a-film-proposal); retain evidence and editorial decisions in the story repository. Preparing an external review is not receiving one.
- **Documentation or workspace tooling:** read the relevant owning files and linked contracts; do not run scene setup or renders unless the change requires them.

## Scale

Expect about five sub-projects. Keep workspace tooling proportionate to that: no hooks or anything else that runs automatically, no fetching outside an explicit sync, and no stress tests, benchmarks, or adversarial probes.

## Where to start a session

Start inside a sub-project when the work stays in it, so its own instructions and git context apply. Start here only for work that spans sub-projects, and read each sub-project's `CLAUDE.md` before changing files in it.

HyperFrames skills and their lock belong only to [explainery-core](explainery-core/README.md#shared-authoring-skills), with `.claude/skills -> ../.agents/skills` inside core. Each story tracks one relative link, `.claude/skills -> ../../explainery-core/.agents/skills`, and no skill copies or lock files; give a new story that link. Claude Code started in a story loads the skills through it, without `--add-dir`. A session started here at the workspace root does not see them. Codex must read the shared entry and domain skills through the links in the story's instructions.

## Git across repositories

- Commit inside the sub-project the change belongs to, with `git -C <sub-project>`; this repository never holds sub-project files. A new workspace file needs an allow-list entry in [.gitignore](.gitignore).
- A change that spans repositories is one commit per repository, framework first.
- `explainery-core` is public and client-neutral: never put a client or product name, brand, or story content into its files or its commit messages.
- This workspace repository is public too: never name a story, its repository, client, or product in its files or commit messages. Point readers to each story's own README instead of listing stories here.
- A new sub-project gets its own GitHub repository with the topic `explainery`.

## Commits

Follow the shared [commit policy](explainery-core/CLAUDE.md#commit--pull-request-guidelines), including the global `F:` / `Fix:` exception for grouping small fixes. Do not push without authorization.
