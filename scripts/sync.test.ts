import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { chmod, copyFile, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const script = new URL('sync.sh', import.meta.url).pathname;

// Stand-ins: gh lists FAKE_MEMBERS and clones from local bare repos; pnpm only records where it ran.
const fakeGh = `#!/bin/sh
case "$1 $2" in
  "repo list") printf '%s' "$FAKE_MEMBERS" ;;
  "repo clone") git clone --quiet "$FAKE_REMOTES/$3.git" "$4" ;;
esac
`;
const fakePnpm = `#!/bin/sh
basename "$PWD" >> "$FAKE_PNPM_LOG"
`;

/** A workspace holding the script, with bare "GitHub" repos `test/<name>` for each name, each with a package.json. */
async function sandbox(names: string[], members: string[]) {
  const base = await mkdtemp(join(tmpdir(), 'workspace-sync-'));
  const root = join(base, 'workspace');
  const env = {
    ...process.env,
    PATH: `${join(base, 'bin')}:${process.env.PATH}`,
    GIT_CONFIG_GLOBAL: join(base, 'gitconfig'),
    GIT_CONFIG_NOSYSTEM: '1',
    FAKE_MEMBERS: members.map(name => `test/${name}`).join('\n'),
    FAKE_REMOTES: join(base, 'github'),
    FAKE_PNPM_LOG: join(base, 'pnpm.log'),
  };
  const git = (cwd: string, ...args: string[]) => exec('git', args, { cwd, env });
  await mkdir(join(base, 'bin'));
  await writeFile(join(base, 'bin', 'gh'), fakeGh);
  await writeFile(join(base, 'bin', 'pnpm'), fakePnpm);
  await chmod(join(base, 'bin', 'gh'), 0o755);
  await chmod(join(base, 'bin', 'pnpm'), 0o755);
  await writeFile(env.GIT_CONFIG_GLOBAL, '[user]\n\tname = Test\n\temail = test@example.com\n[init]\n\tdefaultBranch = main\n');
  await writeFile(env.FAKE_PNPM_LOG, '');
  await mkdir(join(root, 'scripts'), { recursive: true });
  await copyFile(script, join(root, 'scripts', 'sync.sh'));
  for (const name of names) {
    const seed = join(base, 'seed', name);
    await mkdir(seed, { recursive: true });
    await writeFile(join(seed, 'package.json'), '{}');
    await git(seed, 'init', '--quiet');
    await git(seed, 'add', '.');
    await git(seed, 'commit', '--quiet', '-m', 'init');
    await git(base, 'clone', '--quiet', '--bare', seed, join(base, 'github', 'test', `${name}.git`));
  }
  const clone = (name: string) => git(root, 'clone', '--quiet', join(base, 'github', 'test', `${name}.git`), name);
  const sync = (...args: string[]) => exec('bash', [join(root, 'scripts', 'sync.sh'), ...args], { env }).then(
    ({ stdout }) => ({ code: 0, stdout }),
    (error: { code: number; stdout: string }) => ({ code: error.code, stdout: error.stdout }),
  );
  return { root, git, clone, sync, pnpmCalls: async () => (await readFile(env.FAKE_PNPM_LOG, 'utf8')).split('\n').filter(Boolean) };
}

test('a workspace in step with GitHub passes the check silently', async () => {
  const box = await sandbox(['core'], ['core']);
  await box.clone('core');
  assert.deepEqual(await box.sync('check'), { code: 0, stdout: '' });
});

test('the check reports uncommitted and unpushed work, and a repo without the topic, but clones nothing', async () => {
  const box = await sandbox(['core', 'story', 'extra'], ['core', 'story', 'missing']);
  await box.clone('core');
  await box.clone('extra');
  const core = join(box.root, 'core');
  await writeFile(join(core, 'a.txt'), 'a');
  await box.git(core, 'add', '.');
  await box.git(core, 'commit', '--quiet', '-m', 'local');
  await writeFile(join(core, 'b.txt'), 'b');
  const result = await box.sync('check');
  assert.equal(result.stdout, [
    'core: uncommitted changes',
    'core: unpushed commits',
    'extra: lacks the GitHub topic explainery; run (cd extra && gh repo edit --add-topic explainery)',
    '',
  ].join('\n'));
  assert.equal(result.code, 1);
  await assert.rejects(readFile(join(box.root, 'story', 'package.json')));
});

test('sync clones the members missing here, then installs only the new clones', async () => {
  const box = await sandbox(['core', 'story'], ['core', 'story']);
  await box.clone('core');
  const result = await box.sync();
  assert.equal(result.code, 0, result.stdout);
  assert.equal(await readFile(join(box.root, 'story', 'package.json'), 'utf8'), '{}');
  assert.deepEqual(await box.pnpmCalls(), ['story']);
});
