/**
 * FNB payout structure.
 *
 * South African banks (including FNB) release funds to third-party service
 * providers either through an authenticated banking API (enterprise) or by
 * uploading a signed EFT/ACB batch file in FNB Online Banking. This module
 * provides a provider-agnostic abstraction:
 *
 *  - `isFnbConfigured()`  → whether live payout credentials are present
 *  - `buildFnbBatchCsv()` → generates an FNB-ready batch file for approved payouts
 *  - `submitFnbPayout()`  → posts to the FNB API when configured, otherwise
 *                           returns a queued result so finance can release via
 *                           the generated batch file.
 */

export type PayoutRecord = {
  reference: string;
  beneficiaryName: string;
  beneficiaryAccount: string;
  branchCode: string;
  amount: number; // in cents
  purpose: string;
};

export function isFnbConfigured() {
  return Boolean(
    process.env.FNB_ACCOUNT_NUMBER && process.env.FNB_BRANCH_CODE && process.env.FNB_ACCOUNT_NAME,
  );
}

export function hasFnbApi() {
  return Boolean(process.env.FNB_API_BASE_URL && process.env.FNB_API_KEY);
}

function randCents(amount: number) {
  return (amount / 100).toFixed(2);
}

/**
 * Builds an FNB-compatible EFT batch CSV. Columns match the standard FNB
 * multi-payment upload template (Beneficiary, Account, Branch, Amount, Reference).
 */
export function buildFnbBatchCsv(payouts: PayoutRecord[], batchReference: string) {
  const header = [
    "BatchReference",
    "BeneficiaryName",
    "AccountNumber",
    "BranchCode",
    "Amount",
    "PaymentReference",
    "Purpose",
  ].join(",");

  const rows = payouts.map((payout) =>
    [
      batchReference,
      escapeCsv(payout.beneficiaryName),
      payout.beneficiaryAccount,
      payout.branchCode,
      randCents(payout.amount),
      payout.reference,
      escapeCsv(payout.purpose),
    ].join(","),
  );

  return [header, ...rows].join("\n");
}

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export type SubmitPayoutResult =
  | { ok: true; mode: "api" | "batch"; providerReference: string; message: string }
  | { ok: false; error: string };

/**
 * Releases a payout to a service provider. If the FNB API is configured it
 * submits directly; otherwise it returns a batch-file result so finance can
 * upload the generated file in FNB Online Banking. This keeps the platform
 * able to release funds 24/7 regardless of integration mode.
 */
export async function submitFnbPayout(payout: PayoutRecord): Promise<SubmitPayoutResult> {
  if (!isFnbConfigured()) {
    return { ok: false, error: "FNB payout details are not configured yet." };
  }

  if (hasFnbApi()) {
    try {
      const response = await fetch(`${process.env.FNB_API_BASE_URL!.replace(/\/$/, "")}/payments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.FNB_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": payout.reference,
        },
        body: JSON.stringify({
          sourceAccount: process.env.FNB_ACCOUNT_NUMBER,
          sourceBranch: process.env.FNB_BRANCH_CODE,
          beneficiaryName: payout.beneficiaryName,
          beneficiaryAccount: payout.beneficiaryAccount,
          beneficiaryBranch: payout.branchCode,
          amount: randCents(payout.amount),
          currency: "ZAR",
          reference: payout.reference,
          narrative: payout.purpose,
        }),
        cache: "no-store",
      });

      if (!response.ok) {
        return { ok: false, error: `FNB payout API returned ${response.status}.` };
      }

      const data = (await response.json().catch(() => ({}))) as { id?: string; reference?: string };
      return {
        ok: true,
        mode: "api",
        providerReference: data.id ?? data.reference ?? payout.reference,
        message: "Payout submitted to FNB via API.",
      };
    } catch {
      return { ok: false, error: "Could not reach the FNB payout API." };
    }
  }

  // No API — mark released for batch upload. The batch CSV export carries the details.
  return {
    ok: true,
    mode: "batch",
    providerReference: payout.reference,
    message: "Payout queued for the FNB batch file. Download the batch and upload it in FNB Online Banking.",
  };
}
