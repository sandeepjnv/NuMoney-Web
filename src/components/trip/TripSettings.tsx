'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTripContext } from './TripContext';

export function TripSettings() {
  const { currentTrip, updateTrip, deleteTrip, setCurrentTripId } = useTripContext();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && currentTrip) {
      setName(currentTrip.name);
      setStartDate(currentTrip.startDate ? new Date(currentTrip.startDate).toISOString().split('T')[0] : '');
      setEndDate(currentTrip.endDate ? new Date(currentTrip.endDate).toISOString().split('T')[0] : '');
    }
  };

  const handleSave = async () => {
    if (currentTrip && name.trim()) {
      await updateTrip(currentTrip.id, { name: name.trim(), startDate: startDate ? new Date(startDate) : null, endDate: endDate ? new Date(endDate) : null });
      setOpen(false);
    }
  };

  const handleDelete = async () => {
    if (currentTrip) {
      await deleteTrip(currentTrip.id);
      setCurrentTripId(null);
    }
  };

  const handleExportCSV = () => {
    if (!currentTrip) return;
    const headers = ['Date', 'Description', 'Category', 'Paid By', 'Amount', 'Currency', 'FX Rate', 'Amount (INR)', 'Split Method'];
    const rows = (currentTrip.expenses || []).map((e) => [
      e.date,
      e.description,
      e.category || '',
      currentTrip.members?.find((m) => m.id === e.paidById)?.name || '',
      e.amount.toString(),
      e.currency,
      e.fxRate.toString(),
      e.amountInBase.toString(),
      e.splitMethod,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentTrip.name}-expenses-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!currentTrip) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild><Button variant="outline" size="sm">Settings</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Trip Settings</DialogTitle>
          <DialogDescription>Edit trip details or manage trip data.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="tripName">Trip Name</Label>
            <Input id="tripName" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tripStartDate">Start Date</Label>
            <Input id="tripStartDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tripEndDate">End Date</Label>
            <Input id="tripEndDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <div className="border-t pt-4 space-y-2">
            <Button variant="outline" className="w-full" onClick={handleExportCSV}>Export Expenses as CSV</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="destructive" className="w-full">Delete Trip</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Trip?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete &quot;{currentTrip.name}&quot; and all associated data.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
