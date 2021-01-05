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
exports.Engine = exports._BufferItem = exports.LeastExpensiveLinearPayuMS = exports.DummyMS = exports.MarketStrategy = exports._EngineConf = exports.TaskStatus = exports.Task = exports.vm = exports.sgx = void 0;
const bluebird_1 = __importStar(require("bluebird"));
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const duration_1 = __importDefault(require("dayjs/plugin/duration"));
const ctx_1 = require("./ctx");
const events = __importStar(require("./events"));
const com_1 = require("../props/com");
const props_1 = require("../props");
const builder_1 = require("../props/builder");
const rest = __importStar(require("../rest"));
const gftp = __importStar(require("../storage/gftp"));
const utils_1 = require("../utils");
const _vm = __importStar(require("./vm"));
const _sgx = __importStar(require("./sgx"));
exports.sgx = _sgx;
exports.vm = _vm;
const task_1 = require("./task");
Object.defineProperty(exports, "Task", { enumerable: true, get: function () { return task_1.Task; } });
Object.defineProperty(exports, "TaskStatus", { enumerable: true, get: function () { return task_1.TaskStatus; } });
const smartq_1 = require("./smartq");
dayjs_1.default.extend(duration_1.default);
dayjs_1.default.extend(utc_1.default);
const SIGNALS = ["SIGINT", "SIGTERM", "SIGBREAK", "SIGHUP"];
const CFG_INVOICE_TIMEOUT = dayjs_1.default
    .duration({ minutes: 5 })
    .asMilliseconds();
const SCORE_NEUTRAL = 0.0;
const SCORE_REJECTED = -1.0;
const SCORE_TRUSTED = 100.0;
const CFF_DEFAULT_PRICE_FOR_COUNTER = new Map([
    [com_1.Counter.TIME, parseFloat("0.002")],
    [com_1.Counter.CPU, parseFloat("0.002") * 10],
]);
class _EngineConf {
    constructor(max_workers, timeout) {
        this.max_workers = 5;
        this.timeout = dayjs_1.default.duration({ minutes: 5 }).asMilliseconds();
        this.get_offers_timeout = dayjs_1.default.duration({ seconds: 20 }).asMilliseconds();
        this.traceback = false;
        this.max_workers = max_workers;
        this.timeout = timeout;
    }
}
exports._EngineConf = _EngineConf;
class MarketStrategy {
    async decorate_demand(demand) { }
    async score_offer(offer) {
        return SCORE_REJECTED;
    }
}
exports.MarketStrategy = MarketStrategy;
class MarketGeneral {
}
utils_1.applyMixins(MarketGeneral, [MarketStrategy, Object]);
class DummyMS extends MarketGeneral {
    constructor() {
        super(...arguments);
        this.max_for_counter = CFF_DEFAULT_PRICE_FOR_COUNTER;
        this.max_fixed = parseFloat("0.05");
    }
    async decorate_demand(demand) {
        demand.ensure(`(${com_1.PRICE_MODEL}=${com_1.PriceModel.LINEAR})`);
        this._activity = new props_1.Activity().from_props(demand._props);
    }
    async score_offer(offer) {
        const linear = new com_1.ComLinear().from_props(offer.props());
        if (linear.scheme.value != com_1.BillingScheme.PAYU) {
            return SCORE_REJECTED;
        }
        if (linear.fixed_price > this.max_fixed)
            return SCORE_REJECTED;
        for (const [counter, price] of Object.entries(linear.price_for)) {
            if (!this.max_for_counter.has(counter))
                return SCORE_REJECTED;
            if (price > this.max_for_counter.get(counter))
                return SCORE_REJECTED;
        }
        return SCORE_NEUTRAL;
    }
}
exports.DummyMS = DummyMS;
class LeastExpensiveLinearPayuMS {
    constructor(expected_time_secs = 60) {
        this._expected_time_secs = expected_time_secs;
    }
    async decorate_demand(demand) {
        demand.ensure(`(${com_1.PRICE_MODEL}=${com_1.PriceModel.LINEAR})`);
    }
    async score_offer(offer) {
        const linear = new com_1.ComLinear().from_props(offer.props());
        if (linear.scheme.value != com_1.BillingScheme.PAYU)
            return SCORE_REJECTED;
        const known_time_prices = [com_1.Counter.TIME, com_1.Counter.CPU];
        for (const counter in Object.keys(linear.price_for)) {
            if (!(counter in known_time_prices))
                return SCORE_REJECTED;
        }
        if (linear.fixed_price < 0)
            return SCORE_REJECTED;
        let expected_price = linear.fixed_price;
        for (const resource in known_time_prices) {
            if (linear.price_for[resource] < 0)
                return SCORE_REJECTED;
            expected_price += linear.price_for[resource] * this._expected_time_secs;
        }
        const score = (SCORE_TRUSTED * 1.0) / (expected_price + 1.01);
        return score;
    }
}
exports.LeastExpensiveLinearPayuMS = LeastExpensiveLinearPayuMS;
class _BufferItem {
    constructor(ts, score, proposal) {
        this.ts = ts;
        this.score = score;
        this.proposal = proposal;
    }
}
exports._BufferItem = _BufferItem;
class Engine {
    constructor(_demand_decor, max_workers = 5, timeout = dayjs_1.default.duration({ minutes: 5 }).asMilliseconds(), budget, strategy = new DummyMS(), subnet_tag, event_emitter) {
        this._subnet = subnet_tag;
        this._strategy = strategy;
        this._api_config = new rest.Configuration();
        this._stack = new utils_1.AsyncExitStack();
        this._demand_decor = _demand_decor;
        this._conf = new _EngineConf(max_workers, timeout);
        this._budget_amount = parseFloat(budget);
        this._budget_allocations = [];
        this._cancellation_token = new utils_1.CancellationToken();
        let cancellationToken = this._cancellation_token;
        this._worker_cancellation_token = new utils_1.CancellationToken();
        function cancel(e) {
            if (cancellationToken && !cancellationToken.cancelled) {
                cancellationToken.cancel();
            }
            SIGNALS.forEach((event) => {
                process.off(event, cancel);
            });
        }
        SIGNALS.forEach((event) => process.on(event, cancel));
        if (!event_emitter) {
        }
        this._wrapped_emitter =
            event_emitter && new utils_1.AsyncWrapper(event_emitter, null, cancellationToken);
    }
    async *map(worker, data) {
        const emit = (this._wrapped_emitter.async_call.bind(this._wrapped_emitter));
        const multi_payment_decoration = await this._create_allocations();
        emit(new events.ComputationStarted());
        let builder = new builder_1.DemandBuilder();
        let _activity = new props_1.Activity();
        _activity.expiration.value = this._expires;
        builder.add(_activity);
        builder.add(new props_1.Identification(this._subnet));
        if (this._subnet)
            builder.ensure(`(${props_1.IdentificationKeys.subnet_tag}=${this._subnet})`);
        for (let constraint of multi_payment_decoration.constraints) {
            builder.ensure(constraint);
        }
        for (let x of multi_payment_decoration.properties) {
            builder._props[x.key] = x.value;
        }
        await this._demand_decor.decorate_demand(builder);
        await this._strategy.decorate_demand(builder);
        let offer_buffer = {};
        let market_api = this._market_api;
        let activity_api = this._activity_api;
        let strategy = this._strategy;
        let cancellationToken = this._cancellation_token;
        let done_queue = new utils_1.Queue([], cancellationToken);
        function on_task_done(task, status) {
            if (status === task_1.TaskStatus.ACCEPTED)
                done_queue.put(task);
        }
        function* input_tasks() {
            for (let task of data) {
                task._add_callback(on_task_done);
                yield task;
            }
        }
        let work_queue = new smartq_1.SmartQueue([...input_tasks()]);
        let workers = new Set();
        let last_wid = 0;
        let self = this;
        let agreements_to_pay = new Set();
        let invoices = new Map();
        let payment_closing = false;
        let secure = this._demand_decor.secure;
        let offers_collected = 0;
        let proposals_confirmed = 0;
        async function process_invoices() {
            for await (let invoice of self._payment_api.incoming_invoices(cancellationToken)) {
                if (agreements_to_pay.has(invoice.agreementId)) {
                    emit(new events.InvoiceReceived({
                        agr_id: invoice.agreementId,
                        inv_id: invoice.invoiceId,
                        amount: invoice.amount,
                    }));
                    emit(new events.CheckingPayments());
                    const allocation = self.allocation_for_invoice(invoice);
                    try {
                        await invoice.accept(invoice.amount, allocation);
                        agreements_to_pay.delete(invoice.agreementId);
                        emit(new events.PaymentAccepted({
                            agr_id: invoice.agreementId,
                            inv_id: invoice.invoiceId,
                            amount: invoice.amount,
                        }));
                    }
                    catch (e) {
                        emit(new events.PaymentFailed({ agr_id: invoice.agreementId }));
                    }
                }
                else {
                    invoices[invoice.agreementId] = invoice;
                }
                if (payment_closing && agreements_to_pay.size === 0) {
                    break;
                }
            }
        }
        async function accept_payment_for_agreement({ agreement_id, partial, }) {
            emit(new events.PaymentPrepared({ agr_id: agreement_id }));
            let inv = invoices.get(agreement_id);
            if (!inv) {
                agreements_to_pay.add(agreement_id);
                emit(new events.PaymentQueued({ agr_id: agreement_id }));
                return;
            }
            invoices.delete(agreement_id);
            const allocation = self.allocation_for_invoice(inv);
            await inv.accept(inv.amount, allocation);
            emit(new events.PaymentAccepted({
                agr_id: agreement_id,
                inv_id: inv.invoiceId,
                amount: inv.amount,
            }));
        }
        async function find_offers() {
            let _subscription;
            try {
                _subscription = await builder.subscribe(market_api);
            }
            catch (error) {
                emit(new events.SubscriptionFailed({ reason: error }));
                throw error;
            }
            await utils_1.asyncWith(_subscription, async (subscription) => {
                emit(new events.SubscriptionCreated({ sub_id: subscription.id() }));
                let _proposals;
                try {
                    _proposals = subscription.events(self._worker_cancellation_token);
                }
                catch (error) {
                    emit(new events.CollectFailed({
                        sub_id: subscription.id(),
                        reason: error,
                    }));
                }
                for await (let proposal of _proposals) {
                    emit(new events.ProposalReceived({
                        prop_id: proposal.id(),
                        provider_id: proposal.issuer(),
                    }));
                    offers_collected += 1;
                    let score;
                    try {
                        score = await strategy.score_offer(proposal);
                    }
                    catch (error) {
                        emit(new events.ProposalRejected({
                            prop_id: proposal.id(),
                            reason: error,
                        }));
                        continue;
                    }
                    if (score < SCORE_NEUTRAL) {
                        try {
                            await proposal.reject();
                            emit(new events.ProposalRejected({ prop_id: proposal.id() }));
                        }
                        catch (error) {
                            utils_1.logger.log("debug", `Reject error: ${error}`);
                        }
                        continue;
                    }
                    if (!proposal.is_draft()) {
                        try {
                            const common_platforms = self._get_common_payment_platforms(proposal);
                            if (common_platforms.length) {
                                builder._props["golem.com.payment.chosen-platform"] =
                                    common_platforms[0];
                            }
                            else {
                                try {
                                    await proposal.reject();
                                    emit(new events.ProposalRejected({
                                        prop_id: proposal.id,
                                        reason: "No common payment platforms",
                                    }));
                                }
                                catch (error) {
                                }
                            }
                            await proposal.respond(builder.props(), builder.cons());
                            emit(new events.ProposalResponded({ prop_id: proposal.id() }));
                        }
                        catch (error) {
                            emit(new events.ProposalFailed({
                                prop_id: proposal.id(),
                                reason: error,
                            }));
                        }
                    }
                    else {
                        emit(new events.ProposalConfirmed({ prop_id: proposal.id() }));
                        offer_buffer[proposal.issuer()] = new _BufferItem(Date.now(), score, proposal);
                        proposals_confirmed += 1;
                    }
                }
            });
        }
        let storage_manager = await this._stack.enter_async_context(gftp.provider());
        async function start_worker(agreement) {
            let wid = last_wid;
            last_wid += 1;
            emit(new events.WorkerStarted({ agr_id: agreement.id() }));
            let _act;
            try {
                _act = await activity_api.create_activity(agreement, secure);
            }
            catch (error) {
                emit(new events.ActivityCreateFailed({ agr_id: agreement.id() }));
                throw error;
            }
            async function* task_emitter(consumer) {
                for await (let handle of consumer) {
                    yield task_1.Task.for_handle(handle, work_queue, emit);
                }
            }
            await utils_1.asyncWith(_act, async (act) => {
                emit(new events.ActivityCreated({
                    act_id: act.id,
                    agr_id: agreement.id(),
                }));
                let work_context = new ctx_1.WorkContext(`worker-${wid}`, storage_manager, emit);
                await utils_1.asyncWith(work_queue.new_consumer(), async (consumer) => {
                    let command_generator = worker(work_context, task_emitter(consumer));
                    for await (let batch of command_generator) {
                        try {
                            let current_worker_task = consumer.last_item();
                            if (current_worker_task) {
                                emit(new events.TaskStarted({
                                    agr_id: agreement.id(),
                                    task_id: current_worker_task.id,
                                    task_data: current_worker_task.data(),
                                }));
                            }
                            let task_id = current_worker_task
                                ? current_worker_task.id
                                : null;
                            batch.attestation = {
                                credentials: act.credentials,
                                nonce: act.id,
                                exeunitHashes: act.exeunitHashes,
                            };
                            await batch.prepare();
                            let cc = new ctx_1.CommandContainer();
                            batch.register(cc);
                            let remote = await act.exec(cc.commands());
                            emit(new events.ScriptSent({
                                agr_id: agreement.id(),
                                task_id: task_id,
                                cmds: cc.commands(),
                            }));
                            emit(new events.CheckingPayments());
                            try {
                                for await (let step of remote) {
                                    batch.output.push(step);
                                    emit(new events.CommandExecuted({
                                        success: true,
                                        agr_id: agreement.id(),
                                        task_id: task_id,
                                        command: cc.commands()[step.idx],
                                        message: step.message,
                                        cmd_idx: step.idx,
                                    }));
                                }
                            }
                            catch (error) {
                                const { name: cmd_idx, description } = error;
                                if (cmd_idx) {
                                    emit(new events.CommandExecuted({
                                        success: false,
                                        agr_id: agreement.id(),
                                        task_id: task_id,
                                        command: cc.commands()[cmd_idx],
                                        message: description,
                                        cmd_idx: cmd_idx,
                                    }));
                                }
                                throw error;
                            }
                            emit(new events.GettingResults({
                                agr_id: agreement.id(),
                                task_id: task_id,
                            }));
                            await batch.post();
                            emit(new events.ScriptFinished({
                                agr_id: agreement.id(),
                                task_id: task_id,
                            }));
                            await accept_payment_for_agreement({
                                agreement_id: agreement.id(),
                                partial: true,
                            });
                        }
                        catch (error) {
                            try {
                                await command_generator.throw(error);
                            }
                            catch (error) {
                                emit(new events.WorkerFinished({
                                    agr_id: agreement.id(),
                                    exception: error,
                                }));
                                return;
                            }
                        }
                    }
                });
                await accept_payment_for_agreement({
                    agreement_id: agreement.id(),
                    partial: false,
                });
                emit(new events.WorkerFinished({
                    agr_id: agreement.id(),
                    exception: undefined,
                }));
            });
        }
        async function worker_starter() {
            while (true) {
                if (self._worker_cancellation_token.cancelled)
                    break;
                await utils_1.sleep(2);
                if (Object.keys(offer_buffer).length > 0 &&
                    workers.size < self._conf.max_workers &&
                    work_queue.has_unassigned_items()) {
                    let _offer_list = Object.entries(offer_buffer);
                    let _sample = _offer_list[Math.floor(Math.random() * Object.keys(offer_buffer).length)];
                    let [provider_id, buffer] = _sample;
                    delete offer_buffer[provider_id];
                    let new_task = null;
                    let agreement = null;
                    try {
                        agreement = await buffer.proposal.agreement();
                        const provider_info = (await agreement.details()).view_prov(new props_1.Identification());
                        emit(new events.AgreementCreated({
                            agr_id: agreement.id(),
                            provider_id: provider_info,
                        }));
                        if (!(await agreement.confirm())) {
                            emit(new events.AgreementRejected({ agr_id: agreement.id() }));
                            continue;
                        }
                        emit(new events.AgreementConfirmed({ agr_id: agreement.id() }));
                        new_task = loop.create_task(start_worker.bind(null, agreement));
                        workers.add(new_task);
                    }
                    catch (error) {
                        if (new_task)
                            new_task.cancel();
                        emit(new events.ProposalFailed({
                            prop_id: buffer.proposal.id(),
                            reason: error.toString(),
                        }));
                    }
                }
            }
        }
        async function promise_timeout(seconds) {
            return bluebird_1.default.coroutine(function* () {
                yield utils_1.sleep(seconds);
            })();
        }
        let loop = utils_1.eventLoop();
        let find_offers_task = loop.create_task(find_offers);
        let process_invoices_job = loop.create_task(process_invoices);
        let wait_until_done = loop.create_task(work_queue.wait_until_done.bind(work_queue));
        let get_offers_deadline = dayjs_1.default.utc() + this._conf.get_offers_timeout;
        let get_done_task = null;
        let worker_starter_task = loop.create_task(worker_starter);
        let services = [
            find_offers_task,
            worker_starter_task,
            process_invoices_job,
            wait_until_done,
        ];
        try {
            while (services.indexOf(wait_until_done) > -1 || !done_queue.empty()) {
                const now = dayjs_1.default.utc();
                if (now > this._expires) {
                    throw new bluebird_1.TimeoutError(`task timeout exceeded. timeout=${this._conf.timeout}`);
                }
                if (now > get_offers_deadline && proposals_confirmed == 0) {
                    emit(new events.NoProposalsConfirmed({
                        num_offers: offers_collected,
                        timeout: this._conf.get_offers_timeout,
                    }));
                    get_offers_deadline += this._conf.get_offers_timeout;
                }
                if (!get_done_task) {
                    get_done_task = loop.create_task(done_queue.get.bind(done_queue));
                    services.push(get_done_task);
                }
                await bluebird_1.default.Promise.any([
                    ...services,
                    ...workers,
                    promise_timeout(10),
                ]);
                workers = new Set([...workers].filter((worker) => worker.isPending()));
                services = services.filter((service) => service.isPending());
                if (!get_done_task)
                    throw "";
                if (!get_done_task.isPending()) {
                    yield await get_done_task;
                    if (services.indexOf(get_done_task) > -1)
                        throw "";
                    get_done_task = null;
                }
            }
            emit(new events.ComputationFinished());
        }
        catch (error) {
            if (error === undefined) {
                utils_1.logger.error("Computation interrupted by the user.");
            }
            else {
                utils_1.logger.error(`fail= ${error}`);
            }
            if (!self._worker_cancellation_token.cancelled)
                self._worker_cancellation_token.cancel();
            emit(new events.ComputationFinished());
        }
        finally {
            payment_closing = true;
            find_offers_task.cancel();
            worker_starter_task.cancel();
            if (!self._worker_cancellation_token.cancelled)
                self._worker_cancellation_token.cancel();
            try {
                if (workers) {
                    for (let worker_task of [...workers]) {
                        worker_task.cancel();
                    }
                    emit(new events.CheckingPayments());
                    await bluebird_1.default.Promise.any([
                        bluebird_1.default.Promise.all([...workers]),
                        promise_timeout(10),
                    ]);
                    emit(new events.CheckingPayments());
                }
            }
            catch (error) {
                utils_1.logger.error(error);
            }
            await bluebird_1.default.Promise.any([
                bluebird_1.default.Promise.all([find_offers_task, process_invoices_job]),
                promise_timeout(10),
            ]);
            emit(new events.CheckingPayments());
            if (agreements_to_pay.size > 0) {
                await bluebird_1.default.Promise.any([
                    process_invoices_job,
                    promise_timeout(15),
                ]);
                emit(new events.CheckingPayments());
            }
        }
        emit(new events.PaymentsFinished());
        await utils_1.sleep(2);
        cancellationToken.cancel();
        return;
    }
    async _create_allocations() {
        if (!this._budget_allocations.length) {
            for await (let account of this._payment_api.accounts()) {
                let allocation = await this._stack.enter_async_context(this._payment_api.new_allocation(this._budget_amount, account.platform, account.address, this._expires.add(CFG_INVOICE_TIMEOUT, "ms")));
                this._budget_allocations.push(allocation);
            }
        }
        if (!this._budget_allocations.length) {
            throw Error("No payment accounts. Did you forget to run 'yagna payment init -r'?");
        }
        let allocation_ids = this._budget_allocations.map((a) => a.id);
        return await this._payment_api.decorate_demand(allocation_ids);
    }
    _get_common_payment_platforms(proposal) {
        let prov_platforms = Object.keys(proposal.props())
            .filter((prop) => {
            return prop.startsWith("golem.com.payment.platform.");
        })
            .map((prop) => {
            return prop.split(".")[4];
        });
        if (!prov_platforms) {
            prov_platforms = ["NGNT"];
        }
        const req_platforms = this._budget_allocations.map((budget_allocation) => budget_allocation.payment_platform);
        return req_platforms.filter((value) => value && prov_platforms.includes(value));
    }
    allocation_for_invoice(invoice) {
        try {
            const _allocation = this._budget_allocations.find((allocation) => allocation.payment_platform === invoice.paymentPlatform &&
                allocation.payment_address === invoice.payerAddr);
            if (_allocation)
                return _allocation;
            throw `No allocation for ${invoice.paymentPlatform} ${invoice.payerAddr}.`;
        }
        catch (error) {
            throw new Error(error);
        }
    }
    async ready() {
        let stack = this._stack;
        this._expires = dayjs_1.default.utc().add(this._conf.timeout, "ms");
        let market_client = await this._api_config.market();
        this._market_api = new rest.Market(market_client);
        let activity_client = await this._api_config.activity();
        this._activity_api = new rest.Activity(activity_client);
        let payment_client = await this._api_config.payment();
        this._payment_api = new rest.Payment(payment_client);
        await stack.enter_async_context(this._wrapped_emitter);
        return this;
    }
    async done() {
        this._market_api = null;
        this._payment_api = null;
        await this._stack.aclose();
    }
}
exports.Engine = Engine;
//# sourceMappingURL=index.js.map