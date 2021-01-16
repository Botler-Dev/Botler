import {MigrationInterface, QueryRunner} from "typeorm";
import { generateAllSyncTriggerCreateStatements } from "../synchronizer/statementGenerators";

export class User1610806064595 implements MigrationInterface {
    name = 'User1610806064595'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "User" (
                "id" text NOT NULL,
                "birthDate" date,
                CONSTRAINT "PK_9862f679340fb2388436a5ab3e4" PRIMARY KEY ("id")
            );
            ${generateAllSyncTriggerCreateStatements('User', ['id'])}
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "User"
        `);
    }

}
