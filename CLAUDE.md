# Workspace Guidelines

This folder is the Explainery workspace: a thin repository whose sub-projects are the sibling folders, each its own git repository with its own `CLAUDE.md`. `explainery-core` is the public, open-source framework; the other sub-projects are stories that consume it as `link:../explainery-core`. The [README](README.md) explains membership (the GitHub topic `explainery`) and `scripts/sync.sh`.

## Modular scene authoring

Author one editorial scene at a time, following the [scene authoring guide](explainery-core/docs/authoring.md#author-one-scene-at-a-time). Start the work inside its story repository and read that repository's instructions.

- Select the scene with `focus` and keep edits, preview, and draft render scoped to it.
- Build it from self-contained composition HTML files with local beats and timelines; share assets and themes explicitly.
- Add new compositions to the story and the film root, then update timing and assemble the existing hosts.
- Verify the scene in isolation, its joins with adjacent scenes, and its integration in the full film. Validation and assembly remain film-wide.

## Scale

Expect about five sub-projects. Keep workspace tooling proportionate to that: no hooks or anything else that runs automatically, no fetching outside an explicit sync, and no stress tests, benchmarks, or adversarial probes.

## Where to start a session

Start inside a sub-project when the work stays in it, so its own instructions and git context apply. Start here only for work that spans sub-projects, and read each sub-project's `CLAUDE.md` before changing files in it.

HyperFrames skills and their lock belong only to [explainery-core](explainery-core/README.md#shared-authoring-skills), with `.claude/skills -> ../.agents/skills` inside core. Do not add skill copies or symlinks to stories. Start Claude Code in a story with `claude --add-dir ../explainery-core`; Codex must read the shared entry and domain skills through the links in the story's instructions.

## Git across repositories

- Commit inside the sub-project the change belongs to, with `git -C <sub-project>`; this repository never holds sub-project files. A new workspace file needs an allow-list entry in [.gitignore](.gitignore).
- A change that spans repositories is one commit per repository, framework first.
- `explainery-core` is public and client-neutral: never put a client or product name, brand, or story content into its files or its commit messages.
- This workspace repository is public too: never name a story, its repository, client, or product in its files or commit messages. Point readers to each story's own README instead of listing stories here.
- A new sub-project gets its own GitHub repository with the topic `explainery`.

## Commits

Follow Conventional Commits. Commit without asking after each completed feature once its tests pass. Do not push without authorization.
