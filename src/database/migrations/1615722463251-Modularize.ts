import {MigrationInterface, QueryRunner} from "typeorm";
import { generateAllSyncTriggerCreateStatements } from "../synchronizer/statementGenerators";

export class Modularize1615722463251 implements MigrationInterface {
    name = 'Modularize1615722463251'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "CommandGuildSettings" (
                "guild" text NOT NULL,
                "prefix" text,
                CONSTRAINT "PK_f5355aa028437bb448799415657" PRIMARY KEY ("guild")
            )
        `);
        await queryRunner.query(generateAllSyncTriggerCreateStatements('CommandGuildSettings', ['guild']))
        await queryRunner.query(`
            DROP TABLE "Guild"
        `);
        await queryRunner.query(`
            DROP TABLE "GuildMember"
        `);
        await queryRunner.query(`
            DROP TABLE "User"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "CommandGuildSettings"
        `);
        await queryRunner.query(`
            create table "Guild"
            (
                id                 text not null
                    constraint "PK_9eea0f088e9eec9b01bd9a824ca"
                        primary key,
                prefix             text,
                "systemLogChannel" text,
                "caseLogChannel"   text
            );
        `)
        await queryRunner.query(`
            create table "GuildMember"
            (
                guild  text not null,
                "user" text not null,
                constraint "PK_177bbce7ae0640bf248b3cd46bb"
                    primary key (guild, "user")
            );
        `)
        await queryRunner.query(`
            create table "User"
            (
                id          text not null
                    constraint "PK_9862f679340fb2388436a5ab3e4"
                        primary key,
                "birthDate" date
            );
        `)
    }

}
