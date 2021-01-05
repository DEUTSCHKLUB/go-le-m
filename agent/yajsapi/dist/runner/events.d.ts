import { Identification } from "../props";
declare type ExcInfo = Error;
export declare class YaEvent {
    constructor();
    extract_exc_info(): [ExcInfo | null | undefined, YaEvent];
}
export declare class ComputationStarted extends YaEvent {
}
export declare class ComputationFinished extends YaEvent {
}
export declare class ComputationFailed extends YaEvent {
    reason?: string;
}
export declare class PaymentsFinished extends YaEvent {
}
export declare class SubscriptionCreated extends YaEvent {
    sub_id?: string;
    constructor({ sub_id }: {
        sub_id: any;
    });
}
export declare class SubscriptionFailed extends YaEvent {
    reason?: string;
    constructor({ reason }: {
        reason: any;
    });
}
export declare class CollectFailed extends YaEvent {
    sub_id: string;
    reason: string;
    constructor({ sub_id, reason }: {
        sub_id: any;
        reason: any;
    });
}
declare class ProposalEvent extends YaEvent {
    prop_id?: string | null;
}
export declare class ProposalReceived extends ProposalEvent {
    provider_id?: string;
    constructor({ prop_id, provider_id }: {
        prop_id: any;
        provider_id: any;
    });
}
export declare class ProposalRejected extends ProposalEvent {
    reason?: string;
    constructor({ prop_id, reason }: {
        prop_id: any;
        reason?: string | undefined;
    });
}
export declare class ProposalResponded extends ProposalEvent {
    constructor({ prop_id }: {
        prop_id?: null | undefined;
    });
}
export declare class ProposalConfirmed extends ProposalEvent {
    constructor({ prop_id }: {
        prop_id?: null | undefined;
    });
}
export declare class ProposalFailed extends ProposalEvent {
    reason?: string | null;
    constructor({ prop_id, reason }: {
        prop_id: any;
        reason: any;
    });
}
export declare class NoProposalsConfirmed extends YaEvent {
    num_offers?: number;
    timeout?: number;
    constructor({ num_offers, timeout }: {
        num_offers: any;
        timeout: any;
    });
}
declare class AgreementEvent extends YaEvent {
    agr_id?: string;
}
export declare class AgreementCreated extends AgreementEvent {
    provider_id?: Identification;
    constructor({ agr_id, provider_id }: {
        agr_id: any;
        provider_id: any;
    });
}
export declare class AgreementConfirmed extends AgreementEvent {
    constructor({ agr_id }: {
        agr_id: any;
    });
}
export declare class AgreementRejected extends AgreementEvent {
    constructor({ agr_id }: {
        agr_id: any;
    });
}
export declare class PaymentAccepted extends AgreementEvent {
    inv_id: string;
    amount: string;
    constructor({ agr_id, inv_id, amount }: {
        agr_id: any;
        inv_id: any;
        amount: any;
    });
}
export declare class PaymentFailed extends AgreementEvent {
    constructor({ agr_id }: {
        agr_id: any;
    });
}
export declare class PaymentPrepared extends AgreementEvent {
    constructor({ agr_id }: {
        agr_id: any;
    });
}
export declare class PaymentQueued extends AgreementEvent {
    constructor({ agr_id }: {
        agr_id: any;
    });
}
export declare class CheckingPayments extends AgreementEvent {
}
export declare class InvoiceReceived extends AgreementEvent {
    inv_id?: string;
    amount?: string;
    constructor({ agr_id, inv_id, amount }: {
        agr_id: any;
        inv_id: any;
        amount: any;
    });
}
export declare class WorkerStarted extends AgreementEvent {
    constructor({ agr_id }: {
        agr_id: any;
    });
}
export declare class ActivityCreated extends AgreementEvent {
    act_id?: string;
    constructor({ agr_id, act_id }: {
        agr_id: any;
        act_id: any;
    });
}
export declare class ActivityCreateFailed extends AgreementEvent {
    constructor({ agr_id }: {
        agr_id: any;
    });
}
declare class TaskEvent extends YaEvent {
    task_id?: string;
}
interface EventGeneral extends AgreementEvent, TaskEvent {
}
declare class EventGeneral {
}
export declare class TaskStarted extends EventGeneral {
    task_data?: any;
    constructor({ agr_id, task_id, task_data }: {
        agr_id: any;
        task_id: any;
        task_data: any;
    });
}
export declare class WorkerFinished extends AgreementEvent {
    exception?: ExcInfo | null;
    constructor({ agr_id, exception }: {
        agr_id: any;
        exception: any;
    });
    extract_exc_info(): [ExcInfo | null | undefined, YaEvent];
}
declare class ScriptEvent extends AgreementEvent {
    task_id?: string | null;
}
export declare class ScriptSent extends ScriptEvent {
    cmds?: any;
    constructor({ agr_id, task_id, cmds }: {
        agr_id: any;
        task_id: any;
        cmds: any;
    });
}
export declare class CommandExecuted extends ScriptEvent {
    success?: boolean;
    cmd_idx?: number;
    command?: any;
    message?: string;
    constructor({ agr_id, task_id, success, cmd_idx, command, message }: {
        agr_id: any;
        task_id: any;
        success: any;
        cmd_idx: any;
        command: any;
        message: any;
    });
}
export declare class GettingResults extends ScriptEvent {
    constructor({ agr_id, task_id }: {
        agr_id: any;
        task_id: any;
    });
}
export declare class ScriptFinished extends ScriptEvent {
    constructor({ agr_id, task_id }: {
        agr_id: any;
        task_id: any;
    });
}
export declare class TaskAccepted extends TaskEvent {
    result?: any;
    constructor({ task_id, result }: {
        task_id: any;
        result: any;
    });
}
export declare class TaskRejected extends TaskEvent {
    reason?: string | null;
    constructor({ task_id, reason }: {
        task_id: any;
        reason: any;
    });
}
export declare class DownloadStarted extends YaEvent {
    path?: string;
    constructor({ path }: {
        path: any;
    });
}
export declare class DownloadFinished extends YaEvent {
    path?: string;
    constructor({ path }: {
        path: any;
    });
}
export {};
