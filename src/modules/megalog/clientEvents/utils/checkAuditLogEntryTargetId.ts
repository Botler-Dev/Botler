import {GuildAuditLogsEntry} from 'discord.js';

export function checkAuditLogEntryTargetId(entry: GuildAuditLogsEntry, id: string): boolean {
  return !!entry.target && 'id' in entry.target && entry.target.id === id;
}
