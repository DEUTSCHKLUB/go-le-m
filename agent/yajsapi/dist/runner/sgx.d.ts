import { DemandDecor } from "./common";
import { types } from "sgx-ias-js";
declare class SgxConfig {
    enableAttestation: boolean;
    exeunitHashes: types.bytes.Bytes32[];
    allowDebug: boolean;
    allowOutdatedTcb: boolean;
    maxEvidenceAge: number;
    static from_env(): SgxConfig;
}
export declare const SGX_CONFIG: SgxConfig;
export declare enum SgxEngine {
    GRAPHENE = "sgx",
    JS = "sgx-js",
    WASM = "sgx-wasm",
    WASI = "sgx-wasi"
}
export declare function repo(engine: SgxEngine, image_hash: string, min_mem_gib?: number, min_storage_gib?: number, image_repo?: string): Promise<DemandDecor>;
export {};
