# Message Parser

To make parsing arguments easier the `MessageExecutionContext` (superclass of `InitialExecutionContext` and `ResponseExecutionContext`) has a backtracking style parser implemented. By passing a `Parser` into the `parseNext` or `parseOptionalNext` methods it will automatically try to parse it and mark the text consumed in the parse result as already parsed. Incase the parse was unsuccessful when using `parseNext` it will throw a `CommandError` with an error message complaining about a missing argument.

The Command module provides already implemented parsers for the following things:

- Text
- Snowflake
- Guild member
- User

Custom parsers can easily be implemented by created a function according to the `Parser` type. The parsers above can be used as examples.
