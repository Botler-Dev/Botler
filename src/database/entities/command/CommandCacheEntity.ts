import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';

@Entity({
  name: 'CommandCache',
})
export default class CommandCacheEntity<TCache = unknown> {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('text')
  command!: string;

  @Column('timestamptz')
  expirationDateTime!: Date;

  @Column('json')
  cache!: TCache;
}
