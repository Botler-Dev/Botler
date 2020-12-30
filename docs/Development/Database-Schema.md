# Database Schema

To view the schema use [dbdiagram.io](https://dbdiagram.io/d).

```DBML
Table Guild as G {
  id string [pk]
  prefix string [null]
  systemLogChannel string [null]
  caseLogChannel string [null]
}

Table CommandSettings {
  guild string [ref: > G.id]
  command string
  enabled boolean [default: true]
  settings jsonb [null]
}

Table LevelRole {
  guild string [ref: > G.id]
  role string
  reqLevel number
}

Table GuildLog {
  guild string [ref: > G.id]
  type GuildLogType
  info jsonb
}

enum GuildLogType {
  staffAdd
  staffRemove
}

Table ModerationCase {
  guild string [pk, ref: > G.id]
  caseId number [pk]
  user string
  mod string
  action ModerationAction
  timestamp datetime
  duration number [null]
  reason string [null]
}

enum ModerationAction {
  warn
  mute
  kick
  softBan
  ban
  unmute
  unban
}

Table GuildMember as GM {
  guild string [pk, ref: > G.id]
  user string [pk, ref: > U.id]
  totalMessages number
  totalMinutes number
}

Table User as U {
  id [pk]
  birthday date
}

Table CommandLastUsed {
  scope string [null, pk, ref: > G.id]
  command string [pk]
  lastUsed datetime
}

Table ChannelLock {
  guild string [pk, ref: > G.id]
  channel string [pk]
  orginiallyNeutral stringArray
  originallyAllow stringArray
}

Table YoutubeWebhookSubscription {
  id number [pk, increment]
  guild string [ref: > G.id]
  channel string
  ytChannelId string
}

Table MegalogSubscription{
  guild string [pk, ref: > G.id]
  channel string
  event MegalogEvent [pk]
}

enum MegalogEvent{
  guildMemberJoin
  other
}

Table GlobalSettings {
  some settings
}

Table ErrorLog {
  md5 string [pk]
  message string
  stack string
  firstThrown datetime
  lastThrown datetime
  timesThrown number
}

Table Feedback {
  id number [pk, increment]
  submitted string
  feedback string
}

Table PAction {
  id number [pk, increment]
  from datetime
  to datetime
  action string
  info jsonb
}

Table ResponseListener {
  channel string [pk]
  user string [pk, null]
  expirationDateTime datetime
  cache number [ref: > CC.id]
}

Table ReactionListener {
  message string [pk]
  user string [pk, null]
  expirationDateTime datetime
  cache number [ref: > CC.id]
}

Table CommandCache as CC {
  id number [pk, increment]
  cache jsonb
}
```
