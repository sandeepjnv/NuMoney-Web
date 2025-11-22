import type { Trip, Member, Expense, FXRate, SplitConfig, MemberLedger, Settlement } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8181/api';

// Transform snake_case to camelCase for frontend
function transformTrip(data: Record<string, unknown>): Trip {
  return {
    id: data.id as string,
    name: data.name as string,
    baseCurrency: data.base_currency as string,
    supportedCurrencies: data.supported_currencies as string,
    startDate: data.start_date ? new Date(data.start_date as string) : null,
    endDate: data.end_date ? new Date(data.end_date as string) : null,
    createdAt: new Date(data.created_at as string),
    isDeleted: data.is_deleted as boolean,
  };
}

function transformMember(data: Record<string, unknown>): Member {
  const balances = (data.balances as Record<string, unknown>[]) || [];
  return {
    id: data.id as string,
    tripId: data.trip_id as string,
    name: data.name as string,
    avatar: data.avatar as string | null,
    balances: balances.map((b) => ({
      id: b.id as string,
      memberId: b.member_id as string,
      tripId: b.trip_id as string,
      currency: b.currency as string,
      amount: b.amount as number,
      fxRate: b.fx_rate as number | null,
    })),
  };
}

function transformFXRate(data: Record<string, unknown>): FXRate {
  return {
    id: data.id as string,
    tripId: data.trip_id as string,
    currency: data.currency as string,
    rate: data.rate as number,
    date: data.date as string,
  };
}

function transformExpense(data: Record<string, unknown>): Expense {
  const shares = (data.shares as Record<string, unknown>[]) || [];
  return {
    id: data.id as string,
    tripId: data.trip_id as string,
    paidById: data.paid_by_id as string,
    amount: data.amount as number,
    currency: data.currency as string,
    description: data.description as string,
    category: data.category as string | null,
    date: data.date as string,
    splitMethod: data.split_method as string,
    fxRate: data.fx_rate as number,
    amountInBase: data.amount_in_base as number,
    createdAt: new Date(data.created_at as string),
    shares: shares.map((s) => ({
      id: s.id as string,
      expenseId: s.expense_id as string,
      memberId: s.member_id as string,
      amount: s.amount as number,
      amountInBase: s.amount_in_base as number,
    })),
  };
}

// Trips
export async function fetchTrips(): Promise<Trip[]> {
  const res = await fetch(`${API_BASE}/trips`);
  if (!res.ok) throw new Error('Failed to fetch trips');
  const data = await res.json();
  return data.map(transformTrip);
}

export async function fetchTrip(tripId: string): Promise<Trip & {
  members: Member[];
  fxRates: FXRate[];
  expenses: Expense[];
}> {
  const res = await fetch(`${API_BASE}/trips/${tripId}`);
  if (!res.ok) throw new Error('Failed to fetch trip');
  const data = await res.json();
  return {
    ...transformTrip(data),
    members: (data.members || []).map(transformMember),
    fxRates: (data.fx_rates || []).map(transformFXRate),
    expenses: (data.expenses || []).map(transformExpense),
  };
}

export async function fetchTripByName(tripName: string): Promise<(Trip & {
  members: Member[];
  fxRates: FXRate[];
  expenses: Expense[];
}) | null> {
  const trips = await fetchTrips();
  const trip = trips.find(t => t.name.toLowerCase() === tripName.toLowerCase());
  if (!trip) return null;
  return fetchTrip(trip.id);
}

export async function createTrip(data: { name: string; startDate?: string; endDate?: string }): Promise<Trip> {
  const res = await fetch(`${API_BASE}/trips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.name,
      start_date: data.startDate || null,
      end_date: data.endDate || null,
    }),
  });
  if (!res.ok) throw new Error('Failed to create trip');
  return transformTrip(await res.json());
}

export async function updateTrip(tripId: string, data: Partial<Trip>): Promise<Trip> {
  const res = await fetch(`${API_BASE}/trips/${tripId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.name,
      start_date: data.startDate,
      end_date: data.endDate,
    }),
  });
  if (!res.ok) throw new Error('Failed to update trip');
  return transformTrip(await res.json());
}

export async function deleteTrip(tripId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/trips/${tripId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete trip');
}

// Members
export async function addMember(tripId: string, name: string): Promise<Member> {
  const res = await fetch(`${API_BASE}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trip_id: tripId, name }),
  });
  if (!res.ok) throw new Error('Failed to add member');
  return transformMember(await res.json());
}

export async function removeMember(memberId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/members/${memberId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to remove member');
}

export async function setMemberBalance(
  memberId: string,
  tripId: string,
  currency: string,
  amount: number,
  fxRate?: number
): Promise<void> {
  const res = await fetch(`${API_BASE}/members/${memberId}/balance?trip_id=${tripId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currency, amount, fx_rate: fxRate }),
  });
  if (!res.ok) throw new Error('Failed to set balance');
}

// FX Rates
export async function setFXRate(tripId: string, currency: string, rate: number, date: string): Promise<FXRate> {
  const res = await fetch(`${API_BASE}/fxrates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trip_id: tripId, currency, rate, date }),
  });
  if (!res.ok) throw new Error('Failed to set FX rate');
  return transformFXRate(await res.json());
}

// Expenses
export async function addExpense(data: {
  tripId: string;
  paidById: string;
  amount: number;
  currency: string;
  description: string;
  category?: string;
  date: string;
  splitMethod: string;
  fxRate: number;
  shares: { memberId: string; amount: number; amountInBase: number }[];
}): Promise<Expense> {
  const res = await fetch(`${API_BASE}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trip_id: data.tripId,
      paid_by_id: data.paidById,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      category: data.category,
      date: data.date,
      split_method: data.splitMethod,
      fx_rate: data.fxRate,
      shares: data.shares.map((s) => ({
        member_id: s.memberId,
        amount: s.amount,
        amount_in_base: s.amountInBase,
      })),
    }),
  });
  if (!res.ok) throw new Error('Failed to add expense');
  return transformExpense(await res.json());
}

export async function deleteExpense(expenseId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/expenses/${expenseId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete expense');
}

// Settlement
export async function fetchSettlement(tripId: string): Promise<{
  ledger: MemberLedger[];
  settlements: Settlement[];
  currentRate: number;
}> {
  const res = await fetch(`${API_BASE}/trips/${tripId}/settlement`);
  if (!res.ok) throw new Error('Failed to fetch settlement');
  const data = await res.json();
  return {
    ledger: data.ledger.map((l: Record<string, unknown>) => ({
      memberId: l.member_id,
      memberName: l.member_name,
      startingBalanceINR: l.starting_balance_inr,
      startingBalanceMYR: l.starting_balance_myr,
      totalSpent: l.total_spent,
      totalShare: l.total_share,
      netBalance: l.net_balance,
    })),
    settlements: data.settlements.map((s: Record<string, unknown>) => ({
      fromMemberId: s.from_member_id,
      fromMemberName: s.from_member_name,
      toMemberId: s.to_member_id,
      toMemberName: s.to_member_name,
      amount: s.amount,
      amountInMYR: s.amount_in_myr,
    })),
    currentRate: data.current_rate,
  };
}

// Helper to calculate shares
export function calculateShares(
  members: Member[],
  amount: number,
  currency: string,
  fxRate: number,
  splitMethod: string,
  splitConfig: SplitConfig[]
): { memberId: string; amount: number; amountInBase: number }[] {
  const amountInBase = currency === 'INR' ? amount : amount * fxRate;

  if (splitMethod === 'even') {
    const shareAmount = amount / members.length;
    const shareAmountInBase = amountInBase / members.length;
    return members.map((m) => ({
      memberId: m.id,
      amount: shareAmount,
      amountInBase: shareAmountInBase,
    }));
  }

  if (splitMethod === 'fixed') {
    return splitConfig.map((sc) => ({
      memberId: sc.memberId,
      amount: sc.value,
      amountInBase: currency === 'INR' ? sc.value : sc.value * fxRate,
    }));
  }

  if (splitMethod === 'percentage') {
    return splitConfig.map((sc) => ({
      memberId: sc.memberId,
      amount: (amount * sc.value) / 100,
      amountInBase: (amountInBase * sc.value) / 100,
    }));
  }

  if (splitMethod === 'weight') {
    const totalWeight = splitConfig.reduce((sum, sc) => sum + sc.value, 0);
    return splitConfig.map((sc) => ({
      memberId: sc.memberId,
      amount: (amount * sc.value) / totalWeight,
      amountInBase: (amountInBase * sc.value) / totalWeight,
    }));
  }

  return [];
}
