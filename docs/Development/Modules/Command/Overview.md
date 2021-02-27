# Command Module

The Command module implements a uniform command registration and execution framework for other modules to use.
It provides the following features:

- Error handling with Discord message responses
- Argument parser
- Data storage between related command executions
- Listeners for response reactions and messages

## Architecture

### Command Registration

After implementing a command by extending the `Command` class it needs to be registered into the command category tree. This tree of `CommandCategory` instances organizes commands by function. For example, the `ban` command could be located in `/moderation/cases`. The module provides the root via the `rootCategory` property for other modules to create their categories and register their commands. The categories then automatically pass the commands to a separate command lookup table that maps commands to their name and aliases.

Command categories currently only organize commands but in the future, they will also be able to hold permissions that child categories and commands can inherit.

### Command Execution

On post initialization, the Command module starts listening for messages that fit the `[prefix][command name/alias]` pattern (like `?!ping`). Once it has found one it builds an `InitialExecutionContext` which is then passed to the correct command for execution. The context holds all information about the execution and is the command's interface to the [argument parser](../Argument-Parser/), [reaction and response listeners](../Command-Cache/#listeners) and [command cache](../Command-Cache/).

The module also listens for reactions or messages corresponding to set listeners. Similar to the initial execution, it will build a `ReactionExecutionContext` or `ResponseExecutionContext` respectively. Those contexts contain similar features to `InitialExecutionContext`.

In case an error occurs during command execution, the module automatically catches it. If it is a normal error it will send a generic "Something went wrong" Discord message and log the error to the console. If it is an error extending the `CommandError` it -- TBD --.

<!-- TODO: Refactor command errors and finish this paragraph -->
