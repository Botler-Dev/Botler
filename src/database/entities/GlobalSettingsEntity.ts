import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';

@Entity({
  name: 'GlobalSettings',
})
export default class GlobalSettingsEntity {
  @PrimaryGeneratedColumn('increment', {type: 'int8'})
  version!: number;

  @Column({type: 'text', nullable: false})
  botToken = '';

  @Column({type: 'text', nullable: false, default: '?!'})
  prefix = '?!';
}
