import {MigrationInterface, QueryRunner} from "typeorm";

export class Test1000000000000 implements MigrationInterface {
    name = 'Test1000000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create functions for the CacheSynchronizer
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION trigger_notify_entity_insert_or_update()
                RETURNS TRIGGER
                LANGUAGE plpgsql
            as
            $$
            BEGIN
                PERFORM pg_notify('sync_' || TG_TABLE_NAME || '_' || TG_OP, row_to_json(NEW)::text);
                RETURN NULL;
            END
            $$;

            CREATE OR REPLACE FUNCTION trigger_notify_entity_delete()
                RETURNS TRIGGER
                LANGUAGE plpgsql
            as
            $$
            DECLARE
                columnName text;
                selections text[] := '{}';
                payload    record;
            BEGIN
                FOREACH columnName IN ARRAY TG_ARGV
                    LOOP
                        selections := selections || ('($1)."' || columnName || '"');
                    END LOOP;
                EXECUTE 'SELECT ' || array_to_string(selections, ', ') USING OLD INTO payload;
                PERFORM pg_notify('sync_' || TG_TABLE_NAME || '_DELETE', row_to_json(payload)::text);
                RETURN NULL;
            END
            $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP FUNCTION trigger_notify_entity_insert_or_update CASCADE;
            DROP FUNCTION trigger_notify_entity_delete CASCADE;
        `);
    }

}
