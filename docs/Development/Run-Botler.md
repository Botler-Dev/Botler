# Run Botler

There are several different ways to run Botler. For development only running Postgres in Docker is recommended.

## Using NPM

First, install the dependencies:

```shell
npm install
```

Then because this project is written in TypeScript you will have to first compile the code to JavaScript with the following command:

```shell
npm run build:dev
# Or if the compiler should also watch for changes
npm run build:watch
```

Now there should be a `dist` folder in the root of the compiled code.
Before running Botler you will need to configure him first. See the [Configuration](Configuration.md) page for more information.

After configuring the bot run the following command to start it:

```shell
npm run start:dev
```

!!! note
    The `start:dev` command supports debuggers like VSCode's [Node debugger](https://code.visualstudio.com/docs/nodejs/nodejs-debugging#_launch-configuration-support-for-npm-and-other-tools).

## Using Docker

The bot and the database can be entirely run inside Docker using Docker Compose, which is useful for testing Docker compatibility.
There is a development configuration and a production configuration.

### Development

This configuration does not try to be as small as possible and runs the bot in development mode, allowing a debugger to connect to the node process and keeping useful tools in the image. Still, the database restarts unless manually stopped.

Start the development config by running the following command in the project root:

```shell
docker-compose -f ./docker/docker-compose.yml --env-file ./docker/.env.dev up --detach --build
```

!!! info "Parameter Meanings"
    - `--detach` will run the containers in the background and is optional. To inspect them use Docker Desktop or the Docker CLI.
    - `--build` will make docker-compose build the bot image even if it was previously built. This is needed for applying changes since the last build.
    - `--env-file ./docker/.env.dev` will set following default environment variable values:
        - `POSTGRES_PASSWORD` = `botler`

### Production

The production configuration is designed to only contain the things required to run the bot.
It first builds the bot in the same environment as the development configuration
but then copies the final build into the [`mhart/alpine-node:slim`](https://hub.docker.com/r/mhart/alpine-node/) image and starts the bot in production mode.
Additionally, the bot like the database always restarts unless manually stopped.

The command for the production configuration is just the like the development command but with `-f ./docker/production.yml` in between.

```shell
docker-compose -f ./docker/docker-compose.yml -f ./docker/production.yml --env-file ./docker/.env.dev up -d --build
```

!!! warning
    Do not use the `./docker/.env.dev` values in actual production.
    Instead, provide your own passwords and provide them with a `.env` file or inline environment variables.

## Using Docker only for Postgres

If you want to just run Postgres in Docker you can use the following command:

```shell
docker run --name botler-db -p "5432:5432" -e "POSTGRES_PASSWORD=botler" -d postgres
```

Those default values can be changed but this way you won't have to modify the default configuration of Botler.
