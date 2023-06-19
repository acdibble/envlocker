import * as fs from 'fs';
import { Item, item } from '@1password/op-js';
import { config, createItemFromEnvFile } from '../lib';

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  promises: {
    readFile: jest.fn(),
  },
}));
jest.mock('@1password/op-js');

describe(config, () => {
  const env = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...env };
    jest.spyOn(process, 'cwd').mockReturnValue('/path/to/cwd');
  });

  afterEach(() => {
    process.env = env;
  });

  it.each([
    ['development', { development: { item: 'development-item' } }],
    [undefined, { development: { item: 'development-item' } }],
    ['production', { production: { item: 'production-item' } }],
    [
      'development',
      { development: { item: 'development-item', vault: 'vault-name' } },
    ],
    [
      'development',
      { development: { item: 'development-item', account: 'account-name' } },
    ],
    [
      'development',
      {
        development: {
          item: 'development-item',
          vault: 'vault-name',
          account: 'account-name',
        },
      },
    ],
    ['arbitrary', { arbitrary: { item: 'arbitrary-item' } }],
    ['arbitrary', {}],
    ['arbitrary', { development: { item: 'development-item' } }],
  ])('injects environment variables', (envName, cfg) => {
    const readFileSyncSpy = jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue(JSON.stringify(cfg));

    const getItemSpy = jest.spyOn(item, 'get').mockReturnValue({
      fields: [
        { label: 'FOO', value: 'bar' },
        { label: 'baz', value: 'qux' },
        { label: 'BAZ', value: 'QUX' },
      ],
    } as Item);

    const target = {};
    config({ target, envName });
    expect(readFileSyncSpy).toHaveBeenCalledWith(
      '/path/to/cwd/.envlockerrc',
      'utf8',
    );
    expect(target).toMatchSnapshot();
    expect(getItemSpy.mock.calls).toMatchSnapshot();
  });

  it('filters out variables and values', () => {
    const readFileSyncSpy = jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue(
        JSON.stringify({ development: { item: 'development-item' } }),
      );
    const target = {};

    jest.spyOn(item, 'get').mockReturnValue({
      fields: [
        { label: '', value: 'bar' },
        { label: 'baz', value: '' },
        { label: 'HAS SOME SPACES', value: 'QUX' },
      ],
    } as Item);

    config({ target });
    expect(readFileSyncSpy).toHaveBeenCalled();
    expect(target).toStrictEqual({});
  });

  it('does not throw if the config file is missing', () => {
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error();
    });
    const getItemSpy = jest.spyOn(item, 'get');
    const target = {};
    config({ target });
    expect(target).toStrictEqual({});
    expect(getItemSpy).not.toHaveBeenCalled();
  });

  it('does not throw if the config file is not JSON', () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue('not json');
    const getItemSpy = jest.spyOn(item, 'get');
    const target = {};
    config({ target });
    expect(target).toStrictEqual({});
    expect(getItemSpy).not.toHaveBeenCalled();
  });

  it('does not throw if the env is missing from the config', () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue('{}');
    const getItemSpy = jest.spyOn(item, 'get');
    const target = {};
    config({ target });
    expect(target).toStrictEqual({});
    expect(getItemSpy).not.toHaveBeenCalled();
  });

  it('does not throw if `item` is missing from the config', () => {
    jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue(JSON.stringify({ development: {} }));
    const getItemSpy = jest.spyOn(item, 'get');
    const target = {};
    config({ target });
    expect(target).toStrictEqual({});
    expect(getItemSpy).not.toHaveBeenCalled();
  });

  it('does not throw if `item.fields` is missing', () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue(
      JSON.stringify({
        development: { item: 'development-item' },
      }),
    );
    const getItemSpy = jest.spyOn(item, 'get').mockReturnValue({} as Item);
    const target = {};
    config({ target });
    expect(target).toStrictEqual({});
    expect(getItemSpy).toHaveBeenCalled();
  });

  it('uses the ENVLOCKER_ENV_NAME environment variable', () => {
    process.env['ENVLOCKER_ENV_NAME'] = 'staging';
    jest.spyOn(fs, 'readFileSync').mockReturnValue(
      JSON.stringify({
        staging: { item: 'the staging item name' },
      }),
    );
    const getItemSpy = jest.spyOn(item, 'get').mockReturnValue({} as Item);

    const target = {};
    config({ target });
    expect(getItemSpy.mock.calls).toMatchSnapshot();
  });
});

describe(createItemFromEnvFile, () => {
  it.each([
    {},
    { account: 'my.1password.com' },
    { category: 'Login' },
    { account: 'my.1password.com', category: 'Login' },
  ] as const)(
    'creates an item in 1password from a .env file',
    async (options) => {
      jest.spyOn(fs.promises, 'readFile').mockResolvedValue(`FOO=bar
baz = qux
BAZ= QUX
`);

      const createItemSpy = jest
        .spyOn(item, 'create')
        .mockImplementation(() => undefined as any);

      await createItemFromEnvFile({
        filePath: '/path/to/.env',
        title: 'new-app',
        vault: 'env-vars',
        ...options,
      });

      expect(createItemSpy.mock.calls).toMatchSnapshot();
    },
  );
});
