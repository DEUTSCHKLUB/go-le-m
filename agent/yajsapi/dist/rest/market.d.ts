import { Model } from "../props";
import { RequestorApi } from "ya-ts-client/dist/ya-market/api";
import * as models from "ya-ts-client/dist/ya-market/src/models";
import { Configuration } from "ya-ts-client/dist/ya-activity";
declare class AgreementDetails extends Object {
    raw_details: models.Agreement;
    constructor(_ref: models.Agreement);
    view_prov(c: Model): Model;
}
export declare class Agreement {
    private _api;
    private _subscription;
    private _id;
    constructor(api: RequestorApi, subscription: Subscription, agreement_id: string);
    id(): string;
    details(): Promise<AgreementDetails>;
    confirm(): Promise<boolean>;
}
export declare class OfferProposal {
    private _proposal;
    private _subscription;
    constructor(subscription: Subscription, proposal: models.ProposalEvent);
    issuer(): string;
    id(): string;
    props(): object;
    is_draft(): boolean;
    reject(_reason?: string | null): Promise<void>;
    respond(props: object, constraints: string): Promise<string>;
    agreement(timeout?: number): Promise<Agreement>;
}
export declare class Subscription {
    _api: RequestorApi;
    private _id;
    private _open;
    private _deleted;
    private _details;
    constructor(api: RequestorApi, subscription_id: string, _details?: models.Demand | null);
    id(): string;
    close(): void;
    ready(): Promise<this>;
    done(): Promise<void>;
    details(): models.Demand;
    delete(): Promise<void>;
    events(cancellationToken?: any): AsyncGenerator<OfferProposal>;
}
export declare class Market {
    private _api;
    constructor(cfg: Configuration);
    subscribe(props: {}, constraints: string): Promise<Subscription>;
    subscriptions(): AsyncGenerator<Subscription>;
}
export {};
