# Configuring Megalog

The Megalog stores its configuration in the database and uses the [Settings API](../../Database/Settings.md).

## Settings

|             Name              | Description                                                                            | Default |
| :---------------------------: | :------------------------------------------------------------------------------------- | :-----: |
|  `auditLogMatchTryInterval`   | Interval in milliseconds in which the AuditLogMatcher tries to resolve match requests. |  1000   |
|      `auditLogFetchSize`      | How many audit log entries get fetched per guild one match try.                        |   10    |
| `maxAuditLogMatchQueueLength` | Maximum amount of match requests stored per guild.                                     |   100   |
|    `maxAuditLogMatchTries`    | Maximum amount of attempts for resolving a match request before being dropped.         |   10    |
