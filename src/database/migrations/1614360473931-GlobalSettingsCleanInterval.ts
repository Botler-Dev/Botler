import {MigrationInterface, QueryRunner} from "typeorm";

export class GlobalSettingsCleanInterval1614360473931 implements MigrationInterface {
    name = 'GlobalSettingsCleanInterval1614360473931'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "GlobalSettings"
            ADD "cleanInterval" integer NOT NULL DEFAULT '600000'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "GlobalSettings" DROP COLUMN "cleanInterval"
        `);
    }

}
