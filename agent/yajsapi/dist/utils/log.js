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
exports.changeLogLevel = exports.logSummary = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const duration_1 = __importDefault(require("dayjs/plugin/duration"));
const winston_1 = __importDefault(require("winston"));
const events = __importStar(require("../runner/events"));
dayjs_1.default.extend(duration_1.default);
const event_type_to_string = {
    [events.ComputationStarted.name]: "Computation started",
    [events.ComputationFinished.name]: "Computation finished",
    [events.ComputationFailed.name]: "Computation failed",
    [events.SubscriptionCreated.name]: "Demand published on the market",
    [events.SubscriptionFailed.name]: "Demand publication failed",
    [events.CollectFailed.name]: "Failed to collect proposals for demand",
    [events.NoProposalsConfirmed.name]: "No proposals confirmed by providers",
    [events.ProposalReceived.name]: "Proposal received from the market",
    [events.ProposalRejected.name]: "Proposal rejected",
    [events.ProposalResponded.name]: "Responded to a proposal",
    [events.ProposalFailed.name]: "Failed to respond to proposal",
    [events.ProposalConfirmed.name]: "Proposal confirmed by provider",
    [events.AgreementCreated.name]: "Agreement proposal sent to provider",
    [events.AgreementConfirmed.name]: "Agreement approved by provider",
    [events.AgreementRejected.name]: "Agreement rejected by provider",
    [events.PaymentAccepted.name]: "Payment accepted",
    [events.PaymentPrepared.name]: "Payment prepared",
    [events.PaymentFailed.name]: "Payment failed",
    [events.PaymentQueued.name]: "Payment queued",
    [events.PaymentsFinished.name]: "Finished waiting for payments",
    [events.CheckingPayments.name]: "Checking payments",
    [events.InvoiceReceived.name]: "Invoice received",
    [events.WorkerStarted.name]: "Worker started for agreement",
    [events.ActivityCreated.name]: "Activity created on provider",
    [events.ActivityCreateFailed.name]: "Failed to create activity",
    [events.TaskStarted.name]: "Task started",
    [events.ScriptSent.name]: "Script sent to provider",
    [events.CommandExecuted.name]: "Script command executed",
    [events.GettingResults.name]: "Getting script results",
    [events.ScriptFinished.name]: "Script finished",
    [events.TaskAccepted.name]: "Task accepted",
    [events.TaskRejected.name]: "Task rejected",
    [events.WorkerFinished.name]: "Worker finished",
    [events.DownloadStarted.name]: "Download started",
    [events.DownloadFinished.name]: "Download finished",
};
const { colorize, combine, timestamp, label, printf } = winston_1.default.format;
const customFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});
let options = {
    level: "info",
    format: combine(colorize(), label({ label: "yajsapi" }), timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), customFormat),
    defaultMeta: { service: "user-service" },
    transports: [
        new winston_1.default.transports.Console(),
    ],
};
const logColors = {
    info: "blue",
    debug: "magenta",
    warn: "yellow",
    error: "red",
};
winston_1.default.addColors(logColors);
const logger = winston_1.default.createLogger(options);
class SummaryLogger {
    constructor(wrapped_emitter = null) {
        this._wrapped_emitter = wrapped_emitter;
        this.numbers = 0;
        this._reset();
    }
    _reset() {
        this.start_time = dayjs_1.default().valueOf() / 1000;
        this.received_proposals = {};
        this.confirmed_proposals = new Set();
        this.agreement_provider_name = {};
        this.confirmed_agreements = new Set();
        this.task_data = {};
        this.provider_tasks = {};
        this.provider_cost = {};
        this.provider_failures = {};
        this.finished = false;
        this.error_occurred = false;
        this.time_waiting_for_proposals = dayjs_1.default.duration(0);
    }
    _print_cost() {
        const provider_names = new Set(Object.keys(this.provider_tasks));
        const results = [...this.confirmed_agreements].map((agr_id) => {
            const name = this.agreement_provider_name[agr_id];
            const tasks = this.provider_tasks[name];
            const cost = this.provider_cost[name] || "0 (no invoices?)";
            return {
                'Provider Name': name,
                'Tasks Computed': tasks ? tasks.length : 0,
                'Cost': cost,
            };
        });
        console.table(results);
    }
    log(event) {
        if (this._wrapped_emitter)
            this._wrapped_emitter(event);
        if (this.error_occurred)
            return;
        try {
            this._handle(event);
        }
        catch (error) {
            console.log("error", error);
            logger.error("SummaryLogger entered invalid state");
            this.error_occurred = true;
        }
    }
    _handle(event) {
        const eventName = event.constructor.name;
        if (eventName === events.ComputationStarted.name)
            this._reset();
        if (eventName === events.SubscriptionCreated.name)
            logger.info(event_type_to_string[eventName]);
        else if (eventName === events.ProposalReceived.name)
            this.received_proposals[event["prop_id"]] = event["provider_id"];
        else if (eventName === events.ProposalConfirmed.name) {
            this.confirmed_proposals.add(event["prop_id"]);
            const confirmed_providers = new Set([...this.confirmed_proposals].map((prop_id) => this.received_proposals[prop_id]));
            logger.info(`Received proposals from ${confirmed_providers.size} providers so far`);
        }
        else if (eventName === events.NoProposalsConfirmed.name) {
            this.time_waiting_for_proposals = this.time_waiting_for_proposals.add({
                millisecond: parseInt(event["timeout"]),
            });
            let msg;
            if (event["num_offers"] === 0)
                msg = `No offers have been collected from the market for
            ${this.time_waiting_for_proposals.asSeconds()}s. `;
            else
                msg = `${event["num_offers"]} offers have been collected from the market, but no provider has responded for ${this.time_waiting_for_proposals.asSeconds()}s. `;
            msg +=
                "Make sure you're using the latest released versions of yagna and yajsapi, and the correct subnet.";
            logger.warn(msg);
        }
        else if (eventName === events.AgreementCreated.name) {
            let provider_name = event["provider_id"].name.value;
            if (!provider_name) {
                this.numbers++;
                provider_name = `provider-${this.numbers}`;
            }
            logger.info(`Agreement proposed to provider '${provider_name}'`);
            this.agreement_provider_name[event["agr_id"]] = provider_name;
        }
        else if (eventName === events.AgreementConfirmed.name) {
            logger.info(`Agreement confirmed by provider '${this.agreement_provider_name[event["agr_id"]]}'`);
            this.confirmed_agreements.add(event["agr_id"]);
        }
        else if (eventName === events.TaskStarted.name) {
            this.task_data[event["task_id"]] = event["task_data"];
        }
        else if (eventName === events.ScriptSent.name) {
            const provider_name = this.agreement_provider_name[event["agr_id"]];
            logger.info(`Task sent to provider '${provider_name}', task data: ${event["task_id"]
                ? this.task_data[event["task_id"]]
                : "<initialization>"}`);
        }
        else if (eventName === events.CommandExecuted.name) {
            const provider_name = this.agreement_provider_name[event["agr_id"]];
            if (event["success"]) {
                logger.debug(`Command successful on provider '${provider_name}', command: ${JSON.stringify(event["command"])}.`);
            }
            else {
                logger.warn(`Command failed on provider '${provider_name}', command: ${JSON.stringify(event["command"])}, output: ${event["message"]}`);
            }
        }
        else if (eventName === events.ScriptFinished.name) {
            const provider_name = this.agreement_provider_name[event["agr_id"]];
            logger.info(`Task computed by provider '${provider_name}', task data: ${event["task_id"]
                ? this.task_data[event["task_id"]]
                : "<initialization>"}`);
            if (event["task_id"]) {
                if (!this.provider_tasks[provider_name])
                    this.provider_tasks[provider_name] = [event["task_id"]];
                else
                    this.provider_tasks[provider_name].push(event["task_id"]);
            }
        }
        else if (eventName === events.InvoiceReceived.name) {
            const provider_name = this.agreement_provider_name[event["agr_id"]];
            let cost = this.provider_cost[provider_name] || 0;
            cost += parseFloat(event["amount"]);
            this.provider_cost[provider_name] = cost;
            logger.debug(`Received an invoice from ${provider_name}. Amount: ${event["amount"]}; (so far: ${cost} from this provider).`);
        }
        else if (eventName === events.CheckingPayments.name) {
            if (options.level == "debug") {
                this._print_cost();
            }
        }
        else if (eventName === events.WorkerFinished.name) {
            if (event["exception"] === null)
                return;
            const provider_name = this.agreement_provider_name[event["agr_id"]];
            if (!this.provider_failures[provider_name])
                this.provider_failures[provider_name] = 0;
            this.provider_failures[provider_name] += 1;
            let more_info = "";
            if (event["exception"] && event["exception"].response && event["exception"].response.data) {
                more_info = `, info: ${event["exception"].response.data.message}`;
            }
            logger.warn(`Activity failed on provider '${provider_name}', reason: ${event["exception"]}${more_info}`);
        }
        else if (eventName === events.ComputationFinished.name) {
            this.finished = true;
            const total_time = dayjs_1.default().valueOf() / 1000 - this.start_time;
            logger.info(`Computation finished in ${total_time.toFixed(1)}s`);
            const agreement_providers = [...this.confirmed_agreements].map((agr_id) => this.agreement_provider_name[agr_id]);
            logger.info(`Negotiated ${this.confirmed_agreements.size} agreements with ${agreement_providers.length} providers`);
            for (let [provider_name, tasks] of Object.entries(this.provider_tasks)) {
                logger.info(`Provider '${provider_name}' computed ${tasks.length} tasks`);
            }
            for (let provider_name of new Set(Object.values(this.agreement_provider_name))) {
                if (!this.provider_tasks[provider_name])
                    logger.info(`Provider '${provider_name}' did not compute any tasks`);
            }
            for (let [provider_name, count] of Object.entries(this.provider_failures))
                logger.info(`Activity failed ${count} time(s) on provider '${provider_name}'`);
        }
        else if (eventName === events.PaymentsFinished.name) {
            logger.info(`Finished waiting for payments. Summary:`);
            this._print_cost();
            const total_cost = Object.values(this.provider_cost).reduce((acc, item) => (acc + item), 0);
            logger.info(`Total Cost: ${total_cost}`);
        }
        else if (eventName === events.ComputationFailed.name) {
            logger.error(`Computation failed, reason: ${event["reason"]}`);
        }
        else if (eventName === events.PaymentAccepted.name) {
            logger.info(`Accepted payment: ${event["amount"]} for invoice ${event["inv_id"].substr(0, 17)}`);
        }
        else if (eventName === events.PaymentFailed.name) {
            const provider_name = this.agreement_provider_name[event["agr_id"]];
            logger.error(`Payment for provider ${provider_name} failed.`);
        }
        else if (eventName === events.PaymentPrepared.name) {
            logger.debug(`Prepared payment for agreement ${event["agr_id"].substr(0, 17)}`);
        }
        else if (eventName === events.PaymentQueued.name) {
            logger.debug(`Queued payment for agreement ${event["agr_id"].substr(0, 17)}`);
        }
    }
}
function logSummary(wrapped_emitter) {
    const summary_logger = new SummaryLogger(wrapped_emitter);
    return summary_logger.log.bind(summary_logger);
}
exports.logSummary = logSummary;
function isSuperset(set, subset) {
    for (let elem of subset) {
        if (!set.has(elem)) {
            return false;
        }
    }
    return true;
}
exports.changeLogLevel = (level) => {
    options.level = level;
    logger.configure(options);
};
exports.default = logger;
//# sourceMappingURL=log.js.map