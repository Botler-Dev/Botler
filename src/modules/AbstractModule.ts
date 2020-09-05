export default abstract class AbstractModule {
  initialize?(): Promise<void>;

  postInitialize?(): Promise<void>;
}
