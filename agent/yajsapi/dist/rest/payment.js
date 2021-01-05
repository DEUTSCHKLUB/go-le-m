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
exports.Payment = exports.Allocation = exports.InvoiceStatus = exports.Invoice = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const resource_1 = require("./resource");
const yap = __importStar(require("ya-ts-client/dist/ya-payment/src/models"));
const api_1 = require("ya-ts-client/dist/ya-payment/api");
const utils_1 = require("../utils");
dayjs_1.default.extend(utc_1.default);
class yInvoice {
}
class Invoice extends yInvoice {
    constructor(_api, _base) {
        super();
        for (let [key, value] of Object.entries(_base)) {
            this[key] = value;
        }
        this._api = _api;
    }
    async accept(amount, allocation) {
        let acceptance = {
            totalAmountAccepted: amount.toString(),
            allocationId: allocation.id
        };
        acceptance.totalAmountAccepted = amount.toString();
        acceptance.allocationId = allocation.id;
        await this._api.acceptInvoice(this.invoiceId, acceptance);
    }
}
exports.Invoice = Invoice;
exports.InvoiceStatus = yap.InvoiceStatus;
class _Link {
}
class AllocationDetails {
}
class Allocation extends _Link {
    async details() {
        let allocationDetails = new AllocationDetails();
        try {
            let { data: details, } = await this._api.getAllocation(this.id);
            allocationDetails.spent_amount = parseFloat(details.spentAmount);
            allocationDetails.remaining_amount = parseFloat(details.remainingAmount);
        }
        catch (error) {
            utils_1.logger.error(error);
            throw new Error(error);
        }
        return allocationDetails;
    }
    async delete() {
        await this._api.releaseAllocation(this.id);
    }
}
exports.Allocation = Allocation;
class _AllocationTask extends resource_1.ResourceCtx {
    constructor(api, model) {
        super();
        this._api = api;
        this.model = model;
    }
    async ready() {
        try {
            let { data: new_allocation, } = await this._api.createAllocation(this.model);
            this._id = new_allocation.allocationId;
            let model = this.model;
            if (!model.totalAmount)
                throw "";
            if (!model.timeout)
                throw "";
            if (!this._id)
                throw "";
            let _allocation = new Allocation();
            _allocation.id = this._id;
            _allocation._api = this._api;
            _allocation.payment_platform = model.paymentPlatform;
            _allocation.payment_address = model.address;
            _allocation.amount = parseFloat(model.totalAmount);
            _allocation.expires = new Date(parseInt(model.timeout) * 1000);
            return _allocation;
        }
        catch (error) {
            utils_1.logger.error(error);
            throw new Error(error);
        }
    }
    async done() {
        if (this._id) {
            await this._api.releaseAllocation(this._id);
        }
    }
}
class yAllocation {
    constructor() {
        this.allocationId = "";
    }
}
class Payment {
    constructor(cfg) {
        this._api = new api_1.RequestorApi(cfg);
    }
    new_allocation(amount, payment_platform, payment_address, expires = null, make_deposit = false) {
        let allocation_timeout = expires || dayjs_1.default().add(30, "minute").utc().toDate();
        let _allocation = new yAllocation();
        _allocation.paymentPlatform = payment_platform;
        _allocation.address = payment_address;
        _allocation.totalAmount = amount.toString();
        _allocation.timeout = allocation_timeout.toISOString();
        _allocation.makeDeposit = make_deposit;
        _allocation.spentAmount = "";
        _allocation.remainingAmount = "";
        return new _AllocationTask(this._api, _allocation);
    }
    async *allocations() {
        let { data: result } = await this._api.getAllocations();
        for (let alloc_obj of result) {
            let _allocation = new Allocation();
            _allocation._api = this._api;
            _allocation.id = alloc_obj.allocationId;
            _allocation.amount = parseFloat(alloc_obj.totalAmount);
            _allocation.payment_platform = alloc_obj.paymentPlatform;
            _allocation.payment_address = alloc_obj.address;
            _allocation.expires = new Date(parseInt(alloc_obj.timeout) * 1000);
            yield _allocation;
        }
        return;
    }
    async allocation(allocation_id) {
        let { data: result, } = await this._api.getAllocation(allocation_id);
        let allocation_obj = result;
        let _allocation = new Allocation();
        _allocation._api = this._api;
        _allocation.id = allocation_obj.allocationId;
        _allocation.amount = parseFloat(allocation_obj.totalAmount);
        _allocation.payment_platform = allocation_obj.paymentPlatform;
        _allocation.payment_address = allocation_obj.address;
        _allocation.expires = new Date(parseInt(allocation_obj.timeout) * 1000);
        return _allocation;
    }
    async *accounts() {
        let { data: _accounts } = await this._api.getSendAccounts();
        for (let account_obj of _accounts) {
            yield account_obj;
        }
    }
    async decorate_demand(ids) {
        const { data: _decorate_demand } = await this._api.decorateDemand(ids);
        return _decorate_demand;
    }
    async *invoices() {
        let { data: result } = await this._api.getReceivedInvoices();
        for (let invoice_obj of result) {
            yield new Invoice(this._api, invoice_obj);
        }
        return;
    }
    async invoice(invoice_id) {
        let { data: invoice_obj } = await this._api.getReceivedInvoice(invoice_id);
        return new Invoice(this._api, invoice_obj);
    }
    incoming_invoices(cancellationToken) {
        let ts = dayjs_1.default().utc();
        let api = this._api;
        let self = this;
        async function* fetch(init_ts) {
            let ts = init_ts;
            while (true) {
                if (cancellationToken.cancelled)
                    break;
                let { data: items } = await api.getRequestorInvoiceEvents(5, ts.format("YYYY-MM-DD HH:mm:ss.SSSSSSZ"));
                for (let ev of items) {
                    ts = dayjs_1.default(new Date(parseInt(ev.timestamp) * 1000));
                    if (ev.eventType == yap.EventType.RECEIVED) {
                        let invoice = await self.invoice(ev.invoiceId);
                        yield invoice;
                    }
                }
            }
            return;
        }
        return fetch(ts);
    }
}
exports.Payment = Payment;
//# sourceMappingURL=payment.js.map