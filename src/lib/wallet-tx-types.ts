import { WalletTransactionType } from "@prisma/client";

/** Stable enum value when Next dev bundles a stale `@prisma/client`. */
export const TX_WAGER_LOSS: WalletTransactionType =
  WalletTransactionType.WAGER_LOSS ?? ("WAGER_LOSS" as WalletTransactionType);
