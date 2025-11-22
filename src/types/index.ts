export type Currency = 'INR' | 'MYR';
export type SplitMethod = 'even' | 'fixed' | 'percentage' | 'weight';

export interface Trip {
  id: string;
  name: string;
  baseCurrency: string;
  supportedCurrencies: string;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  isDeleted: boolean;
}

export interface Member {
  id: string;
  tripId: string;
  name: string;
  avatar: string | null;
  balances?: MemberBalance[];
}

export interface MemberBalance {
  id: string;
  memberId: string;
  tripId: string;
  currency: string;
  amount: number;
  fxRate: number | null;
}

export interface FXRate {
  id: string;
  tripId: string;
  currency: string;
  rate: number;
  date: string;
}

export interface ExpenseShare {
  id: string;
  expenseId: string;
  memberId: string;
  amount: number;
  amountInBase: number;
}

export interface Expense {
  id: string;
  tripId: string;
  paidById: string;
  amount: number;
  currency: string;
  description: string;
  category: string | null;
  date: string;
  splitMethod: string;
  fxRate: number;
  amountInBase: number;
  createdAt: Date;
  shares?: ExpenseShare[];
  paidBy?: Member;
}

export interface SplitConfig {
  memberId: string;
  value: number;
}

export interface MemberLedger {
  memberId: string;
  memberName: string;
  startingBalanceINR: number;
  startingBalanceMYR: number;
  totalSpent: number;
  totalShare: number;
  netBalance: number;
}

export interface Settlement {
  fromMemberId: string;
  fromMemberName: string;
  toMemberId: string;
  toMemberName: string;
  amount: number;
  amountInMYR: number;
}
