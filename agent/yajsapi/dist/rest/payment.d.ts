import { ResourceCtx } from "./resource";
import * as yap from "ya-ts-client/dist/ya-payment/src/models";
import { Configuration } from "ya-ts-client/dist/ya-activity";
import { RequestorApi } from "ya-ts-client/dist/ya-payment/api";
declare class yInvoice implements yap.Invoice {
    invoiceId: string;
    issuerId: string;
    recipientId: string;
    payeeAddr?: string | undefined;
    payerAddr?: string | undefined;
    paymentPlatform?: string | undefined;
    lastDebitNoteId?: string | undefined;
    timestamp: string;
    agreementId: string;
    activityIds?: string[] | undefined;
    amount: string;
    paymentDueDate: string;
    status: yap.InvoiceStatus;
}
export declare class Invoice extends yInvoice {
    private _api;
    constructor(_api: RequestorApi, _base: yap.Invoice);
    accept(amount: number | string, allocation: Allocation): Promise<void>;
}
export declare const InvoiceStatus: typeof yap.InvoiceStatus;
declare class _Link {
    _api: RequestorApi;
}
declare class AllocationDetails {
    spent_amount: number;
    remaining_amount: number;
}
export declare class Allocation extends _Link {
    id: string;
    amount: number;
    payment_platform?: string;
    payment_address?: string;
    expires?: Date;
    details(): Promise<AllocationDetails>;
    delete(): Promise<void>;
}
export declare class Payment {
    private _api;
    constructor(cfg: Configuration);
    new_allocation(amount: number, payment_platform: string, payment_address: string, expires?: Date | null, make_deposit?: boolean): ResourceCtx<Allocation>;
    allocations(): AsyncGenerator<Allocation>;
    allocation(allocation_id: string): Promise<Allocation>;
    accounts(): AsyncGenerator<yap.Account>;
    decorate_demand(ids: string[]): Promise<yap.MarketDecoration>;
    invoices(): AsyncGenerator<Invoice>;
    invoice(invoice_id: string): Promise<Invoice>;
    incoming_invoices(cancellationToken: any): AsyncGenerator<Invoice>;
}
export {};
