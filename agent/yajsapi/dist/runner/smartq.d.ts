export declare class Handle<Item> {
    private _consumer;
    private _data;
    private _prev_consumers;
    constructor({ data, consumer, ...rest }: {
        [x: string]: any;
        data: any;
        consumer: any;
    });
    consumer(): Consumer<Item> | null;
    assign_consumer(consumer: Consumer<Item>): void;
    data(): Item;
}
export declare class SmartQueue<Item> {
    private _items;
    private _rescheduled_items;
    private _in_progress;
    private __new_items;
    private __eof;
    constructor(items: Array<Item>, retry_cnt?: number, ...rest: any[]);
    new_consumer(): Consumer<Item>;
    __have_data(): boolean;
    __find_rescheduled_item(consumer: Consumer<Item>): Handle<Item> | null;
    get(consumer: Consumer<Item>, callback: Function | null | undefined): AsyncGenerator<Handle<Item>>;
    mark_done(handle: Handle<Item>): Promise<void>;
    reschedule(handle: Handle<Item>): Promise<void>;
    reschedule_all(consumer: Consumer<Item>): Promise<void>;
    stats(): object;
    wait_until_done(): Promise<void>;
    has_unassigned_items(): boolean;
}
export declare class Consumer<Item> {
    private _queue;
    private _fetched?;
    constructor(queue: SmartQueue<Item>);
    ready(): Consumer<Item>;
    done(): null;
    last_item(): Item | null;
    [Symbol.asyncIterator](): AsyncGenerator<Handle<Item>, any, any>;
}
