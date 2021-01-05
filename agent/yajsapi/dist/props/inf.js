"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExeUnitRequest = exports.InfBase = exports.RuntimeType = exports.TRANSFER_CAPS = exports.INF_RUNTIME = exports.INF_CORES = exports.INF_STORAGE = exports.INF_MEM = void 0;
const base_1 = require("./base");
exports.INF_MEM = "golem.inf.mem.gib";
exports.INF_STORAGE = "golem.inf.storage.gib";
exports.INF_CORES = "golem.inf.cpu.cores";
exports.INF_RUNTIME = "golem.runtime.name";
exports.TRANSFER_CAPS = "golem.activity.caps.transfer.protocol";
var RuntimeType;
(function (RuntimeType) {
    RuntimeType["UNKNOWN"] = "";
    RuntimeType["WASMTIME"] = "wasmtime";
    RuntimeType["EMSCRIPTEN"] = "emscripten";
    RuntimeType["VM"] = "vm";
    RuntimeType["SGX"] = "sgx";
    RuntimeType["SGX_JS"] = "sgx-js";
    RuntimeType["SGX_WASM"] = "sgx-wasm";
    RuntimeType["SGX_WASI"] = "sgx-wasi";
})(RuntimeType = exports.RuntimeType || (exports.RuntimeType = {}));
class InfBase {
    constructor() {
        this.cores = new base_1.Field({ metadata: { key: exports.INF_CORES } });
        this.mem = new base_1.Field({ metadata: { key: exports.INF_MEM } });
        this.runtime = new base_1.Field({ metadata: { key: exports.INF_RUNTIME } });
        this.storage = new base_1.Field({ metadata: { key: exports.INF_STORAGE } });
        this.transfers = new base_1.Field({ metadata: { key: exports.TRANSFER_CAPS } });
    }
    static fields(inf, keys) {
        return getFields(inf, keys);
    }
}
exports.InfBase = InfBase;
function getFields(obj, keys) {
    let fields = {};
    keys.forEach((key) => {
        fields[key] = obj[key].metadata.key;
    });
    return fields;
}
class ExeUnitRequest extends base_1.Model {
    constructor(package_url) {
        super();
        this.package_url = new base_1.Field({
            metadata: { key: "golem.srv.comp.task_package" },
        });
        this.package_url.value = package_url;
    }
}
exports.ExeUnitRequest = ExeUnitRequest;
//# sourceMappingURL=inf.js.map