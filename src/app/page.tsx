'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TripProvider,
  useTripContext,
  CreateTripDialog,
} from '@/components/trip';
import { ExternalLink, Plus } from 'lucide-react';
import { Loader, LoadingOverlay } from '@/components/ui/loader';

function AdminDashboard() {
  const { trips, isLoading, isMutating } = useTripContext();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" text="Loading trips..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center px-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 font-semibold">
            <span className="text-xl">NuMoney</span>
          </div>
          <div className="flex-1" />
          <CreateTripDialog />
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 py-6">
        <LoadingOverlay isLoading={isMutating} text="Creating trip...">
        <Card>
          <CardHeader>
            <CardTitle>Your Trips</CardTitle>
            <CardDescription>
              Select a trip to manage or share the link with your group
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trips.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No trips yet. Create your first trip to get started.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {trips.map((trip) => (
                  <div
                    key={trip.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <h3 className="font-medium">{trip.name}</h3>
                      {(trip.startDate || trip.endDate) && (
                        <p className="text-sm text-muted-foreground">
                          {trip.startDate && new Date(trip.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {trip.startDate && trip.endDate && ' - '}
                          {trip.endDate && new Date(trip.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Share: /{trip.name.toLowerCase()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/${encodeURIComponent(trip.name.toLowerCase())}`)}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => router.push(`/${encodeURIComponent(trip.name.toLowerCase())}?admin=numoney2024`)}
                      >
                        Manage
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </LoadingOverlay>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-8">
        <div className="container max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>NuMoney - Multi-Currency Travel Expense Tracker</p>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <TripProvider>
      <AdminDashboard />
    </TripProvider>
  );
}
