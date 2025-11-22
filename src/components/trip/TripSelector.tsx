'use client';

import { useTripContext } from './TripContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateTripDialog } from './CreateTripDialog';

export function TripSelector() {
  const { trips, currentTripId, setCurrentTripId } = useTripContext();

  return (
    <div className="flex flex-col gap-2">
      {trips.length > 0 ? (
        <Select value={currentTripId || ''} onValueChange={setCurrentTripId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a trip" />
          </SelectTrigger>
          <SelectContent>
            {trips.map((trip) => (
              <SelectItem key={trip.id} value={trip.id}>
                {trip.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">No trips yet. Create your first trip!</p>
      )}
      <CreateTripDialog />
    </div>
  );
}
