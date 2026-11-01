import { createZenoSupabaseClient } from "@/lib/supabase";
import { postAuthenticated } from "@/lib/api";
import type { CurrencyCode } from "@/types/content";

type ClerkTokenGetter = () => Promise<string | null>;

export type WalletBalance = {
  walletId: string;
  currency: CurrencyCode;
  amount: number;
};

export type WalletActivity = {
  id: string;
  kind: string;
  reference: string | null;
  currency: CurrencyCode;
  amount: number;
  fee: number;
  direction: "in" | "out";
  createdAt: string;
  metadata: Record<string, unknown>;
};

function fromMinorUnits(value: number, currency: CurrencyCode) {
  return currency === "XOF" ? value : value / 100;
}

/** Ensures the signed-in user has USD, EUR, and XOF ledger accounts. */
export async function provisionWalletAccounts(sessionToken: string) {
  return postAuthenticated<{ ready: true }>(
    "/api/wallet/bootstrap",
    sessionToken
  );
}

/** Reads the signed-in user's balances through Clerk-authenticated RLS. */
export async function getWalletBalances(
  getToken: ClerkTokenGetter
): Promise<WalletBalance[]> {
  const supabase = createZenoSupabaseClient(getToken);
  const { data, error } = await supabase
    .from("wallet_balances")
    .select("wallet_id, currency, balance_minor")
    .order("currency");

  if (error) throw new Error(`Could not load wallet balances: ${error.message}`);

  return (data ?? []).map((row) => {
    const currency = row.currency as CurrencyCode;
    return {
      walletId: row.wallet_id,
      currency,
      amount: fromMinorUnits(Number(row.balance_minor), currency),
    };
  });
}

/** Reads the signed-in user's ledger activity; it never writes financial data. */
export async function getWalletActivity(
  getToken: ClerkTokenGetter,
  limit = 30
): Promise<WalletActivity[]> {
  const supabase = createZenoSupabaseClient(getToken);
  const { data, error } = await supabase
    .from("wallet_activity")
    .select(
      "id, kind, reference, currency, amount_minor, fee_minor, direction, metadata, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 100));

  if (error) throw new Error(`Could not load wallet activity: ${error.message}`);

  return (data ?? []).map((row) => {
    const currency = row.currency as CurrencyCode;
    return {
      id: row.id,
      kind: row.kind,
      reference: row.reference,
      currency,
      amount: fromMinorUnits(Number(row.amount_minor), currency),
      fee: fromMinorUnits(Number(row.fee_minor), currency),
      direction: row.direction as "in" | "out",
      createdAt: row.created_at,
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
    };
  });
}
