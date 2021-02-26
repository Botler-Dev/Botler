# Configuration

Botler can be configured via the environment variables below.

<!-- The underscores surrounding "Name" are there to force a certain column with. This should be done via CSS in the future -->
| _________Name_________ |        Dev Default        | Prod Default | Description                                                                                                                   |
| :--------------------: | :-----------------------: | :----------: | :---------------------------------------------------------------------------------------------------------------------------- |
|    DATABASE OPTIONS    |
|     `TYPEORM_HOST`     |        `localhost`        |     same     | Hostname of the Postgres server.                                                                                              |
|     `TYPEORM_PORT`     |          `5432`           |     same     | Port on which Postgres is listening.                                                                                          |
|   `TYPEORM_DATABASE`   |        `postgres`         |     same     | Name of the database to use. If you use something else than the default you will have to manually create the database first.  |
| `TYPEORM_SYNCHRONIZE`  |          `true`           |   `false`    | If database schema should be synced to the local schema (not with migrations). In production, the value is forced to `false`. |
|   `TYPEORM_USERNAME`   |        `postgres`         |      -       | Username used to authenticate with Postgres.                                                                                  |
|   `TYPEORM_PASSWORD`   |         `botler`          |      -       | Password used to authenticate with Postgres.                                                                                  |
|     LOGGER OPTIONS     |
|  `LOGGER_STAMP_LABEL`  |          `true`           |     same     | If the timestamp metadata should be added                                                                                     |
|  `LOGGER_SCOPE_LABEL`  |          `true`           |     same     | If the scope metadata should be added                                                                                         |
|  `LOGGER_LEVEL_LABEL`  |          `true`           |     same     | If the log level metadata should be added                                                                                     |
|  `LOGGER_STAMP_COLOR`  |          `gray`           |     same     | Color of the timestamp label                                                                                                  |
|  `LOGGER_SCOPE_COLOR`  |         `yellow`          |     same     | Color of the scope label                                                                                                      |
|  `LOGGER_LEVEL_COLOR`  |          `cyan`           |     same     | Color of the log level label                                                                                                  |
| `LOGGER_LABEL_PREFIX`  |            `[`            |     same     | Prefix of metadata label                                                                                                      |
| `LOGGER_LABEL_SUFFIX`  |            `]`            |     same     | Suffix of metadata label                                                                                                      |
|   `LOGGER_STAMP_PAD`   |            `0`            |     same     | Minimum length of characters for timestamp label. Will be padded with spaces.                                                 |
|   `LOGGER_SCOPE_PAD`   |           `10`            |     same     | Minimum length of characters for the scope label. Will be padded with spaces.                                                 |
| `LOGGER_STAMP_FORMAT`  | `YYYY/MM/DD HH:mm:ss.sss` |     same     | Format of timestamp label. See the [Day.js documentation](https://day.js.org/docs/en/display/format) for more information.    |

!!! tip "Additional Database Connection Options"
    Variables with a `TYPEORM` prefix are for the database connection. There are more but note that those only get respected by TypeORM itself and not by the DatabaseEventHub.
    All TypeORM options are listed in the [TypeORM documentation](https://github.com/typeorm/typeorm/blob/master/docs/using-ormconfig.md#using-environment-variables).

!!! tip "More Logger Colors"
    You can set label colors to any [CSS color keyword](https://www.w3.org/wiki/CSS/Properties/color/keywords)
    or even a hex color prefixed with `#` like `#008000` (green).
