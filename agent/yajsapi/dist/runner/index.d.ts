import { MarketDecoration } from "ya-ts-client/dist/ya-payment/src/models";
import { WorkContext, Work } from "./ctx";
import * as events from "./events";
import { Counter } from "../props/com";
import { Activity } from "../props";
import { DemandBuilder } from "../props/builder";
import * as rest from "../rest";
import { OfferProposal } from "../rest/market";
import { Allocation, Invoice } from "../rest/payment";
import { Callable } from "../utils";
import * as _common from "./common";
export declare const sgx: typeof rest.sgx;
export declare const vm: typeof rest.vm;
import { Task, TaskStatus } from "./task";
export { Task, TaskStatus };
export declare class _EngineConf {
    max_workers: Number;
    timeout: number;
    get_offers_timeout: number;
    traceback: boolean;
    constructor(max_workers: any, timeout: any);
}
export declare class MarketStrategy {
    decorate_demand(demand: DemandBuilder): Promise<void>;
    score_offer(offer: OfferProposal): Promise<Number>;
}
interface MarketGeneral extends MarketStrategy, Object {
}
declare class MarketGeneral {
}
export declare class DummyMS extends MarketGeneral {
    max_for_counter: Map<Counter, Number>;
    max_fixed: Number;
    _activity?: Activity;
    decorate_demand(demand: DemandBuilder): Promise<void>;
    score_offer(offer: OfferProposal): Promise<Number>;
}
export declare class LeastExpensiveLinearPayuMS {
    private _expected_time_secs;
    constructor(expected_time_secs?: number);
    decorate_demand(demand: DemandBuilder): Promise<void>;
    score_offer(offer: OfferProposal): Promise<Number>;
}
export declare class _BufferItem {
    ts: Date;
    score: Number;
    proposal: OfferProposal;
    constructor(ts: any, score: any, proposal: any);
}
declare type D = "D";
declare type R = "R";
export declare class Engine {
    private _subnet;
    private _strategy;
    private _api_config;
    private _stack;
    private _demand_decor;
    private _conf;
    private _expires;
    private _budget_amount;
    private _budget_allocations;
    private _activity_api;
    private _market_api;
    private _payment_api;
    private _wrapped_emitter;
    private _cancellation_token;
    private _worker_cancellation_token;
    constructor(_demand_decor: _common.DemandDecor, max_workers: Number | undefined, timeout: any, budget: string, strategy?: MarketStrategy, subnet_tag?: string, event_emitter?: Callable<[events.YaEvent], void>);
    map(worker: Callable<[WorkContext, AsyncIterable<Task<D, R>>], AsyncGenerator<Work>>, data: Iterable<Task<D, R>>): AsyncGenerator<Task<D, R>>;
    _create_allocations(): Promise<MarketDecoration>;
    _get_common_payment_platforms(proposal: OfferProposal): string[];
    allocation_for_invoice(invoice: Invoice): Allocation;
    ready(): Promise<Engine>;
    done(this: any): Promise<void>;
}
