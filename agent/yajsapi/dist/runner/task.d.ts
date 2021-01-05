import { Callable } from "../utils";
import * as events from "./events";
import { Handle, SmartQueue } from "./smartq";
export declare enum TaskStatus {
    WAITING = "wait",
    RUNNING = "run",
    ACCEPTED = "accept",
    REJECTED = "reject"
}
export declare class Task<TaskData, TaskResult> {
    static count: number;
    id: number;
    private _started;
    private _expires;
    private _emit_event;
    private _callbacks;
    private _handle?;
    private _result?;
    private _data;
    private _status;
    constructor(data: TaskData, expires?: number | null, timeout?: number | null);
    _add_callback(callback: Function): void;
    _start(_emitter: any): void;
    _stop(retry?: boolean): void;
    static for_handle(handle: Handle<Task<any, any>>, queue: SmartQueue<Task<any, any>>, emitter: Callable<[events.YaEvent], void>): Task<"TaskData", "TaskResult">;
    status(): TaskStatus;
    data(): TaskData;
    output(): TaskResult | null | undefined;
    expires(): number | null;
    accept_task(result?: TaskResult | null): void;
    reject_task(reason?: string | null, retry?: boolean): void;
    static get counter(): number;
}
