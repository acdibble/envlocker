## envlocker

Manage environment variables with 1Password. It is a wrapper around
[the wrapper](https://github.com/1Password/op-js) for the
[1password-cli](https://developer.1password.com/docs/cli/get-started/)
that allows you to store environment variables in 1Password and load them in a
way that is comparable to (and uses)
[dotenv](https://github.com/motdotla/dotenv).

### Installation

Add the package using your favorite package manager:

```bash
$ pnpm add envlocker
```

### Usage

You will need to create a `.envlockerrc` file at the root of your project:

```jsonc
{
  "development": {
    "item": "Cool app.jpeg", // required
    "vault": "envs", // optional
    "account": "my.1password.com" // optional
  },
  "production": {
    "item": "jtm2ddhxqwx8orfgfjxknzp5re" // can also be the UUID of the item
  }
}
```

The `development` and `production` keys are the names of the environments you
want to use. You can add as many different environments with different names as
you want. The default environment is `development`, but this can be configured
with the `ENVLOCKER_ENV_NAME` environment variable.

The `vault` key is optional but is recommended to reduce the number of
API calls to 1Password. The `account` key is also optional and defaults to
whichever account `op` is currently logged into.

The `account` value can be any of the described by the 1password CLI
[documentation](https://github.com/motdotla/dotenv). The `item` and `vault`
values and the accepted formats are described
[here](https://developer.1password.com/docs/cli/reference/management-commands/item)
in the 1password CLI docs.

Once you have created the `.envlockerrc` file, you can load the environment
variables in a few different ways using `envlocker`.

Command line:

```bash
$ node -r envlocker/config ./index.js
```

Programmatically with `import`:

```ts
import 'envlocker/config';
```

or

```ts
import { config } from 'envlocker';
config();
```

Programmatically with `require`:

```ts
require('envlocker').config();
```

#### 1password configuration

To configure the environment variables within 1password, you will need to create
a new item and add the desired variables as individual fields within the new
item. Fields with empty keys or values will be ignored. Fields are also ignored
if they do not match the pattern `^[A-Z0-9_]+$`.

### API

#### `config`

Injects the environment variables into `process.env`. The environment name can
also be passed as an argument to this function.

```ts
import { config } from 'envlocker';

config({ envName: 'staging' });
```

### Limitations

This package does not (yet) support 1password Connect Server access.
