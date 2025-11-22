'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';
import type { Trip, Member, Expense, FXRate } from '@/types';

interface TripData extends Trip {
  members: (Member & { balances: { currency: string; amount: number; fxRate: number | null }[] })[];
  fxRates: FXRate[];
  expenses: Expense[];
}

interface TripContextType {
  trips: Trip[];
  currentTripId: string | null;
  currentTrip: TripData | null;
  isLoading: boolean;
  isAdmin?: boolean;
  setCurrentTripId: (id: string | null) => void;
  createTrip: (name: string, startDate?: string, endDate?: string) => Promise<void>;
  updateTrip: (tripId: string, data: Partial<Trip>) => Promise<void>;
  deleteTrip: (tripId: string) => Promise<void>;
  addMember: (name: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  setMemberBalance: (memberId: string, currency: string, amount: number, fxRate?: number) => Promise<void>;
  setFXRate: (currency: string, rate: number, date: string) => Promise<void>;
  addExpense: (data: Parameters<typeof api.addExpense>[0]) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  refetch: () => void;
}

const TripContext = createContext<TripContextType | null>(null);

interface TripProviderProps {
  children: ReactNode;
  tripId?: string;
  isAdmin?: boolean;
}

export function TripProvider({ children, tripId: externalTripId, isAdmin = true }: TripProviderProps) {
  const [internalTripId, setInternalTripId] = useState<string | null>(null);
  const currentTripId = externalTripId || internalTripId;
  const setCurrentTripId = externalTripId ? () => {} : setInternalTripId;
  const queryClient = useQueryClient();

  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: api.fetchTrips,
  });

  const { data: currentTrip, isLoading: tripLoading } = useQuery({
    queryKey: ['trip', currentTripId],
    queryFn: () => api.fetchTrip(currentTripId!),
    enabled: !!currentTripId,
  });

  const createTripMutation = useMutation({
    mutationFn: api.createTrip,
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      setCurrentTripId(trip.id);
    },
  });

  const updateTripMutation = useMutation({
    mutationFn: ({ tripId, data }: { tripId: string; data: Partial<Trip> }) => api.updateTrip(tripId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trip', currentTripId] });
    },
  });

  const deleteTripMutation = useMutation({
    mutationFn: api.deleteTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      setCurrentTripId(null);
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: (name: string) => api.addMember(currentTripId!, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trip', currentTripId] }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: api.removeMember,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trip', currentTripId] }),
  });

  const setMemberBalanceMutation = useMutation({
    mutationFn: ({ memberId, currency, amount, fxRate }: { memberId: string; currency: string; amount: number; fxRate?: number }) =>
      api.setMemberBalance(memberId, currentTripId!, currency, amount, fxRate),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trip', currentTripId] }),
  });

  const setFXRateMutation = useMutation({
    mutationFn: ({ currency, rate, date }: { currency: string; rate: number; date: string }) =>
      api.setFXRate(currentTripId!, currency, rate, date),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trip', currentTripId] }),
  });

  const addExpenseMutation = useMutation({
    mutationFn: api.addExpense,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trip', currentTripId] }),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: api.deleteExpense,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trip', currentTripId] }),
  });

  const value: TripContextType = {
    trips,
    currentTripId,
    currentTrip: currentTrip || null,
    isLoading: tripsLoading || tripLoading,
    isAdmin,
    setCurrentTripId,
    createTrip: async (name, startDate, endDate) => {
      await createTripMutation.mutateAsync({ name, startDate, endDate });
    },
    updateTrip: async (tripId, data) => {
      await updateTripMutation.mutateAsync({ tripId, data });
    },
    deleteTrip: async (tripId) => {
      await deleteTripMutation.mutateAsync(tripId);
    },
    addMember: async (name) => {
      await addMemberMutation.mutateAsync(name);
    },
    removeMember: async (memberId) => {
      await removeMemberMutation.mutateAsync(memberId);
    },
    setMemberBalance: async (memberId, currency, amount, fxRate) => {
      await setMemberBalanceMutation.mutateAsync({ memberId, currency, amount, fxRate });
    },
    setFXRate: async (currency, rate, date) => {
      await setFXRateMutation.mutateAsync({ currency, rate, date });
    },
    addExpense: async (data) => {
      await addExpenseMutation.mutateAsync(data);
    },
    deleteExpense: async (expenseId) => {
      await deleteExpenseMutation.mutateAsync(expenseId);
    },
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', currentTripId] });
    },
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTripContext() {
  const context = useContext(TripContext);
  if (!context) throw new Error('useTripContext must be used within TripProvider');
  return context;
}
