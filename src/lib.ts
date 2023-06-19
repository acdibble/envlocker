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

type ConfigOptions = {
  /** the target into which the new env variables should be injected, default is `process.env` */
  target?: Record<string, string>;
  /** the name of the environment to load, default is `process.env['ENVLOCKER_ENV_NAME'] ?? 'development'` */
  envName?: string;
};

/**
 * Inject the environment variables from 1password into the current process
 *
 * With `import`:
 * @example
 * ```ts
 * import 'envlocker/config';
 * ```
 *
 * @example
 * ```ts
 * import { config } from 'envlocker';
 * config({ envName: 'staging' });
 * ```
 *
 * or with `require`:
 * @example
 * ```ts
 * require('envlocker').config();
 * ```
 *
 * @param options
 */
export const config = ({
  target = process.env as Record<string, string>,
  envName = process.env['ENVLOCKER_ENV_NAME'] ?? 'development',
}: ConfigOptions = {}): void => {
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

type CreateItemFromEnvFileOptions = {
  /** the path to the .env file */
  filePath: string;
  /** the title for the item in 1password */
  title: string;
  /** the vault to house th enew item */
  vault: string;
  /** an optional account for 1password */
  account?: string;
  /** an optional category for 1password, defaults to `"Server"` */
  category?: op.InputCategory;
};

/**
 * Insert an existing .env file into 1password
 * @returns the newly created item
 *
 * @example
 * ```ts
 * import { createItemFromEnvFile } from 'envlocker';
 *
 * await createItemFromEnvFile({
 *   filePath: path.join(process.cwd(), '.env'),
 *   title: 'My App',
 *   vault: 'My Vault',
 * });
 * ```
 *
 */
export const createItemFromEnvFile = async ({
  filePath,
  title,
  vault,
  account,
  category = 'Server',
}: CreateItemFromEnvFileOptions): Promise<op.Item> => {
  const env = parse(await fs.promises.readFile(filePath, 'utf8'));

  const fieldAssignments = Object.entries(env)
    .filter(([key, value]) => Boolean(key && value && /^[\dA-Z_]+$/.test(key)))
    .map(([key, value]) => [key, 'concealed', value] as op.FieldAssignment);

  return op.item.create(fieldAssignments, { vault, title, account, category });
};
