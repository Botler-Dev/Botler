# Configuration

Botler receives its configuration through two ways:

1. Environment variables for configuring
    - Settings needed prior to a database connection
    - Settings specific to an environment
    - Settings that should be easily accessible during development
2. Settings stored in the database
    - For settings changeable at runtime
    - All remaining configurations

As a bare minimum the bot needs a database connection provided by environment variables and a Discord token provided by the database or in development alternatively by the `DISCORD_TOKEN` environment variable.

## Database Settings

The settings stored in the database are all changeable at runtime unless explicitly specified and are separated between global and module specific settings each stored in different tables. As this document covers core settings please refer to the respective module documentation for module specific settings. Below is a list of all global database-provided settings which are stored in the `GlobalSettings` table.

| <div style="width:120px">Name</div> | Default  | Description                                                                                                                                                        |
| :---------------------------------: | :------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|           `discordToken`            |    -     | The Discord token used to connect to Discord. Changing this value at runtime will cause the bot to exit. Depending on the environment this means a simple restart. |
|           `colorDefault`            | 7506394  | Default color for message embed.                                                                                                                                   |
|             `colorGood`             | 3461464  | Color for message embed with a good meaning.                                                                                                                       |
|             `colorBad`              | 16718602 | Color for message embed with a bad meaning.                                                                                                                        |
|             `colorWarn`             | 16745728 | Color for embed messages to draw attention or a warn.                                                                                                              |
|           `cleanInterval`           |  600000  | Interval in milliseconds in which the database gets cleaned.                                                                                                       |
|           `masterUserIds`           |    -     | List of user IDs with admin privileges in the bot.                                                                                                                 |

## Environment variables

Depending on how you run Botler, there are different available environment variables to change each building on top of the other.

### Node Application

The node application itself applies certain defaults to make it easier during development.

| <div style="width:150px">Name</div> |        Dev Default        | Prod Default | Description                                                                                                                                                                          |
| :---------------------------------: | :-----------------------: | :----------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|             `NODE_ENV`              |             -             |      -       | In what environment the bot is running. Options are `development` (default if empty or invalid) and `production`.                                                                    |
|        **DATABASE OPTIONS**         |
|         `DATABASE_USERNAME`         |        `postgres`         |      -       | Username used to authenticate with PostgreSQL.                                                                                                                                       |
|         `DATABASE_PASSWORD`         |         `botler`          |      -       | Password used to authenticate with PostgreSQL.                                                                                                                                       |
|           `DATABASE_HOST`           |        `localhost`        |     same     | Hostname of the PostgreSQL server.                                                                                                                                                   |
|           `DATABASE_PORT`           |          `5432`           |     same     | Port on which PostgreSQL is listening.                                                                                                                                               |
|         `DATABASE_DATABASE`         |        `postgres`         |     same     | Name of the database to use.                                                                                                                                                         |
|           `DATABASE_ARGS`           |             -             |      -       | Connection arguments like `schema=public`. See [Prisma docs](https://www.prisma.io/docs/concepts/database-connectors/postgresql#arguments) for available arguments.                  |
|           `DATABASE_URL`            |             -             |      -       | Complete connection URL that overwrites all database options above. See [Prisma docs](https://www.prisma.io/docs/concepts/database-connectors/postgresql#connection-url) for schema. |
|         **LOGGER OPTIONS**          |
|        `LOGGER_STAMP_LABEL`         |          `true`           |     same     | If the timestamp metadata should be added                                                                                                                                            |
|        `LOGGER_SCOPE_LABEL`         |          `true`           |     same     | If the scope metadata should be added                                                                                                                                                |
|        `LOGGER_LEVEL_LABEL`         |          `true`           |     same     | If the log level metadata should be added                                                                                                                                            |
|        `LOGGER_STAMP_COLOR`         |          `gray`           |     same     | Color of the timestamp label                                                                                                                                                         |
|        `LOGGER_SCOPE_COLOR`         |         `yellow`          |     same     | Color of the scope label                                                                                                                                                             |
|        `LOGGER_LEVEL_COLOR`         |          `cyan`           |     same     | Color of the log level label                                                                                                                                                         |
|        `LOGGER_LABEL_PREFIX`        |            `[`            |     same     | Prefix of metadata label                                                                                                                                                             |
|        `LOGGER_LABEL_SUFFIX`        |            `]`            |     same     | Suffix of metadata label                                                                                                                                                             |
|         `LOGGER_STAMP_PAD`          |            `0`            |     same     | Minimum length of characters for timestamp label. Will be padded with spaces.                                                                                                        |
|         `LOGGER_SCOPE_PAD`          |           `10`            |     same     | Minimum length of characters for the scope label. Will be padded with spaces.                                                                                                        |
|        `LOGGER_STAMP_FORMAT`        | `YYYY/MM/DD HH:mm:ss.sss` |     same     | Format of timestamp label. See the [Day.js docs](https://day.js.org/docs/en/display/format) for more information.                                                                    |
|        **DEBUGGING OPTIONS**        |
|        `PRISMA_LOG_QUERIES`         |          `false`          |     same     | If all database queries performed via Prisma should be logged.                                                                                                                       |
|           `DISCORD_TOKEN`           |             -             |      -       | Discord token to generate a GlobalSettings entry with non exists. Will be ignored in production.                                                                                     |

!!! tip "More Logger Colors"
    You can set label colors (`LOGGER_*_COLOR` variables) to any [CSS color keyword](https://www.w3.org/wiki/CSS/Properties/color/keywords)
    or even a hex color prefixed with `#` like `#008000` (green).

### Docker Container

The bot can be run inside a Docker container using the provided Docker images.

|    Name    |  Dev Default  | Prod Default |
| :--------: | :-----------: | :----------: |
| `NODE_ENV` | `development` | `production` |

!!! attention
    When using the default entry point of the provided images, the `DATABASE_URL` gets automatically set if not explicitly overwritten. This is to ease the use of the prisma client inside of the containers.

### Docker Compose

The bot, the database, or both can be run using the provided Docker Compose file. The database uses the same `DATABASE_*` environment variables to configure itself.

| <div style="width:170px">Name</div> | Dev Default | Prod Default | Description                                                                                                                                      |
| :---------------------------------: | :---------: | :----------: | :----------------------------------------------------------------------------------------------------------------------------------------------- |
|      `EXTERNAL_DATABASE_PORT`       |   `5432`    |    `5432`    | Port on which the database will be exposed. Does not effect what port the `bot` service needs to use meaning `DATABASE_PORT` can left untouched. |
|           `DATABASE_HOST`           |    `db`     |     same     |
