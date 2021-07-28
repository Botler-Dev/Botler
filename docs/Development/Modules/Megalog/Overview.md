# Megalog Module

The Megalog module adds logging of all Discord events to text channels. This can be useful for the following reasons:

- Get more information than from an audit log entry.
- Log more events than the audit log does.
- Get Discord notifications for specific import events.
- Make specific events visible to non-privileged members.

## Event Types

Below is a list of all the potential event categories with all event types supported by this module and whether their logging can be enhanced by having access to the audit log.

!!! Note
    Currently, only `attachment-send`, `message-edit`, and `message-delete-single` are implemented.

|               Name                | Audit Log Enhanceable |
| :-------------------------------: | :-------------------: |
|        `message` CATEGORY         |           -           |
|      `message-delete-single`      |          Yes          |
|       `message-delete-bulk`       |          Yes          |
|          `message-edit`           |          No           |
|         `attachment-send`         |          No           |
|                                   |
|         `member` CATEGORY         |           -           |
|           `member-join`           |          No           |
|          `member-leave`           |          Yes          |
|     `member-update-nickname`      |          Yes          |
|       `member-update-roles`       |          Yes          |
|           `member-ban`            |          Yes          |
|          `member-unban`           |          Yes          |
|                                   |
|          `role` CATEGORY          |           -           |
|           `role-create`           |          Yes          |
|           `role-delete`           |          Yes          |
|           `role-update`           |          Yes          |
|        `role-update-name`         |          Yes          |
|     `role-update-permissions`     |          Yes          |
|        `role-update-color`        |          Yes          |
|        `role-update-hoist`        |          Yes          |
|     `role-update-mentionable`     |          Yes          |
|                                   |
|        `reaction` CATEGORY        |           -           |
|          `reaction-add`           |          No           |
|     `reaction-remove-single`      |          No           |
|      `reaction-remove-emoji`      |          No           |
|       `reaction-remove-all`       |          No           |
|                                   |
|        `channel` CATEGORY         |           -           |
|         `channel-create`          |          Yes          |
|         `channel-delete`          |          Yes          |
|         `channel-update`          |          Yes          |
|       `channel-update-name`       |          Yes          |
|     `channel-update-position`     |          Yes          |
|      `channel-update-topic`       |          Yes          |
|      `channel-update-topic`       |          Yes          |
|     `channel-update-bitrate`      |          Yes          |
|       `channel-update-nsfw`       |          Yes          |
|     `channel-update-slowmode`     |          Yes          |
|       `channel-update-type`       |          Yes          |
|        `overwrite-create`         |          Yes          |
|        `overwrite-delete`         |          Yes          |
|        `overwrite-update`         |          Yes          |
|           `pin-update`            |          Yes          |
|                                   |
|        `webhook` CATEGORY         |           -           |
|         `webhook-create`          |          Yes          |
|         `webhook-delete`          |          Yes          |
|         `webhook-update`          |          Yes          |
|       `webhook-update-name`       |          Yes          |
|      `webhook-update-avatar`      |          Yes          |
|     `webhook-update-channel`      |          Yes          |
|                                   |
|         `emoji` CATEGORY          |           -           |
|          `emoji-create`           |          Yes          |
|          `emoji-delete`           |          Yes          |
|          `emoji-update`           |          Yes          |
|                                   |
|         `guild` CATEGORY          |           -           |
|          `guild-update`           |          Yes          |
|        `guild-update-name`        |          Yes          |
|    `guild-update-description`     |          Yes          |
|        `guild-update-icon`        |          Yes          |
|       `guild-update-splash`       |          Yes          |
|  `guild-update-discovery-splash`  |          Yes          |
|       `guild-update-banner`       |          Yes          |
|       `guild-update-owner`        |          Yes          |
|      `guild-update-language`      |          Yes          |
|    `guild-update-afk-channel`     |          Yes          |
|    `guild-update-afk-timeout`     |          Yes          |
|   `guild-update-rules-channel`    |          Yes          |
| `guild-update-community-channel`  |          Yes          |
|        `guild-update-mfa`         |          Yes          |
| `guild-update-verification-level` |          Yes          |
|  `guild-update-explicit-filter`   |          Yes          |
|     `guild-update-vanity-url`     |          Yes          |
|   `guild-update-widget-toggle`    |          Yes          |
|   `guild-update-widget-channel`   |          Yes          |
|   `guild-update-system-channel`   |          Yes          |
|    `guild-update-system-flags`    |          Yes          |
|                                   |
|          `user` CATEGORY          |           -           |
|           `user-update`           |          No           |
|      `user-update-username`       |          No           |
|         `user-update-tag`         |          No           |
|       `user-update-avatar`        |          No           |
|                                   |
|         `voice` CATEGORY          |           -           |
|           `voice-move`            |          Yes          |
|           `voice-join`            |          No           |
|           `voice-leave`           |          Yes          |
|     `voice-update-deaf-self`      |          No           |
|    `voice-update-deaf-server`     |          Yes          |
|     `voice-update-mute-self`      |          No           |
|    `voice-update-mute-server`     |          Yes          |
