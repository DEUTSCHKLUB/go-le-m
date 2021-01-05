export default interface Queue<T> {
}
export default class Queue<T> {
    private _tasks;
    private _cancellationToken;
    constructor(list: never[] | undefined, cancellationToken: any);
    put(item: T): void;
    get(): Promise<T>;
    empty(): boolean;
}
