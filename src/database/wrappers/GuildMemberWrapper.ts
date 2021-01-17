import {GuildMember, GuildMemberResolvable, Snowflake} from 'discord.js';
import {FindConditions} from 'typeorm';
import GuildMemberEntity from '../entities/GuildMemberEntity';
import type GuildMemberManager from '../managers/GuildMemberManager';
import type UserManager from '../managers/UserManager';
import {SyncStream} from '../synchronizer/CacheSynchronizer';
import CacheEntityWrapper from '../wrapper/CacheEntityWrapper';
import DiscordWrapper from '../wrapper/DiscordWrapper';
import type GuildWrapper from './GuildWrapper';
import UserWrapper from './UserWrapper';

export type GuildMemberWrapperResolvable = GuildMemberWrapper | UserWrapper | GuildMemberResolvable;

export default class GuildMemberWrapper
  extends CacheEntityWrapper<GuildMemberEntity | undefined, GuildMemberManager, GuildMemberWrapper>
  implements DiscordWrapper<GuildMember> {
  readonly discord: GuildMember;

  readonly id: Snowflake;

  readonly guild: GuildWrapper;

  private _user: UserWrapper | undefined;

  get user(): UserWrapper | undefined {
    return this._user;
  }

  protected uniqueConditions: FindConditions<GuildMemberEntity>;

  private readonly userManager: UserManager;

  constructor(
    manager: GuildMemberManager,
    syncStream: SyncStream<GuildMemberEntity>,
    entity: GuildMemberEntity | undefined,
    discordObject: GuildMember,
    guild: GuildWrapper,
    userManager: UserManager
  ) {
    super(manager, syncStream, entity);
    this.discord = discordObject;
    this.id = discordObject.id;
    this.guild = guild;
    this.userManager = userManager;
    this.uniqueConditions = {
      guild: discordObject.guild.id,
      user: discordObject.id,
    };
  }

  async fetchUser(): Promise<UserWrapper> {
    if (this._user) return this._user;
    const user = await this.userManager.fetch(this);
    this._user = user;
    return user;
  }

  protected createDefaultEntity(): GuildMemberEntity {
    return {
      guild: this.discord.guild.id,
      user: this.discord.id,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  isEntityUseless(): boolean {
    return true;
  }

  toString(): string {
    return this.discord.toString();
  }
}
