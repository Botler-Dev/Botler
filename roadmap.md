# Roadmap

This document roughly describes the order in which features will be implemented and what features
will be implemented in what version.

| Name                             | Description                                                   | Status |
| -------------------------------- | ------------------------------------------------------------- | ------ |
| VERSION 0.3                      |
| **Basic Command Implementation** | Just command execution with input parsing and simple response | WIP    |
| **Command Response Listener**    | Command can listen for a message response of the user         |
| **Command Reaction Listener**    | Command can listen for reactions on messages                  |
| **PAction Implementation**       | Execute task at a later date                                  |
| **Cache**                        | Cache often used database objects                             |
| **Active Cache**                 | Actively sync the cache with the database                     |
| VERSION 0.8                      |
| **Channel Logging System**       | Unified way of creating logging systems for guild channels    |
| **Config Change Logger**         | Audit log of the bot                                          |
| **Megalogger**                   | Guild channel logger for every event that Botler can receive  |
| **Moderation Commands**          | Moderation commands with case logging and auto unmute         |
| **YouTube Webhooks**             | Subscribe to YouTube channels                                 |
| VERSION 1.0                      |
| **Birthday Role Assignment**     | Automatically assign a role on a members birthday             |
| **Leveling**                     | Voice and text based leveling with rank roles                 |
