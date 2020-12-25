import {MigrationInterface, QueryRunner} from "typeorm";
import { generateAllSyncTriggerCreateStatements } from "../synchronizer/statementGenerators";

export class GlobalSettings1608892232422 implements MigrationInterface {
    name = 'GlobalSettings1608892232422'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "GlobalSettings" (
                "version" SMALLSERIAL NOT NULL,
                "botToken" text NOT NULL,
                "prefix" text NOT NULL DEFAULT '?!',
                CONSTRAINT "PK_0666ae39f190e1ff485a8e6df49" PRIMARY KEY ("version")
            );
            ${generateAllSyncTriggerCreateStatements('GlobalSettings', ['version'])}
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "GlobalSettings"
        `);
    }

}
