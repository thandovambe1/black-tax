/**
 * Core Financial System Types for Black Tax
 *
 * Strict financial lifecycles, integer minor units (cents),
 * and South African payment rails.
 */

export type TransactionStatus =
  | "PENDING"
  | "PROCESSING"
  | "AUTHORISED"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"
  | "DISPUTED"
  | "CHARGEBACK"
  | "RECONCILIATION_REQUIRED";

export type MandateStatus =
  | "DRAFT"
  | "PENDING_CUSTOMER_ACTION"
  | "PENDING_BANK_AUTHENTICATION"
  | "AUTHORISED"
  | "ACTIVE"
  | "SUSPENDED"
  | "CANCELLED"
  | "EXPIRED"
  | "REJECTED"
  | "FAILED";

export type CollectionStatus =
  | "PENDING"
  | "SUBMITTED"
  | "PROCESSING"
  | "COLLECTED"
  | "FAILED"
  | "DISPUTED"
  | "RECALLED";

export type ReconciliationStatus =
  | "MATCHED"
  | "MISMATCH"
  | "MISSING_INTERNAL"
  | "MISSING_PROVIDER"
  | "AMOUNT_MISMATCH"
  | "STATUS_MISMATCH"
  | "DUPLICATE"
  | "REQUIRES_REVIEW";

export type SouthAfricanProvince =
  | "Eastern Cape"
  | "Free State"
  | "Gauteng"
  | "KwaZulu-Natal"
  | "Limpopo"
  | "Mpumalanga"
  | "Northern Cape"
  | "North West"
  | "Western Cape";

export const SA_PROVINCES: readonly SouthAfricanProvince[] = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
] as const;

export type PaymentMethodType = "card" | "debicheck" | "eft_debit" | "instant_eft" | "manual";

export type PaymentProviderType = "yoco" | "netcash" | "stitch" | "ozow" | "fnb" | "manual";

export interface PaymentIntentInput {
  amountCents: number; // in cents (e.g., R100.00 = 10000)
  reference: string;
  donorName: string;
  donorEmail: string;
  donorPhone?: string;
  province: SouthAfricanProvince;
  isRecurring: boolean;
  isAnonymous?: boolean;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  ok: boolean;
  checkoutId?: string;
  redirectUrl?: string;
  reference: string;
  status: TransactionStatus;
  error?: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  eventId?: string;
  eventType?: string;
  reference?: string;
  providerPaymentId?: string;
  amountCents?: number;
  feeCents?: number;
  status?: TransactionStatus;
  rawPayload?: string;
  errorMessage?: string;
}

export interface PaymentProvider {
  name: PaymentProviderType;
  isConfigured(): boolean;
  createCheckout(input: PaymentIntentInput): Promise<PaymentIntentResult>;
  verifyWebhook(headers: Headers, rawBody: string): Promise<WebhookVerificationResult>;
  refundPayment?(reference: string, amountCents: number, reason: string): Promise<{ ok: boolean; error?: string }>;
}
