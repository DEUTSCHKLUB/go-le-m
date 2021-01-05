import { Field, Model } from "./base";
import { DemandBuilder } from "./builder";
export { DemandBuilder, Model };
export declare class Identification extends Model {
    name: Field;
    subnet_tag: Field;
    constructor(subnet_tag?: string, name?: string);
}
export declare const IdentificationKeys: any;
export declare class Activity extends Model {
    cost_cap: Field;
    cost_warning: Field;
    timeout_secs: Field;
    expiration: Field;
}
export declare const ActivityKeys: any;
