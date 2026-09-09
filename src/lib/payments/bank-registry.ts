/**
 * South African Bank Capability Registry
 *
 * Provides a structured, configurable registry of major South African banking institutions
 * and their supported debit order / mandate rails (DebiCheck, Registered Mandate, EFT Debit).
 *
 * All debit collections are routed exclusively through licensed South African payment providers
 * and debit order bureaus (e.g. Netcash, Stitch, BankservAfrica).
 */

export interface BankCapability {
  bankName: string;
  bankCode: string;
  universalBranchCode: string;
  supportsDebiCheck: boolean;
  supportsRegisteredMandate: boolean;
  supportsEFT: boolean;
  supportedChannels: ("USSD" | "App" | "ATM" | "Branch" | "OnlineBanking")[];
  providerPartner: "Netcash" | "Stitch" | "BankservAfrica" | "Manual";
  status: "active" | "maintenance" | "unsupported";
  notes?: string;
}

export const SOUTH_AFRICAN_BANKS: readonly BankCapability[] = [
  {
    bankName: "First National Bank (FNB)",
    bankCode: "FNB",
    universalBranchCode: "250655",
    supportsDebiCheck: true,
    supportsRegisteredMandate: true,
    supportsEFT: true,
    supportedChannels: ["App", "OnlineBanking", "USSD", "ATM", "Branch"],
    providerPartner: "Netcash",
    status: "active",
    notes: "Full real-time DebiCheck TT3 & TT1 push notification support.",
  },
  {
    bankName: "Standard Bank",
    bankCode: "SB",
    universalBranchCode: "051001",
    supportsDebiCheck: true,
    supportsRegisteredMandate: true,
    supportsEFT: true,
    supportedChannels: ["App", "OnlineBanking", "USSD", "ATM", "Branch"],
    providerPartner: "Netcash",
    status: "active",
    notes: "Instant DebiCheck app authorization supported.",
  },
  {
    bankName: "Absa Bank",
    bankCode: "ABSA",
    universalBranchCode: "632005",
    supportsDebiCheck: true,
    supportsRegisteredMandate: true,
    supportsEFT: true,
    supportedChannels: ["App", "OnlineBanking", "USSD", "ATM", "Branch"],
    providerPartner: "Netcash",
    status: "active",
    notes: "Full TT3 app push notification support.",
  },
  {
    bankName: "Nedbank",
    bankCode: "NED",
    universalBranchCode: "198765",
    supportsDebiCheck: true,
    supportsRegisteredMandate: true,
    supportsEFT: true,
    supportedChannels: ["App", "OnlineBanking", "USSD", "ATM", "Branch"],
    providerPartner: "Netcash",
    status: "active",
    notes: "Full DebiCheck authentication supported.",
  },
  {
    bankName: "Capitec Bank",
    bankCode: "CAPITEC",
    universalBranchCode: "470010",
    supportsDebiCheck: true,
    supportsRegisteredMandate: true,
    supportsEFT: true,
    supportedChannels: ["App", "USSD", "Branch"],
    providerPartner: "Netcash",
    status: "active",
    notes: "Capitec in-app authentication prompt and USSD prompt.",
  },
  {
    bankName: "Investec Bank",
    bankCode: "INVESTEC",
    universalBranchCode: "580105",
    supportsDebiCheck: true,
    supportsRegisteredMandate: true,
    supportsEFT: true,
    supportedChannels: ["App", "OnlineBanking"],
    providerPartner: "Netcash",
    status: "active",
    notes: "DebiCheck authorization via Investec Online and App.",
  },
  {
    bankName: "Discovery Bank",
    bankCode: "DISCOVERY",
    universalBranchCode: "679000",
    supportsDebiCheck: true,
    supportsRegisteredMandate: true,
    supportsEFT: true,
    supportedChannels: ["App", "OnlineBanking"],
    providerPartner: "Netcash",
    status: "active",
    notes: "Digital-only in-app DebiCheck approval.",
  },
  {
    bankName: "TymeBank",
    bankCode: "TYME",
    universalBranchCode: "678910",
    supportsDebiCheck: true,
    supportsRegisteredMandate: true,
    supportsEFT: true,
    supportedChannels: ["App", "OnlineBanking", "USSD"],
    providerPartner: "Netcash",
    status: "active",
    notes: "DebiCheck authorization via TymeBank app.",
  },
  {
    bankName: "African Bank",
    bankCode: "AFRICAN",
    universalBranchCode: "430000",
    supportsDebiCheck: true,
    supportsRegisteredMandate: true,
    supportsEFT: true,
    supportedChannels: ["App", "OnlineBanking", "Branch"],
    providerPartner: "Netcash",
    status: "active",
  },
  {
    bankName: "Bidvest Bank",
    bankCode: "BIDVEST",
    universalBranchCode: "462005",
    supportsDebiCheck: true,
    supportsRegisteredMandate: true,
    supportsEFT: true,
    supportedChannels: ["OnlineBanking", "Branch"],
    providerPartner: "Netcash",
    status: "active",
  },
  {
    bankName: "Sasfin Bank",
    bankCode: "SASFIN",
    universalBranchCode: "683000",
    supportsDebiCheck: true,
    supportsRegisteredMandate: true,
    supportsEFT: true,
    supportedChannels: ["OnlineBanking"],
    providerPartner: "Netcash",
    status: "active",
  },
] as const;

export function getBankByName(name: string): BankCapability | undefined {
  const normalized = name.toLowerCase().trim();
  return SOUTH_AFRICAN_BANKS.find(
    (b) =>
      b.bankName.toLowerCase().includes(normalized) ||
      b.bankCode.toLowerCase() === normalized,
  );
}

export function validateBankDebitSupport(
  bankName: string,
  mandateType: "debicheck" | "registered_mandate" | "standard_eft",
): { supported: boolean; reason?: string; bank?: BankCapability } {
  const bank = getBankByName(bankName);
  if (!bank) {
    return {
      supported: false,
      reason: `The bank "${bankName}" was not found in the South African registered bank directory.`,
    };
  }

  if (bank.status !== "active") {
    return {
      supported: false,
      reason: `${bank.bankName} debit order processing is temporarily unavailable (${bank.status}).`,
      bank,
    };
  }

  if (mandateType === "debicheck" && !bank.supportsDebiCheck) {
    return {
      supported: false,
      reason: `${bank.bankName} does not currently support DebiCheck authenticated mandates.`,
      bank,
    };
  }

  if (mandateType === "registered_mandate" && !bank.supportsRegisteredMandate) {
    return {
      supported: false,
      reason: `${bank.bankName} does not currently support Registered Mandates.`,
      bank,
    };
  }

  return { supported: true, bank };
}
