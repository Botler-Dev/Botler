import {Snowflake} from 'discord.js';
import {Column, Entity, PrimaryColumn} from 'typeorm';

@Entity({
  name: 'Guild',
})
export default class GuildEntity {
  @PrimaryColumn({type: 'text'})
  id!: Snowflake;

  @Column({type: 'text', nullable: true})
  prefix!: string | null;

  @Column({type: 'text', nullable: true})
  systemLogChannel!: string | null;

  @Column({type: 'text', nullable: true})
  caseLogChannel!: string | null;
}
