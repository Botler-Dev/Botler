# Configuring Megalog

The Megalog has a few settings that can be changed at runtime. All have defaults that can be overwritten by creating a row in the `MegalogSettings` and setting the corresponding column to a non-null value. If multiple rows exist, the one with the highest `version` number gets chosen.

## Settings

|             Name              | Description                                                                            | Default |
| :---------------------------: | :------------------------------------------------------------------------------------- | :-----: |
|  `auditLogMatchTryInterval`   | Interval in milliseconds in which the AuditLogMatcher tries to resolve match requests. |  1000   |
|      `auditLogFetchSize`      | How many audit log entries get fetched per guild one match try.                        |   10    |
| `maxAuditLogMatchQueueLength` | Maximum amount of match requests stored per guild.                                     |   100   |
|    `maxAuditLogMatchTries`    | Maximum amount of attempts for resolving a match request before being dropped.         |   10    |
