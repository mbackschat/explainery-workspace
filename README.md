# Explainery workspace

This folder holds everything about Explainery films in one place. [Explainery](https://github.com/mbackschat/explainery-core) is an open-source framework for narrated explainer films: animated diagrams, on-screen text, and a voice, written as plain text files and rendered locally to video and to a web page.

The work is split into separate git repositories that sit side by side in this folder:

- **`explainery-core`**, the framework. It is public and open source, and contains nothing specific to any client or film.
- **One repository per film**, a *story*, named `<name>-story`. Each story uses the framework from the folder next to it.

This repository, the workspace, contains only what ties them together: these instructions, the agent guidelines in [CLAUDE.md](CLAUDE.md), and a small script that keeps the folder complete on every computer.

## Author one scene at a time

Build each editorial scene from self-contained composition HTML files, refine it in isolation, then review how it joins its neighbors in the film. The film root combines these modules using the story's copy and timing. Follow the [modular scene authoring workflow](explainery-core/docs/authoring.md#author-one-scene-at-a-time) for the full process, including how to add a composition and wire it into the root.

From the story repository, use `pnpm scenes` to find the scene and `pnpm focus --scene <id>` to select it. Iterate with `pnpm dev` and `pnpm render:draft`. Review adjacent scenes together and preview the full film before calling the integration complete; validation and assembly always cover the whole project. [CLAUDE.md](CLAUDE.md#modular-scene-authoring) makes this the agent workflow too.

## Find scene documentation

A scene is a named editorial unit containing one or more executable HTML compositions. Start with the authoring guideline for how to describe a scene, or open a story's scene guide for its purpose, visual beats, source evidence, and composition files.

| What you need | Where to start |
| --- | --- |
| Understand the concepts, describe a scene, choose the right file to edit, and review the result | [Scene authoring guide](explainery-core/docs/authoring.md) |
| Select a scene, keep it active, preview it, or render it | [Core scene workflow](explainery-core/README.md#work-on-one-scene) |
| Find a film's scene descriptions, visual plan, and source evidence | The story's own `README.md`, which links its scene guide and scene map |

Each story's `story.yaml` owns editorial IDs, titles, grouping, composition copy, narration, and beat markers. Its `timing.json` owns composition placement and local beat seconds; scene ranges are derived from those values. Markdown descriptions record visual intent and evidence, while composition HTML owns the rendered diagrams, labels, and motion. The authoring guideline explains this division in detail.

Run scene commands from the story repository. `pnpm scenes` lists current scene IDs, titles, and ranges; `pnpm focus` reports the active target. Focus persists for preview and render, while validation, assembly, and page export remain film-wide. The links above navigate the local checkouts created by workspace sync.

## Why a workspace repository?

The framework and the stories must be separate repositories: the framework is public, while the stories are private and can contain client material. But a story only works when `explainery-core` sits right next to it, and on a new computer it is easy to forget which repositories belong together.

Workspace membership is discovered from GitHub rather than a manually maintained sync list. A repository belongs here when it carries the GitHub topic `explainery`. The script asks GitHub for those repositories and clones the missing ones, and [.gitignore](.gitignore) ignores every folder that is not the workspace's own. Adding a new story requires no sync configuration change; add documentation links here when useful.

## Set up a computer

You need `git`, the GitHub CLI `gh` (logged in with `gh auth login`), Node 22.18 or later, `pnpm`, and FFmpeg.

```bash
gh repo clone mbackschat/explainery-workspace ~/Projects/explainery
~/Projects/explainery/scripts/sync.sh
```

`scripts/sync.sh` clones every member repository that is missing on this computer and runs `pnpm install` in each new clone. Run it again later to pick up stories created on another computer.

## Before switching computers

```bash
scripts/sync.sh check
```

This lists, for each repository, uncommitted changes, unpushed commits, a branch without upstream, and a repository that lacks the topic. It is cheap: one call to GitHub and one `git status` per repository. It does not download anything, so run `git pull` in a repository before working in it on another computer.

## Start a new story

```bash
mkdir my-story && cd my-story && git init        # then build and commit it
gh repo create mbackschat/my-story --private --source . --push
gh repo edit --add-topic explainery
```

Other computers get the new story on their next `scripts/sync.sh`. Each story's own README explains how to build, preview, and render it.

## Working with AI agents

Start an agent session inside the repository you are changing, so its own `CLAUDE.md` applies. Start it here, in the workspace, only for work that spans repositories, such as a framework change that the stories must adopt. [CLAUDE.md](CLAUDE.md) has the rules for that.

HyperFrames skills are shared from [explainery-core](explainery-core/README.md#shared-authoring-skills), with one canonical `.agents/skills` directory and a `.claude/skills` symlink there. Film repositories contain no skill copies or links. From a film repository, launch Claude Code with `claude --add-dir ../explainery-core`; Codex follows the explicit shared skill paths in that film's instructions.

## Tests

```bash
node --test scripts/sync.test.ts
```

The tests run the script against a few local repositories with stand-ins for `gh` and `pnpm`, so they need neither network nor a GitHub login.
