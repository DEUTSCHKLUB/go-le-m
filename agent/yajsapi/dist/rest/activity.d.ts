import { RequestorControlApi, RequestorStateApi } from "ya-ts-client/dist/ya-activity/api";
import * as yaa from "ya-ts-client/dist/ya-activity/src/models";
import { Configuration } from "ya-ts-client/dist/ya-activity";
import { Credentials, ExeScriptCommandResult, SgxCredentials } from "ya-ts-client/dist/ya-activity/src/models";
import { CryptoCtx } from "../crypto";
import { Agreement } from "./market";
export declare class ActivityService {
    private _api;
    private _state;
    constructor(cfg: Configuration);
    create_activity(agreement: Agreement, secure?: boolean): Promise<Activity>;
    _create_activity(agreement_id: string): Promise<Activity>;
    _create_secure_activity(agreement: Agreement): Promise<SecureActivity>;
    _attest(activity_id: string, agreement: Agreement, credentials: Credentials): Promise<void>;
}
declare class Activity {
    protected _api: RequestorControlApi;
    protected _state: RequestorStateApi;
    protected _id: string;
    protected _credentials?: object;
    constructor(id: string, _api: RequestorControlApi, _state: RequestorStateApi);
    set id(x: string);
    get id(): string;
    get credentials(): object | undefined;
    get exeunitHashes(): string[] | undefined;
    exec(script: object[]): Promise<Batch>;
    state(): Promise<yaa.ActivityState>;
    results(batch_id: string, timeout?: number): Promise<ExeScriptCommandResult[]>;
    ready(): Promise<Activity>;
    done(): Promise<void>;
}
declare class SecureActivity extends Activity {
    _crypto_ctx: CryptoCtx;
    constructor(id: string, credentials: SgxCredentials, crypto_ctx: CryptoCtx, _api: RequestorControlApi, _state: RequestorStateApi);
    exec(script: object[]): Promise<Batch>;
    results(batch_id: string, timeout?: number): Promise<ExeScriptCommandResult[]>;
    _send(batch_id: string, cmd: object, timeout?: number): Promise<any>;
}
declare class Result {
    idx: Number;
    stdout?: string;
    stderr?: string;
    message?: string;
}
declare class Batch implements AsyncIterable<Result> {
    private _activity;
    private _batch_id;
    private _size;
    credentials?: SgxCredentials;
    constructor(activity: Activity, batch_id: string, batch_size: number, credentials?: SgxCredentials);
    return(value: any): Promise<IteratorResult<Result, any>>;
    throw(e: any): Promise<IteratorResult<Result, any>>;
    id(): void;
    [Symbol.asyncIterator](): any;
}
export {};
