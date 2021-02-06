import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';

@Entity({
  name: 'GlobalSettings',
})
export default class GlobalSettingsEntity {
  @PrimaryGeneratedColumn('increment', {type: 'smallint'})
  version!: number;

  @Column({type: 'text', nullable: false})
  botToken = '';

  @Column({type: 'text', nullable: false, default: '?!'})
  prefix = '?!';

  @Column({type: 'varchar', length: 19, array: true, default: () => 'array[]::varchar(19)[]'})
  botMasters: string[] = [];

  @Column({type: 'integer', default: 7506394})
  colorDefault = 7506394;

  @Column({type: 'integer', default: 16718602})
  colorBad = 16718602;

  @Column({type: 'integer', default: 3461464})
  colorGood = 3461464;

  @Column({type: 'integer', default: 16745728})
  colorWarn = 16745728;
}
