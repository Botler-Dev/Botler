/**
 * Manager for entities which holds a specific prisma model.
 *
 * @template TModel Prisma model that can be retrieved with `PrismaClient['camelCaseModelName']`.
 */
export abstract class EntityManager<TModel = unknown> {
  readonly model: TModel;

  constructor(model: TModel) {
    this.model = model;
  }
}
