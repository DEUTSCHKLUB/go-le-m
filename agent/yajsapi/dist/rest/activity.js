"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityService = void 0;
const api_1 = require("ya-ts-client/dist/ya-activity/api");
const sgx_ias_js_1 = require("sgx-ias-js");
const crypto_1 = require("../crypto");
const utils_1 = require("../utils");
const sgx_1 = require("../runner/sgx");
const utf8 = __importStar(require("utf8"));
class ActivityService {
    constructor(cfg) {
        this._api = new api_1.RequestorControlApi(cfg);
        this._state = new api_1.RequestorStateApi(cfg);
    }
    async create_activity(agreement, secure = false) {
        try {
            if (secure) {
                return await this._create_secure_activity(agreement);
            }
            else {
                return await this._create_activity(agreement.id());
            }
        }
        catch (error) {
            utils_1.logger.error(`Failed to create activity for agreement ${agreement.id()}`);
            throw error;
        }
    }
    async _create_activity(agreement_id) {
        let { data: response } = await this._api.createActivity(agreement_id);
        let activity_id = typeof response == "string"
            ? response
            : response.activityId;
        return new Activity(activity_id, this._api, this._state);
    }
    async _create_secure_activity(agreement) {
        let priv_key = new crypto_1.PrivateKey();
        let pub_key = priv_key.publicKey();
        let crypto_ctx;
        let { data: response, } = await this._api.createActivity({
            agreementId: agreement.id(),
            requestorPubKey: pub_key.toString(),
        });
        let activity_id = typeof response == "string"
            ? response
            : response.activityId;
        let credentials = typeof response == "string"
            ? undefined
            : response.credentials;
        try {
            if (!credentials) {
                throw Error("Missing credentials in CreateActivity response");
            }
            if (pub_key.toString() != credentials.sgx.requestorPubKey) {
                throw Error("Invalid requestor public key in CreateActivity response");
            }
            let enclave_key = crypto_1.PublicKey.fromHex(credentials.sgx.enclavePubKey);
            crypto_ctx = await crypto_1.CryptoCtx.from(enclave_key, priv_key);
            if (sgx_1.SGX_CONFIG.enableAttestation) {
                await this._attest(activity_id, agreement, credentials);
            }
        }
        catch (error) {
            await this._api.destroyActivity(activity_id);
            throw error;
        }
        return new SecureActivity(activity_id, credentials.sgx, crypto_ctx, this._api, this._state);
    }
    async _attest(activity_id, agreement, credentials) {
        let demand = (await agreement.details()).raw_details.demand;
        let pkg = demand.properties["golem.srv.comp.task_package"];
        if (!pkg) {
            throw new Error("Invalid agreement: missing package");
        }
        let evidence = {
            report: credentials.sgx.iasReport,
            signature: sgx_ias_js_1.types.parseHex(credentials.sgx.iasSig),
        };
        let verifier = sgx_ias_js_1.attest.AttestationVerifier.from(evidence)
            .data(sgx_ias_js_1.types.parseHex(credentials.sgx.requestorPubKey))
            .data(sgx_ias_js_1.types.parseHex(credentials.sgx.enclavePubKey))
            .data(new TextEncoder().encode(pkg))
            .mr_enclave_list(sgx_1.SGX_CONFIG.exeunitHashes)
            .nonce(utf8.encode(activity_id))
            .max_age(sgx_1.SGX_CONFIG.maxEvidenceAge);
        if (!sgx_1.SGX_CONFIG.allowDebug) {
            verifier.not_debug();
        }
        if (!sgx_1.SGX_CONFIG.allowOutdatedTcb) {
            verifier.not_outdated();
        }
        let result = verifier.verify();
        if (result.verdict != sgx_ias_js_1.attest.AttestationVerdict.Ok) {
            let name = result.verdict.toString();
            throw new Error(`Attestation failed: ${name}: ${result.message}`);
        }
    }
}
exports.ActivityService = ActivityService;
class ExeScriptRequest {
    constructor(text) {
        this.text = text;
    }
}
class Activity {
    constructor(id, _api, _state) {
        this._id = id;
        this._api = _api;
        this._state = _state;
    }
    set id(x) {
        this._id = x;
    }
    get id() {
        return this._id;
    }
    get credentials() {
        return this._credentials;
    }
    get exeunitHashes() {
        return sgx_1.SGX_CONFIG.exeunitHashes.map(value => value.toString());
    }
    async exec(script) {
        let script_txt = JSON.stringify(script);
        let req = new ExeScriptRequest(script_txt);
        let { data: batch_id } = await this._api.exec(this._id, req);
        return new Batch(this, batch_id, script.length);
    }
    async state() {
        let { data: result } = await this._state.getActivityState(this._id);
        let state = result;
        return state;
    }
    async results(batch_id, timeout = 5) {
        let { data: results } = await this._api.getExecBatchResults(this._id, batch_id, undefined, timeout);
        return results;
    }
    async ready() {
        return this;
    }
    async done() {
        try {
            const { data: batch_id } = await this._api.exec(this._id, new ExeScriptRequest('[{"terminate":{}}]'));
            try {
                await this._api.getExecBatchResults(this._id, batch_id, undefined, 1);
            }
            catch (error) {
            }
        }
        catch (error) {
            utils_1.logger.error(`Failed to destroy activity: ${this._id}`);
        }
        finally {
            try {
                await this._api.destroyActivity(this._id);
            }
            catch (error) {
            }
        }
    }
}
class SecureActivity extends Activity {
    constructor(id, credentials, crypto_ctx, _api, _state) {
        super(id, _api, _state);
        this._credentials = credentials;
        this._crypto_ctx = crypto_ctx;
    }
    async exec(script) {
        let cmd = { exec: { exe_script: script } };
        let batch_id = await this._send(crypto_1.rand_hex(32), cmd);
        return new Batch(this, batch_id, script.length);
    }
    async results(batch_id, timeout = 8) {
        let cmd = { getExecBatchResults: { command_index: undefined } };
        let res = await this._send(batch_id, cmd, timeout);
        return res;
    }
    async _send(batch_id, cmd, timeout) {
        let req = new SecureRequest(this._id, batch_id, cmd, timeout);
        let req_buf = Buffer.from(JSON.stringify(req));
        let enc_req = this._crypto_ctx.encrypt(req_buf);
        let { data: enc_res } = await this._api.callEncrypted(this._id, '', {
            responseType: 'arraybuffer',
            headers: {
                'Content-Type': 'application/octet-stream',
                'Accept': 'application/octet-stream'
            },
            transformRequest: [
                (_headers, _data) => enc_req,
            ],
            timeout: 0,
        });
        let res_buf = this._crypto_ctx.decrypt(Buffer.from(enc_res));
        let res = SecureResponse.from_buffer(res_buf);
        return res.unwrap();
    }
}
class SecureRequest {
    constructor(activityId, batchId, command, timeout) {
        this.activityId = activityId;
        this.batchId = batchId;
        this.command = command;
        this.timeout = timeout;
    }
}
class SecureResponse {
    static from_buffer(buffer) {
        return Object.assign(new SecureResponse(), JSON.parse(buffer.toString()));
    }
    unwrap() {
        if (this.command == "error" || !!this.Err) {
            throw new Error(this.Err || this.Ok);
        }
        return this.Ok;
    }
}
class Result {
}
class CommandExecutionError extends Error {
    constructor(key, description) {
        super(description);
        this.name = key;
    }
    toString() {
        return this.message;
    }
}
class Batch {
    constructor(activity, batch_id, batch_size, credentials) {
        this._activity = activity;
        this._batch_id = batch_id;
        this._size = batch_size;
        this.credentials = credentials;
    }
    return(value) {
        throw new Error("Method not implemented.");
    }
    throw(e) {
        throw new Error("Method not implemented.");
    }
    id() {
        this._batch_id;
    }
    async *[Symbol.asyncIterator]() {
        let last_idx = 0;
        while (last_idx < this._size) {
            let any_new = false;
            let results = [];
            try {
                results = await this._activity.results(this._batch_id);
            }
            catch (error) {
                if (error.response && error.response.status == 408) {
                    continue;
                }
                else {
                    if (error.response && error.response.status == 500 && error.response.data) {
                        throw new CommandExecutionError(last_idx.toString(), `Provider might have disconnected (error: ${error.response.data.message})`);
                    }
                    throw error;
                }
            }
            results = results.slice(last_idx);
            for (let result of results) {
                any_new = true;
                if (last_idx != result.index)
                    throw `Expected ${last_idx}, got ${result.index}`;
                if (result.result.toString() == "Error")
                    throw new CommandExecutionError(last_idx.toString(), result.stderr || result.message || "");
                let _result = new Result();
                _result.idx = result.index;
                _result.stdout = result.stdout;
                _result.stderr = result.stderr;
                _result.message = result.message;
                yield _result;
                last_idx = result.index + 1;
                if (result.isBatchFinished)
                    break;
            }
            if (!any_new)
                await utils_1.sleep(3);
        }
        return;
    }
}
//# sourceMappingURL=activity.js.map