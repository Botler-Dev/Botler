import {MigrationInterface, QueryRunner} from "typeorm";

export class GlobalSettingsExtension1612633234629 implements MigrationInterface {
    name = 'GlobalSettingsExtension1612633234629'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "GlobalSettings"
            ADD "botMasters" character varying(19) array NOT NULL DEFAULT array []::varchar(19) []
        `);
        await queryRunner.query(`
            ALTER TABLE "GlobalSettings"
            ADD "colorDefault" integer NOT NULL DEFAULT '7506394'
        `);
        await queryRunner.query(`
            ALTER TABLE "GlobalSettings"
            ADD "colorBad" integer NOT NULL DEFAULT '16718602'
        `);
        await queryRunner.query(`
            ALTER TABLE "GlobalSettings"
            ADD "colorGood" integer NOT NULL DEFAULT '3461464'
        `);
        await queryRunner.query(`
            ALTER TABLE "GlobalSettings"
            ADD "colorWarn" integer NOT NULL DEFAULT '16745728'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "GlobalSettings" DROP COLUMN "colorWarn"
        `);
        await queryRunner.query(`
            ALTER TABLE "GlobalSettings" DROP COLUMN "colorGood"
        `);
        await queryRunner.query(`
            ALTER TABLE "GlobalSettings" DROP COLUMN "colorBad"
        `);
        await queryRunner.query(`
            ALTER TABLE "GlobalSettings" DROP COLUMN "colorDefault"
        `);
        await queryRunner.query(`
            ALTER TABLE "GlobalSettings" DROP COLUMN "botMasters"
        `);
    }

}
