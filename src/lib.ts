import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as op from '@1password/op-js';
import { populate, parse } from 'dotenv';

type OpEnv = {
  item: string;
  vault?: string;
  account?: string;
};

type InjectOptions = {
  target?: Record<string, string>;
  envName?: string;
};

export const config = ({
  target = process.env as Record<string, string>,
  envName = process.env['ENVLOCKER_ENV_NAME'] ?? 'development',
}: InjectOptions = {}): void => {
  try {
    const opEnv = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), '.envlockerrc'), 'utf8'),
    ) as Record<string, OpEnv>;

    const env = opEnv[envName];

    assert(env, `Missing environment "${envName}"`);
    assert(env.item, 'Missing item');

    const item = op.item.get(env.item, {
      account: env.account,
      vault: env.vault,
    });

    assert(item.fields, 'Missing fields');

    const newEnv = Object.fromEntries(
      item.fields
        .map((field) => [field.label, field.value])
        .filter(([key, value]) => {
          return Boolean(key && value && /^[\dA-Z_]+$/.test(key));
        }),
    );

    populate(target, newEnv);
  } catch {}
};

export const envFileToItem = async ({
  filePath,
  title,
  vault,
  account,
}: {
  filePath: string;
  title: string;
  vault: string;
  account?: string;
}) => {
  const env = parse(await fs.promises.readFile(filePath, 'utf8'));

  const fieldAssignments = Object.entries(env)
    .filter(([key, value]) => Boolean(key && value && /^[\dA-Z_]+$/.test(key)))
    .map(([key, value]) => [key, 'concealed', value] as op.FieldAssignment);

  op.item.create(fieldAssignments, {
    vault,
    title,
    account,
    category: 'Server',
  });
};
