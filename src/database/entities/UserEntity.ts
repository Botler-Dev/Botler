import {Snowflake} from 'discord.js';
import {Column, Entity, PrimaryColumn} from 'typeorm';

@Entity({
  name: 'User',
})
export default class UserEntity {
  @PrimaryColumn({type: 'text'})
  id!: Snowflake;

  @Column({type: 'date', nullable: true})
  birthDate?: string;
}
