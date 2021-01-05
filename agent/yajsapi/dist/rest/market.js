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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Market = exports.Subscription = exports.OfferProposal = exports.Agreement = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const utils_1 = require("../utils");
const api_1 = require("ya-ts-client/dist/ya-market/api");
const models = __importStar(require("ya-ts-client/dist/ya-market/src/models"));
dayjs_1.default.extend(utc_1.default);
class AgreementDetails extends Object {
    constructor(_ref) {
        super();
        this.raw_details = _ref;
    }
    view_prov(c) {
        let offer = this.raw_details.offer;
        return c.from_props(offer.properties);
    }
}
class Agreement {
    constructor(api, subscription, agreement_id) {
        this._api = api;
        this._subscription = subscription;
        this._id = agreement_id;
    }
    id() {
        return this._id;
    }
    async details() {
        let { data } = await this._api.getAgreement(this._id);
        return new AgreementDetails(data);
    }
    async confirm() {
        await this._api.confirmAgreement(this._id);
        let { data: msg } = await this._api.waitForApproval(this._id, 90, 100);
        return msg.trim().toLowerCase() == "approved";
    }
}
exports.Agreement = Agreement;
class mProposal {
}
class mAgreementProposal {
}
class OfferProposal {
    constructor(subscription, proposal) {
        this._proposal = proposal;
        this._subscription = subscription;
    }
    issuer() {
        return this._proposal.proposal.issuerId || "";
    }
    id() {
        return this._proposal.proposal.proposalId || "";
    }
    props() {
        return this._proposal.proposal.properties;
    }
    is_draft() {
        return (this._proposal.proposal.state == models.ProposalAllOfStateEnum.Draft);
    }
    async reject(_reason = null) {
        await this._subscription._api.rejectProposalOffer(this._subscription.id(), this.id());
    }
    async respond(props, constraints) {
        let proposal = new mProposal();
        proposal.properties = props;
        proposal.constraints = constraints;
        let { data: new_proposal, } = await this._subscription._api.counterProposalDemand(this._subscription.id(), this.id(), proposal);
        return new_proposal;
    }
    async agreement(timeout = 3600) {
        let proposal = new mAgreementProposal();
        proposal.proposalId = this.id();
        proposal.validTo = dayjs_1.default()
            .add(timeout, "second")
            .utc()
            .format("YYYY-MM-DD HH:mm:ss.SSSSSSZ");
        let api = this._subscription._api;
        let { data: agreement_id } = await api.createAgreement(proposal);
        return new Agreement(api, this._subscription, agreement_id);
    }
}
exports.OfferProposal = OfferProposal;
class Subscription {
    constructor(api, subscription_id, _details = null) {
        this._api = api;
        this._id = subscription_id;
        this._open = true;
        this._deleted = false;
        this._details = _details;
    }
    id() {
        return this._id;
    }
    close() {
        this._open = false;
    }
    async ready() {
        return this;
    }
    async done() {
        await this.delete();
    }
    details() {
        if (!this._details)
            throw "expected details on list object";
        return this._details;
    }
    async delete() {
        this._open = false;
        if (!this._deleted) {
            await this._api.unsubscribeDemand(this._id);
        }
    }
    async *events(cancellationToken) {
        while (this._open) {
            if (cancellationToken && cancellationToken.cancelled)
                break;
            try {
                let { data: proposals } = await this._api.collectOffers(this._id, 10, 10);
                for (let _proposal of proposals) {
                    yield new OfferProposal(this, _proposal);
                }
                if (!proposals || !proposals.length) {
                    await utils_1.sleep(2);
                }
            }
            catch (error) {
                utils_1.logger.error(error);
                throw Error(error);
            }
        }
        return;
    }
}
exports.Subscription = Subscription;
class mDemand {
    constructor() {
        this.demandId = "";
        this.requestorId = "";
    }
}
class Market {
    constructor(cfg) {
        this._api = new api_1.RequestorApi(cfg);
    }
    subscribe(props, constraints) {
        let request = new mDemand();
        request.properties = props;
        request.constraints = constraints;
        let self = this;
        async function create() {
            try {
                let { data: sub_id } = await self._api.subscribeDemand(request);
                return new Subscription(self._api, sub_id);
            }
            catch (error) {
                utils_1.logger.error(error);
                throw new Error(error);
            }
        }
        return create();
    }
    async *subscriptions() {
        try {
            let { data: demands } = await this._api.getDemands();
            for (let demand of demands) {
                yield new Subscription(this._api, demand.demandId, demand);
            }
        }
        catch (error) {
            utils_1.logger.warn(`getDemands error: ${error}`);
        }
        return;
    }
}
exports.Market = Market;
//# sourceMappingURL=market.js.map