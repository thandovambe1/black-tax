import type {
  MandateStatus,
  SouthAfricanProvince,
} from "@/lib/payments/types";

/**
 * Shared, type-only contracts for the existing debit-order provider and
 * mandate lifecycle manager. No provider calls or payment responses are
 * implemented here; runtime behaviour remains in provider.ts.
 */

/** Input consumed by registerMandate() and createDebitMandate(). */
export interface DebitMandateInput {
  mandateReference: string;
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  province: SouthAfricanProvince;
  bankName: string;
  accountNumberMasked: string;
  accountType: "cheque" | "savings" | "transmission";
  branchCode: string;
  /** Contribution amount in ZAR minor units (cents). */
  amountCents: number;
  /** Collection-day label supplied by the existing mandate flow. */
  collectionDay: string;
  mandateType: "debicheck" | "registered_mandate" | "standard_eft";
  authChannel?: "USSD" | "App" | "ATM" | "Branch" | "OnlineBanking";
}

/** Result consumed by the mandate manager and mandate API route. */
export interface DebitMandateResult {
  ok: boolean;
  mandateReference: string;
  providerMandateId?: string;
  status: MandateStatus;
  authRequired: boolean;
  authInstructions?: string;
  error?: string;
}

/** One collection request passed to submitCollectionBatch(). */
export interface CollectionBatchItem {
  collectionReference: string;
  mandateReference: string;
  providerMandateId?: string;
  /** Collection amount in ZAR minor units (cents). */
  amountCents: number;
  collectionDate: Date;
  donorName: string;
  bankName: string;
  branchCode: string;
  accountNumberMasked: string;
}

/** Batch submission result; submission is not evidence of settlement. */
export interface CollectionBatchResult {
  ok: boolean;
  batchReference: string;
  totalAmountCents: number;
  itemCount: number;
  submittedCount: number;
  failedCount: number;
  error?: string;
}

/** Contract implemented by SouthAfricanDebitOrderProvider. */
export interface DebitOrderProvider {
  name: string;
  isConfigured(): boolean;
  isSandboxMode(): boolean;
  registerMandate(input: DebitMandateInput): Promise<DebitMandateResult>;
  cancelMandate(
    providerMandateId: string,
    reason: string,
  ): Promise<{ ok: boolean; error?: string }>;
  submitCollectionBatch(
    items: CollectionBatchItem[],
  ): Promise<CollectionBatchResult>;
  verifyWebhookSignature(headers: Headers, rawBody: string): boolean;
}
