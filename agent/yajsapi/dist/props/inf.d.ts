import { Field, Model } from "./base";
export declare const INF_MEM: string;
export declare const INF_STORAGE: string;
export declare const INF_CORES: string;
export declare const INF_RUNTIME: string;
export declare const TRANSFER_CAPS: string;
export declare enum RuntimeType {
    UNKNOWN = "",
    WASMTIME = "wasmtime",
    EMSCRIPTEN = "emscripten",
    VM = "vm",
    SGX = "sgx",
    SGX_JS = "sgx-js",
    SGX_WASM = "sgx-wasm",
    SGX_WASI = "sgx-wasi"
}
export declare class InfBase {
    cores: Field;
    mem: Field;
    runtime: Field;
    storage?: Field;
    transfers: Field;
    static fields(inf: InfBase, keys: string[]): {};
}
export declare class ExeUnitRequest extends Model {
    package_url: Field;
    constructor(package_url: any);
}
