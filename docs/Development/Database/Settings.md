# Database-Stored Settings

To make system settings easily changeable during runtime, most of them are stored in and synchronized from the database.
For this, the core provides a settings API in `src/database/settings` which always synchronizes the `SettingsWrapper` to the entry with the highest `version` number.
If the table is empty, the wrapper has to provide and use default settings.

!!! warn "Synchronization"
    To make the synchronization work you have to add the [sync triggers](Sync-Triggers.md) manually via migrations.
