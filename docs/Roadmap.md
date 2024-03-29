# Roadmap

This page roughly describes the order in which features will be implemented and what features
will be implemented in what version.

## Version 0.3 - Base

| Name                             | Description                                                   | Status |
| -------------------------------- | ------------------------------------------------------------- | ------ |
| **Basic Command Implementation** | Just command execution with input parsing and simple response | Done   |
| **Command Response Listener**    | Command can listen for a message response of the user         | Done   |
| **Command Reaction Listener**    | Command can listen for reactions on messages                  | Done   |
| **Cache**                        | Cache often used database objects                             | Done   |
| **Active Cache**                 | Actively sync the cache with the database                     | Done   |

## Version 0.8 - BulletBot replacement

| Name                       | Description                                                  | Status |
| -------------------------- | ------------------------------------------------------------ | ------ |
| **Channel Logging System** | Unified way of creating logging systems for guild channels   |
| **Config Change Logger**   | Audit log of the bot                                         |
| **Megalogger**             | Guild channel logger for every event that Botler can receive | WIP    |
| **Moderation Commands**    | Moderation commands with case logging and auto unmute        |
| **YouTube Webhooks**       | Subscribe to YouTube channels                                |

## Version 1.0 - Bottius replacement

| Name                         | Description                                       | Status |
| ---------------------------- | ------------------------------------------------- | ------ |
| **Birthday Role Assignment** | Automatically assign a role on a members birthday |
| **Leveling**                 | Voice and text based leveling with rank roles     |

## Ideas

| Name                | Description                                                 | Status |
| ------------------- | ----------------------------------------------------------- | ------ |
| **Basic Automod**   | Simple automatic moderator                                  |
| **Toxmeter™️**       | Toxicity of chat measurement                                |
| **Lockdown System** | Lock down certain channels or the entire server             |
| **Bot Detection**   | Detects bots on join or through automod                     |
| **User Blacklist**  | Categories global autoban blacklist of bots, trouble makers |
