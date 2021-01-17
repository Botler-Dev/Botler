import {Snowflake} from 'discord.js';
import {Entity, PrimaryColumn} from 'typeorm';

export const guildMemberTableName = 'GuildMember' as const;

@Entity({
  name: guildMemberTableName,
})
export default class GuildMemberEntity {
  @PrimaryColumn({type: 'text'})
  guild!: Snowflake;

  @PrimaryColumn({type: 'text'})
  user!: Snowflake;
}
