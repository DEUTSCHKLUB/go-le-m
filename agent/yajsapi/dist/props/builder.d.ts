import { Market, Subscription } from "../rest/market";
export declare class DemandBuilder {
    _props: Object;
    _constraints: string[];
    constructor();
    props(): object;
    cons(): string;
    ensure(constraint: string): void;
    add(m: any): void;
    subscribe(market: Market): Promise<Subscription>;
}
