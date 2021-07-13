/**
 * Manages a specific model and wraps the corresponding prisma model.
 *
 * @template TModel Prisma model that can be retrieved with `PrismaClient['camelCaseModelName']`.
 */
export abstract class ModelManager<TModel = unknown> {
  readonly model: TModel;

  constructor(model: TModel) {
    this.model = model;
  }
}
