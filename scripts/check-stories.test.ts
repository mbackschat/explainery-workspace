import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { chmod, copyFile, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const script = new URL('check-stories.sh', import.meta.url).pathname;

// Stand-in pnpm: records "<dir> <script>" and fails the scripts a story lists in its FAIL file.
const fakePnpm = `#!/bin/sh
for last; do :; done
echo "$(basename "$PWD") $last" >> "$FAKE_PNPM_LOG"
[ -f FAIL ] && grep -qx "$last" FAIL && exit 1
exit 0
`;

/** A workspace with the script and one folder per entry; `scripts` lists the story's package.json scripts. */
async function sandbox(folders: Record<string, { dependsOnCore: boolean; scripts: string[]; fail?: string[] }>) {
  const base = await mkdtemp(join(tmpdir(), 'workspace-check-'));
  const root = join(base, 'workspace');
  const log = join(base, 'pnpm.log');
  await mkdir(join(base, 'bin'));
  await writeFile(join(base, 'bin', 'pnpm'), fakePnpm);
  await chmod(join(base, 'bin', 'pnpm'), 0o755);
  await writeFile(log, '');
  await mkdir(join(root, 'scripts'), { recursive: true });
  await copyFile(script, join(root, 'scripts', 'check-stories.sh'));
  for (const [name, folder] of Object.entries(folders)) {
    await mkdir(join(root, name));
    // The framework's own manifest names it, which must not make it a story.
    const manifest = { name, scripts: Object.fromEntries(folder.scripts.map(entry => [entry, 'true'])), dependencies: folder.dependsOnCore ? { 'explainery-core': 'link:../explainery-core' } : {} };
    await writeFile(join(root, name, 'package.json'), JSON.stringify(manifest));
    if (folder.fail) await writeFile(join(root, name, 'FAIL'), folder.fail.join('\n') + '\n');
  }
  const env = { ...process.env, PATH: `${join(base, 'bin')}:${process.env.PATH}`, FAKE_PNPM_LOG: log };
  const run = () => exec('bash', [join(root, 'scripts', 'check-stories.sh')], { env }).then(
    ({ stdout }) => ({ code: 0, stdout }),
    (error: { code: number; stdout: string }) => ({ code: error.code, stdout: error.stdout }),
  );
  return { run, calls: async () => (await readFile(log, 'utf8')).split('\n').filter(Boolean) };
}

test('every story that depends on the framework is validated and tested; the framework and other folders are not', async () => {
  const { run, calls } = await sandbox({
    'explainery-core': { dependsOnCore: false, scripts: ['test'] },
    'story-a': { dependsOnCore: true, scripts: ['validate', 'test'] },
    'story-b': { dependsOnCore: true, scripts: ['test'] },
    unrelated: { dependsOnCore: false, scripts: ['test'] },
  });
  const result = await run();
  assert.equal(result.code, 0);
  assert.deepEqual(await calls(), ['story-a validate', 'story-a test', 'story-b test']);
  assert.match(result.stdout, /^story-a: ok$/m);
  assert.match(result.stdout, /^story-b: ok$/m);
});

test('a failing story is reported and fails the run, and the other stories still run', async () => {
  const { run, calls } = await sandbox({
    'story-a': { dependsOnCore: true, scripts: ['validate', 'test'], fail: ['validate'] },
    'story-b': { dependsOnCore: true, scripts: ['validate', 'test'] },
  });
  const result = await run();
  assert.equal(result.code, 1);
  assert.deepEqual(await calls(), ['story-a validate', 'story-a test', 'story-b validate', 'story-b test']);
  assert.match(result.stdout, /^story-a: validate failed$/m);
  assert.match(result.stdout, /^story-b: ok$/m);
});
