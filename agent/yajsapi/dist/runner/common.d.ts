import { DemandBuilder } from "../props/builder";
import { ExeUnitRequest } from "../props/inf";
export declare const DEFAULT_REPO_URL = "http://3.249.139.167:8000";
export declare function resolve_url(repo_url: string, image_hash: string): Promise<string>;
export declare class Constraints {
    inner: string[];
    constructor();
    extend(items: string[]): void;
    toString(): string;
}
export declare class DemandDecor {
    constr: Constraints;
    request: ExeUnitRequest;
    secure: boolean;
    constructor(constr: Constraints, request: ExeUnitRequest, secure?: boolean);
    decorate_demand(demand: DemandBuilder): Promise<void>;
}
