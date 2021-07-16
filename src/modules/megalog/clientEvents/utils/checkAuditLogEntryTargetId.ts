import {GuildAuditLogsEntry} from 'discord.js';

export function checkAuditLogEntryTargetId(
  entry: GuildAuditLogsEntry,
  id: string | undefined | null
): boolean {
  return !!entry.target && 'id' in entry.target && entry.target.id === id;
}
