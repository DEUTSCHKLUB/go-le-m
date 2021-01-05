"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemandDecor = exports.Constraints = exports.resolve_url = exports.DEFAULT_REPO_URL = void 0;
const axios_1 = __importDefault(require("axios"));
exports.DEFAULT_REPO_URL = "http://3.249.139.167:8000";
async function resolve_url(repo_url, image_hash) {
    let resp = await axios_1.default.get(`${repo_url}/image.${image_hash}.link`);
    if (resp.status != 200)
        throw Error(`Error: ${resp.status}`);
    let image_url = await resp.data;
    return `hash:sha3:${image_hash}:${image_url}`;
}
exports.resolve_url = resolve_url;
class Constraints {
    constructor() {
        this.inner = [];
    }
    extend(items) {
        this.inner.push.apply(this.inner, items);
    }
    toString() {
        return `(&${this.inner.join("\n\t")})`;
    }
}
exports.Constraints = Constraints;
class DemandDecor {
    constructor(constr, request, secure = false) {
        this.constr = constr;
        this.request = request;
        this.secure = secure;
    }
    async decorate_demand(demand) {
        demand.ensure(this.constr.toString());
        demand.add(this.request);
    }
}
exports.DemandDecor = DemandDecor;
//# sourceMappingURL=common.js.map