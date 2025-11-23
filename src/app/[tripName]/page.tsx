'use client';

import { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TripProvider,
  useTripContext,
  MembersPanel,
  FXRatePanel,
  ExpenseList,
  BalancesPanel,
  SettlementPanel,
  TripSettings,
} from '@/components/trip';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Receipt, Users, TrendingUp, Wallet, HandCoins, Banknote, Calculator } from 'lucide-react';
import { FullPageLoader, LoadingOverlay } from '@/components/ui/loader';

const ADMIN_PASSWORD = 'numoney2024';

const navItems = [
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'members', label: 'Members', icon: Users, adminOnly: true },
  { id: 'fx', label: 'FX Rates', icon: TrendingUp, adminOnly: true },
  { id: 'balances', label: 'Balances', icon: Wallet },
  { id: 'settle', label: 'Settlement', icon: HandCoins },
];

function TripDashboard({ isAdmin }: { isAdmin: boolean }) {
  const { currentTrip, isLoading, isMutating } = useTripContext();
  const [activeTab, setActiveTab] = useState('expenses');

  if (isLoading || !currentTrip) {
    return <FullPageLoader text="Fetching trip data..." />;
  }

  const expenses = currentTrip.expenses || [];
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amountInBase, 0);

  const visibleNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b">
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Banknote className="h-4 w-4" />
            </div>
            <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
              <span className="font-semibold">NuMoney</span>
              {isAdmin && <Badge variant="secondary" className="text-[10px] w-fit">Admin</Badge>}
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu className="px-2 py-2">
            {visibleNavItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  isActive={activeTab === item.id}
                  onClick={() => setActiveTab(item.id)}
                  tooltip={item.label}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        {isAdmin && (
          <SidebarFooter className="border-t">
            <div className="p-2 group-data-[collapsible=icon]:hidden">
              <TripSettings />
            </div>
          </SidebarFooter>
        )}
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-2" />
          <div className="flex-1" />
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl">
            {/* Trip Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{currentTrip.name}</h1>
                  {(currentTrip.startDate || currentTrip.endDate) && (
                    <p className="text-sm text-muted-foreground">
                      {currentTrip.startDate && new Date(currentTrip.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {currentTrip.startDate && currentTrip.endDate && ' - '}
                      {currentTrip.endDate && new Date(currentTrip.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <Badge variant="outline">INR</Badge>
                  <Badge variant="outline">MYR</Badge>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Expenses</p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{expenses.length}</p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Total Spent</p>
                        <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">₹{totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Calculator className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <LoadingOverlay isLoading={isMutating} text="Saving...">
              {activeTab === 'expenses' && <ExpenseList />}
              {activeTab === 'members' && isAdmin && <MembersPanel />}
              {activeTab === 'fx' && isAdmin && <FXRatePanel />}
              {activeTab === 'balances' && <BalancesPanel />}
              {activeTab === 'settle' && <SettlementPanel />}
            </LoadingOverlay>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function TripPageContent({ tripId, isAdmin }: { tripId: string; isAdmin: boolean }) {
  return (
    <TripProvider tripId={tripId} isAdmin={isAdmin}>
      <TripDashboard isAdmin={isAdmin} />
    </TripProvider>
  );
}

export default function TripPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tripName = params.tripName as string;
  const adminParam = searchParams.get('admin');
  const isAdmin = adminParam === ADMIN_PASSWORD;

  const { data: trips, isLoading, error } = useQuery({
    queryKey: ['trips'],
    queryFn: api.fetchTrips,
  });

  const trip = trips?.find(t => t.name.toLowerCase() === tripName.toLowerCase());

  if (isLoading) {
    return <FullPageLoader text="Finding trip..." />;
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Trip Not Found</CardTitle>
            <CardDescription>
              The trip &quot;{tripName}&quot; could not be found.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please check the URL and try again, or contact the trip administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <TripPageContent tripId={trip.id} isAdmin={isAdmin} />;
}
