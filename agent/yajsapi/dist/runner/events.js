"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownloadFinished = exports.DownloadStarted = exports.TaskRejected = exports.TaskAccepted = exports.ScriptFinished = exports.GettingResults = exports.CommandExecuted = exports.ScriptSent = exports.WorkerFinished = exports.TaskStarted = exports.ActivityCreateFailed = exports.ActivityCreated = exports.WorkerStarted = exports.InvoiceReceived = exports.CheckingPayments = exports.PaymentQueued = exports.PaymentPrepared = exports.PaymentFailed = exports.PaymentAccepted = exports.AgreementRejected = exports.AgreementConfirmed = exports.AgreementCreated = exports.NoProposalsConfirmed = exports.ProposalFailed = exports.ProposalConfirmed = exports.ProposalResponded = exports.ProposalRejected = exports.ProposalReceived = exports.CollectFailed = exports.SubscriptionFailed = exports.SubscriptionCreated = exports.PaymentsFinished = exports.ComputationFailed = exports.ComputationFinished = exports.ComputationStarted = exports.YaEvent = void 0;
const applyMixins_1 = __importDefault(require("../utils/applyMixins"));
class YaEvent {
    constructor() { }
    extract_exc_info() {
        return [null, this];
    }
}
exports.YaEvent = YaEvent;
class ComputationStarted extends YaEvent {
}
exports.ComputationStarted = ComputationStarted;
class ComputationFinished extends YaEvent {
}
exports.ComputationFinished = ComputationFinished;
class ComputationFailed extends YaEvent {
}
exports.ComputationFailed = ComputationFailed;
class PaymentsFinished extends YaEvent {
}
exports.PaymentsFinished = PaymentsFinished;
class SubscriptionCreated extends YaEvent {
    constructor({ sub_id }) {
        super();
        if (sub_id)
            this.sub_id = sub_id;
    }
}
exports.SubscriptionCreated = SubscriptionCreated;
class SubscriptionFailed extends YaEvent {
    constructor({ reason }) {
        super();
        if (reason)
            this.reason = reason;
    }
}
exports.SubscriptionFailed = SubscriptionFailed;
class CollectFailed extends YaEvent {
    constructor({ sub_id, reason }) {
        super();
        if (sub_id)
            this.sub_id = sub_id;
        if (reason)
            this.reason = reason;
    }
}
exports.CollectFailed = CollectFailed;
class ProposalEvent extends YaEvent {
}
class ProposalReceived extends ProposalEvent {
    constructor({ prop_id, provider_id }) {
        super();
        if (prop_id)
            this.prop_id = prop_id;
        if (provider_id)
            this.provider_id = provider_id;
    }
}
exports.ProposalReceived = ProposalReceived;
class ProposalRejected extends ProposalEvent {
    constructor({ prop_id, reason = "" }) {
        super();
        if (prop_id)
            this.prop_id = prop_id;
        if (reason)
            this.reason = reason;
    }
}
exports.ProposalRejected = ProposalRejected;
class ProposalResponded extends ProposalEvent {
    constructor({ prop_id = null }) {
        super();
        if (prop_id)
            this.prop_id = prop_id;
    }
}
exports.ProposalResponded = ProposalResponded;
class ProposalConfirmed extends ProposalEvent {
    constructor({ prop_id = null }) {
        super();
        if (prop_id)
            this.prop_id = prop_id;
    }
}
exports.ProposalConfirmed = ProposalConfirmed;
class ProposalFailed extends ProposalEvent {
    constructor({ prop_id, reason }) {
        super();
        if (prop_id)
            this.prop_id = prop_id;
        if (reason)
            this.reason = reason;
    }
}
exports.ProposalFailed = ProposalFailed;
class NoProposalsConfirmed extends YaEvent {
    constructor({ num_offers, timeout }) {
        super();
        this.num_offers = num_offers;
        this.timeout = timeout;
    }
}
exports.NoProposalsConfirmed = NoProposalsConfirmed;
class AgreementEvent extends YaEvent {
}
class AgreementCreated extends AgreementEvent {
    constructor({ agr_id, provider_id }) {
        super();
        if (agr_id)
            this.agr_id = agr_id;
        if (provider_id)
            this.provider_id = provider_id;
    }
}
exports.AgreementCreated = AgreementCreated;
class AgreementConfirmed extends AgreementEvent {
    constructor({ agr_id }) {
        super();
        if (agr_id)
            this.agr_id = agr_id;
    }
}
exports.AgreementConfirmed = AgreementConfirmed;
class AgreementRejected extends AgreementEvent {
    constructor({ agr_id }) {
        super();
        if (agr_id)
            this.agr_id = agr_id;
    }
}
exports.AgreementRejected = AgreementRejected;
class PaymentAccepted extends AgreementEvent {
    constructor({ agr_id, inv_id, amount }) {
        super();
        if (agr_id)
            this.agr_id = agr_id;
        if (inv_id)
            this.inv_id = inv_id;
        if (amount)
            this.amount = amount;
    }
}
exports.PaymentAccepted = PaymentAccepted;
class PaymentFailed extends AgreementEvent {
    constructor({ agr_id }) {
        super();
        if (agr_id)
            this.agr_id = agr_id;
    }
}
exports.PaymentFailed = PaymentFailed;
class PaymentPrepared extends AgreementEvent {
    constructor({ agr_id }) {
        super();
        if (agr_id)
            this.agr_id = agr_id;
    }
}
exports.PaymentPrepared = PaymentPrepared;
class PaymentQueued extends AgreementEvent {
    constructor({ agr_id }) {
        super();
        if (agr_id)
            this.agr_id = agr_id;
    }
}
exports.PaymentQueued = PaymentQueued;
class CheckingPayments extends AgreementEvent {
}
exports.CheckingPayments = CheckingPayments;
class InvoiceReceived extends AgreementEvent {
    constructor({ agr_id, inv_id, amount }) {
        super();
        if (agr_id)
            this.agr_id = agr_id;
        if (inv_id)
            this.inv_id = inv_id;
        if (amount)
            this.amount = amount;
    }
}
exports.InvoiceReceived = InvoiceReceived;
class WorkerStarted extends AgreementEvent {
    constructor({ agr_id }) {
        super();
        if (agr_id)
            this.agr_id = agr_id;
    }
}
exports.WorkerStarted = WorkerStarted;
class ActivityCreated extends AgreementEvent {
    constructor({ agr_id, act_id }) {
        super();
        if (agr_id)
            this.agr_id = agr_id;
        if (act_id)
            this.act_id = act_id;
    }
}
exports.ActivityCreated = ActivityCreated;
class ActivityCreateFailed extends AgreementEvent {
    constructor({ agr_id }) {
        super();
        if (agr_id)
            this.agr_id = agr_id;
    }
}
exports.ActivityCreateFailed = ActivityCreateFailed;
class TaskEvent extends YaEvent {
}
class EventGeneral {
}
applyMixins_1.default(EventGeneral, [AgreementEvent, TaskEvent]);
class TaskStarted extends EventGeneral {
    constructor({ agr_id, task_id, task_data }) {
        super();
        if (agr_id)
            this.agr_id = agr_id;
        if (task_id)
            this.task_id = task_id;
        this.task_data = task_data;
    }
}
exports.TaskStarted = TaskStarted;
class WorkerFinished extends AgreementEvent {
    constructor({ agr_id, exception }) {
        super();
        this.exception = null;
        if (agr_id)
            this.agr_id = agr_id;
        if (exception)
            this.exception = exception;
    }
    extract_exc_info() {
        const exc_info = this.exception;
        const me = Object.assign(new WorkerFinished({ agr_id: undefined, exception: undefined }), this);
        me.exception = null;
        return [exc_info, me];
    }
}
exports.WorkerFinished = WorkerFinished;
class ScriptEvent extends AgreementEvent {
}
class ScriptSent extends ScriptEvent {
    constructor({ agr_id, task_id, cmds }) {
        super();
        if (agr_id)
            this.agr_id = agr_id;
        if (task_id)
            this.task_id = task_id;
        if (cmds)
            this.cmds = cmds;
    }
}
exports.ScriptSent = ScriptSent;
class CommandExecuted extends ScriptEvent {
    constructor({ agr_id, task_id, success, cmd_idx, command, message }) {
        super();
        if (agr_id)
            this.agr_id = agr_id;
        if (task_id)
            this.task_id = task_id;
        if (success)
            this.success = success;
        if (cmd_idx)
            this.cmd_idx = cmd_idx;
        if (command)
            this.command = command;
        if (message)
            this.message = message;
    }
}
exports.CommandExecuted = CommandExecuted;
class GettingResults extends ScriptEvent {
    constructor({ agr_id, task_id }) {
        super();
        if (agr_id)
            this.agr_id = agr_id;
        if (task_id)
            this.task_id = task_id;
    }
}
exports.GettingResults = GettingResults;
class ScriptFinished extends ScriptEvent {
    constructor({ agr_id, task_id }) {
        super();
        if (agr_id)
            this.agr_id = agr_id;
        if (task_id)
            this.task_id = task_id;
    }
}
exports.ScriptFinished = ScriptFinished;
class TaskAccepted extends TaskEvent {
    constructor({ task_id, result }) {
        super();
        if (task_id)
            this.task_id = task_id;
        if (result)
            this.result = result;
    }
}
exports.TaskAccepted = TaskAccepted;
class TaskRejected extends TaskEvent {
    constructor({ task_id, reason }) {
        super();
        if (task_id)
            this.task_id = task_id;
        if (reason)
            this.reason = reason;
    }
}
exports.TaskRejected = TaskRejected;
class DownloadStarted extends YaEvent {
    constructor({ path }) {
        super();
        if (path)
            this.path = path;
    }
}
exports.DownloadStarted = DownloadStarted;
class DownloadFinished extends YaEvent {
    constructor({ path }) {
        super();
        if (path)
            this.path = path;
    }
}
exports.DownloadFinished = DownloadFinished;
//# sourceMappingURL=events.js.map