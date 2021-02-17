import {MigrationInterface, QueryRunner} from "typeorm";

export class CommandCache1613557156732 implements MigrationInterface {
    name = 'CommandCache1613557156732'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "CommandCache" (
                "id" SERIAL NOT NULL,
                "command" text NOT NULL,
                "expirationDateTime" TIMESTAMP WITH TIME ZONE NOT NULL,
                "cache" json NOT NULL,
                CONSTRAINT "PK_ac7f7c4f2621281cbef0e38d270" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "ReactionListener" (
                "message" text NOT NULL,
                "user" text NOT NULL,
                "emoji" text NOT NULL,
                "cache" integer NOT NULL,
                CONSTRAINT "PK_543701ab4b2109a8efeca253b75" PRIMARY KEY ("message", "user", "emoji", "cache")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "ResponseListener" (
                "channel" text NOT NULL,
                "user" text NOT NULL,
                "cache" integer NOT NULL,
                CONSTRAINT "PK_32fc31525d77dbc713cfeb8a35e" PRIMARY KEY ("channel", "user", "cache")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "ReactionListener"
            ADD CONSTRAINT "FK_c496c706cd845c947b6ac08737b" FOREIGN KEY ("cache") REFERENCES "CommandCache"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "ResponseListener"
            ADD CONSTRAINT "FK_255270d05a3e44d2c72b55d35d8" FOREIGN KEY ("cache") REFERENCES "CommandCache"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "ResponseListener" DROP CONSTRAINT "FK_255270d05a3e44d2c72b55d35d8"
        `);
        await queryRunner.query(`
            ALTER TABLE "ReactionListener" DROP CONSTRAINT "FK_c496c706cd845c947b6ac08737b"
        `);
        await queryRunner.query(`
            DROP TABLE "ResponseListener"
        `);
        await queryRunner.query(`
            DROP TABLE "ReactionListener"
        `);
        await queryRunner.query(`
            DROP TABLE "CommandCache"
        `);
    }

}
