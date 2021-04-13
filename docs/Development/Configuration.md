# Configuration

Botler can be configured via the environment variables below.

<!-- The underscores surrounding "Name" are there to force a certain column with. This should be done via CSS in the future -->
| <div style="width:150px">Name</div> |        Dev Default        | Prod Default | Description                                                                                                                                                                          |
| :---------------------------------: | :-----------------------: | :----------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|             `NODE_ENV`              |             -             |      -       | In what environment the bot is running. Options are `development` (default if empty or invalid) and `production`.                                                                    |
|        **DATABASE OPTIONS**         |
|         `DATABASE_USERNAME`         |        `postgres`         |      -       | Username used to authenticate with PostgreSQL.                                                                                                                                       |
|         `DATABASE_PASSWORD`         |         `botler`          |      -       | Password used to authenticate with PostgreSQL.                                                                                                                                       |
|           `DATABASE_HOST`           |        `localhost`        |     same     | Hostname of the PostgreSQL server.                                                                                                                                                   |
|           `DATABASE_PORT`           |          `5432`           |     same     | Port on which PostgreSQL is listening.                                                                                                                                               |
|         `DATABASE_DATABASE`         |        `postgres`         |     same     | Name of the database to use. If you use something else than the default you will have to manually create the database first.                                                         |
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

!!! tip "More Logger Colors"
    You can set label colors (`LOGGER_*_COLOR` variables) to any [CSS color keyword](https://www.w3.org/wiki/CSS/Properties/color/keywords)
    or even a hex color prefixed with `#` like `#008000` (green).
