import {randomBytes} from 'node:crypto';
import {mkdir, mkdtemp, writeFile} from 'node:fs/promises';
import {homedir} from 'node:os';
import {join} from 'node:path';

const downloadsDirectory = join(homedir(), 'Downloads');
await mkdir(downloadsDirectory, {recursive: true});

const outputDirectory = await mkdtemp(
  join(downloadsDirectory, 'autoparts-vercel-secrets-')
);
const adminPasswordPath = join(outputDirectory, 'ADMIN_PASSWORD.txt');
const adminSessionSecretPath = join(
  outputDirectory,
  'ADMIN_SESSION_SECRET.txt'
);

await Promise.all([
  writeFile(adminPasswordPath, randomBytes(24).toString('base64url'), {
    encoding: 'utf8',
    flag: 'wx',
    mode: 0o600
  }),
  writeFile(adminSessionSecretPath, randomBytes(48).toString('base64url'), {
    encoding: 'utf8',
    flag: 'wx',
    mode: 0o600
  })
]);

console.log(
  JSON.stringify(
    {
      outputDirectory,
      files: [adminPasswordPath, adminSessionSecretPath]
    },
    null,
    2
  )
);
