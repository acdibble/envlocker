import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as op from '@1password/op-js';
import { populate } from 'dotenv';

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
  envName = process.env['OP_ENV_NAME'] ?? 'development',
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
