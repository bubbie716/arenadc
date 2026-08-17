export type AdminTab =
  | "overview"
  | "fights"
  | "users"
  | "wallet"
  | "transactions"
  | "disputes"
  | "settings";

export const ADMIN_TABS: { id: AdminTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "fights", label: "Fights" },
  { id: "users", label: "Users" },
  { id: "wallet", label: "Wallet Requests" },
  { id: "transactions", label: "Transactions" },
  { id: "disputes", label: "Disputes" },
  { id: "settings", label: "Settings & Audit" },
];

export type AdminActivityItem = {
  id: string;
  kind: string;
  message: string;
  createdAt: string;
  href?: string;
};

export type AdminOverviewStats = {
  totalUsers: number;
  activeUsers: number;
  totalFights: number;
  confirmedFights: number;
  completedFights: number;
  disputedFights: number;
  refundedFights: number;
  totalRmdWagered: number;
  totalRmdInEscrow: number;
  totalPlatformFees: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
};
