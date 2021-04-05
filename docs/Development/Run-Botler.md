# Run Botler

There are several different ways to run Botler. For development only running Postgres in Docker is recommended.

## Using Yarn

First, install the dependencies:

```shell
yarn install
```

Then, because this project is written in TypeScript, you will have to first compile the code to JavaScript with the following command:

```shell
yarn run build:dev
# Or if the compiler should also watch for changes
yarn run build:watch
```

Now there should be a `dist` folder in the root with the compiled code.
Before running Botler you will need to configure him first. See the [Configuration](Configuration.md) page for more information.

After configuring the bot run the following command to start it:

```shell
yarn run start:dev
```

!!! note
    The `start:dev` command supports debuggers like VSCode's [Node debugger](https://code.visualstudio.com/docs/nodejs/nodejs-debugging#_launch-configuration-support-for-npm-and-other-tools).

## Using Docker

The bot and the database can be entirely run inside Docker using Docker Compose in development and production environments.
Both configurations are also additionally configurable via the following environment variables:

|        Name         |               Default               | Description                                              |
| :-----------------: | :---------------------------------: | :------------------------------------------------------- |
| `POSTGRES_PASSWORD` | `botler` in dev <br /> none in prod | Password of the `postgres` Postgres user used by the bot |
|   `POSTGRES_PORT`   |               `5432`                | Port the database will be mounted to                     |

!!! note "Yarn usage"
    The examples here all use `yarn [script name]` to make the commands shorter and easier to use/remember. If you want to use the `docker-compose` command directly, check the `scripts` property in `package.json` to see the contents of those scripts.

### Development

This configuration does not try to be as small as possible and runs the bot in development mode, allowing a debugger to connect to the node process and keeping useful tools in the image. Still, the database restarts unless manually stopped.

Start the development config by running the following command in the project root:

```shell
yarn docker:dev up --detach --build
```

This command script calls `docker-compose` with the correct compose files which set the Postgres password to `botler` by default.

!!! info "Parameter Meanings"
    - `--detach` will run the containers in the background and is optional. To inspect them use Docker Desktop or the Docker CLI.
    - `--build` will make docker-compose build the bot image even if it was previously built. This is needed for applying changes since the last build.

### Production

The production configuration is designed to only contain the things required to run the bot.
It first builds the bot in the same environment as the development configuration
but then copies the final build into the [`mhart/alpine-node:slim`](https://hub.docker.com/r/mhart/alpine-node/) image and starts the bot in production mode.
Additionally, the bot like the database always restarts unless manually stopped.

The command for the production configuration is just like the development command but needs some environment variables manually provided (Check out the [Docker Compose Docs](https://docs.docker.com/compose/environment-variables/)) and has a different script name.

```shell
yarn docker:prod up --detach --build
```

## Using Docker only for Postgres

If you want to just run Postgres in Docker there are some commands provided to only managing the `postgres` service:

```shell
# Start Postgres
yarn postgres:start

# Start Postgres and detach from command
yarn postgres:deploy

# Stop Postgres
yarn postgres:stop

# Stop Postgres and delete all data
yarn postgres:reset
```

All those commands use the development configuration and are configurable via the same environment variables.
