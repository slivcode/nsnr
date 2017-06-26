type PromiseFn = () => Promise<any>;

export type IScript = {
  description?: string;
  handler: (string | PromiseFn)[];
};

export interface ITask {

}