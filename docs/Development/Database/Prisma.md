# Prisma

Botler uses [Prisma](https://www.prisma.io/) to interface with its PostgreSQL database. Unfortunately, as the software is very young it still lacks some features to which the relevant workarounds are listed here.

## Specifying the schema

Officially having multiple Prisma schema files is currently not supported (See issue [#2377](https://github.com/prisma/prisma/issues/2377)) but to keep this project as modular as possible we use [prisma-merge](https://www.npmjs.com/package/prisma-merge) as a workaround. This blindly concatenates all specified schema files together into the `schema.prisma` file in the root. This merge operation can be performed in the following ways:

```shell
# Only merge schema files
yarn prisma:merge

# Merge schema files and then directly execute the Prisma CLI
yarn prisma [args]
```

!!! attention "Watch option"
    The manual merging of schema files means that the `--watch` option in `prisma generate` is useless. You will need to rerun the command each time you want to regenerate the Prisma client.

### Schema file locations

The `prisma:merge` script searches for schema files according to the following patterns:

| <div style="width:200px">Pattern</div> | Description                                                                                                                                 |
| :------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------ |
|      `src/database/schema.prisma`      | Data source, generator, and models not related to modules.                                                                                  |
|       `src/modules/**/*.prisma`        | Models related to specific modules prefixed with the module name. For example `CommandReactionListener` instead of just `ReactionListener`. |

!!! note
    The Prisma extension in your editor might mark things in module schema files as incorrect because it is missing the context from `src/database/schema.prisma`. To properly check the validity run `yarn prisma:merge` and check if the error still shows in the merged file.

## Configuring the database URL

Because Prisma does not currently support the composing of connection URLs (See issue [#2559](https://github.com/prisma/prisma/issues/2559)) and environment variable default values, the CLI currently needs to be explicitly configured via the `DATABASE_URL`.

For easier configuring, here is the contents of an example `.env` file with the default configuration:

```dotenv
DATABASE_USERNAME="postgres"
DATABASE_PASSWORD="botler"
DATABASE_HOST="localhost"
DATABASE_PORT=5432
DATABASE_DATABASE="postgres"
DATABASE_ARGS="schema=public"

DATABASE_URL="postgresql://${DATABASE_USERNAME}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_DATABASE}?${DATABASE_ARGS}"
```

## Applying migrations

To apply all migrations to a database first [configure the database URL](#configuring-the-database-url) then run the following command:

```shell
yarn prisma migrate deploy
```
