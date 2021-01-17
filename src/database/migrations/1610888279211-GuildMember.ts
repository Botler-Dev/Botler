import {MigrationInterface, QueryRunner} from "typeorm";
import { generateAllSyncTriggerCreateStatements } from "../synchronizer/statementGenerators";

export class GuildMember1610888279211 implements MigrationInterface {
    name = 'GuildMember1610888279211'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "GuildMember" (
                "guild" text NOT NULL,
                "user" text NOT NULL,
                CONSTRAINT "PK_177bbce7ae0640bf248b3cd46bb" PRIMARY KEY ("guild", "user")
            );
            ${generateAllSyncTriggerCreateStatements('GuildMember', ['guild', 'user'])}
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "GuildMember"
        `);
    }

}
