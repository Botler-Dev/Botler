import {MigrationInterface, QueryRunner} from "typeorm";
import { generateDeleteSyncTriggerCreateStatement, generateDeleteSyncTriggerDropStatement } from "../synchronizer/statementGenerators";

export class ListenerSync1616926768382 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(generateDeleteSyncTriggerCreateStatement('ReactionListener', ['message', 'user', 'emoji', 'cache']))
      await queryRunner.query(generateDeleteSyncTriggerCreateStatement('ResponseListener', ['channel', 'user', 'cache']))
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(generateDeleteSyncTriggerDropStatement('ReactionListener'))
      await queryRunner.query(generateDeleteSyncTriggerDropStatement('ResponseListener'))
    }

}
