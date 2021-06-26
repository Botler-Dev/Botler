# Module System

Botler contains a module system with which all its features are implemented. Each module encapsulates a single feature that either directly interacts with Discord, other external services, or with other modules. To maximize code modularity and development parallelizability, the modules only expose a limited API to each other. This API can be accessed via the public properties and methods of a module class instance and should have code documentation and be viewed as a public API. The module types referenced in these APIs should be bundled into a [barrel file](https://basarat.gitbook.io/typescript/main-1/barrel) in the module directory root to prevent reliance on module internal file placement.

## Dependencies

For modules to be able to interact with other modules, they need to specify these dependencies in the static class properties:

- `requiredDependencies`: Dependencies used in core functionality
- `optionalDependencies`: Dependencies used in additional functionality (like logging)

These two lists are then used on startup to automatically enable appropriate modules based on the activated and deactivated module settings (currently hardcoded to enable all modules and disable none).

### Dependency consumption

Once a dependency is defined in the module's static properties, it can be consumed in steps 2-4 of [initialization](#initialization). To get the instance of another module simply use the `getModule()` and `getOptionalModule()` methods of the module itself.

## Initialization

The initialization of modules consists of 4 steps:

1. Module class initialization (the constructor): create the class
2. Async pre-initialization (`preInitialize()` method): prepare for consumption in other modules
3. Async initialization (`initialize()` method): consume other modules and configure module fully
4. Async post-initialization (`postInitialize()` method): start execution of functionality

All modules run the same step together with the asynchronous steps being awaited before the next step is executed.
At the end of step 4, the module should be running normally.

## Database access

Each module can define its database schemas using `.prisma` files located in its module directory. In most cases, having a single file called `schema.prisma` in the module root will suffice.

During the execution of any `yarn prisma` command, these schema files then get manually merged with `src/schema.prisma` and saved to `schema.prisma` for the Prisma CLI to consume. This manual merging can make a module's schema file by itself look wrong for your editor's Prisma integration, why you should test the actual validity by running `yarn prisma validate`.

To maintain strict encapsulation, a set of rules must be followed:

- A module schema must not directly reference objects outside its module.
- The names of module schema objects should always be prefixed with the module name.
- A module should not directly access another module's data through Prisma but instead, use that module's API

## Example code

This example shows how a module class might look.

```ts
// Checks that the static module interface is implemented
@StaticImplements<ModuleConstructor>()
export class ExampleModule extends Module {
  static readonly moduleName = 'example';

  // Reference by class
  static readonly requiredDependencies = [CommandModule];

  // Reference by name
  static readonly optionalDependencies = ['logger'];

...

  constructor(
    moduleContainer: DependencyContainer,
    // Access global services (like the Discord client)
    client = moduleContainer.resolve(Client),
  ) {
    super(moduleContainer);
    this.client = client;

    // Register internal services
    this.container.registerSingleton(SomeService);
  }

  async preInitialize(): Promise<void> {
    // Initialize async stuff in the initialization methods
    await this.someProperty.initialize();
  }

  async initialize(): Promise<void> {
    // Consume dependency modules after constructor call
    this.logger = this.getOptionalModule('logger');
  }

  async postInitialize(): Promise<void> {
    // Start execution
    this.client.on('message', message => this.someMethod(message));
  }

...

}
```
