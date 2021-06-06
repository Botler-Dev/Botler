export abstract class EntityManager<TModel = unknown> {
  readonly model: TModel;

  constructor(model: TModel) {
    this.model = model;
  }
}
