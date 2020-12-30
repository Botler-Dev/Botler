import {MigrationInterface, QueryRunner} from "typeorm";
import { generateAllSyncTriggerCreateStatements } from "../synchronizer/statementGenerators";

export class Guild1609174620868 implements MigrationInterface {
    name = 'Guild1609174620868'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "Guild" (
                "id" text NOT NULL,
                "prefix" text,
                "systemLogChannel" text,
                "caseLogChannel" text,
                CONSTRAINT "PK_9eea0f088e9eec9b01bd9a824ca" PRIMARY KEY ("id")
            );
            ${generateAllSyncTriggerCreateStatements('Guild', ['id'])}
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "Guild"
        `);
    }

}
