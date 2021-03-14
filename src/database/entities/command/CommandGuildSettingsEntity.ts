import {Snowflake} from 'discord.js';
import {Column, Entity, PrimaryColumn} from 'typeorm';

@Entity({
  name: 'CommandGuildSettings',
})
export default class CommandGuildSettingsEntity {
  @PrimaryColumn('text')
  guild!: Snowflake;

  @Column({type: 'text', nullable: true})
  prefix!: string | null;
}
