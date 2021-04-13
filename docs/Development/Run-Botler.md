# Run Botler

There are two main different ways to run Botler: in a [Docker container](#using-docker) or natively [using Yarn](#using-yarn). For production running everything in Docker and for development only running the database in Docker is recommended.

## Using Yarn

1. Install all dependencies:

    ```shell
    yarn install
    ```

2. Build the Prisma client:

    ```shell
    yarn prisma generate
    ```

    !!! note
        This needs to be done each time you change a `.prisma` file. See ***[TBD docs]***

3. Compile the project from TypeScript to JavaScript:

    ```shell
    yarn run build:dev
    # Or if the compiler should also watch for changes
    yarn run build:watch
    ```

    Now there should be a `dist` folder in the root with the compiled code.

4. Configure Botler to your liking. See the [Configuration](Configuration.md) page for more information.
5. Finally, run the following command to start it:

    ```shell
    yarn run start:dev
    ```

    !!! note
        The `start:dev` command supports debuggers like VSCode's [Node debugger](https://code.visualstudio.com/docs/nodejs/nodejs-debugging#_launch-configuration-support-for-npm-and-other-tools).

## Using Docker

The bot and the database can be entirely run inside Docker using Docker Compose in development and production environments.

Both configurations can be configured using the same environment variables listed on the [Configuration page](Configuration.md) with some changes to the default configuration:

|      Name       |    Dev Default    | Prod Default |
| :-------------: | :---------------: | :----------: |
| `DATABASE_HOST` | `botler-database` |     same     |
|   `NODE_ENV`    |   `development`   | `production` |

!!! attention "The `.env` file"
    The `docker-compose` command automatically consumes `.env` files in its working directory. Depending on its content it could accidentally set `DATABASE_HOST` to not point at the database container.

!!! note "Yarn usage"
    The examples here all use `yarn [script name]` to make the commands shorter and easier to use/remember. If you want to use the `docker-compose` command directly, check the `scripts` property in `package.json` to see the contents of those scripts.

### Development

This configuration does not try to be as small as possible and runs the bot in development mode, allowing a debugger to connect to the node process and keeping useful tools in the image. Still, the database restarts unless manually stopped.

Start the development config by running the following command in the project root:

```shell
yarn docker:dev up --detach --build
```

This command script calls `docker-compose` with the correct compose files which set the PostgreSQL password to `botler` by default.

!!! info "Parameter Meanings"
    - `--detach` will run the containers in the background and is optional. To inspect them use Docker Desktop or the Docker CLI.
    - `--build` will make docker-compose build the bot image even if it was previously built. This is needed for applying changes since the last build.

### Production

The production configuration is designed to only contain the things required to run the bot.
It first builds the bot in the same environment as the development configuration
but then copies the final build into the [`mhart/alpine-node:slim`](https://hub.docker.com/r/mhart/alpine-node/) image and starts the bot in production mode.
Additionally, the bot like the database always restarts unless manually stopped.

The command for the production configuration is just like the development command but needs some environment variables manually provided (Check out the [Docker Compose Docs](https://docs.docker.com/compose/environment-variables/) to see how) and has a different script name.

```shell
yarn docker:prod up --detach --build
```

## Using Docker only for the database

If you want to just run the database in Docker there are some commands provided to only managing the `db` service:

```shell
# Start the database
yarn db:start

# Start the database and detach from command
yarn db:deploy

# Stop the database
yarn db:stop

# Stop the database and delete all data
yarn db:reset
```

All those commands use the development configuration and are configurable via the same environment variables.
