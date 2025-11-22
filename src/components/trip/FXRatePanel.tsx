'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useTripContext } from './TripContext';

export function FXRatePanel() {
  const { currentTrip, setFXRate } = useTripContext();
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newRate, setNewRate] = useState('19');

  const myrRates = (currentTrip?.fxRates || [])
    .filter((r) => r.currency === 'MYR')
    .sort((a, b) => b.date.localeCompare(a.date));

  const handleAddRate = async () => {
    if (newRate && newDate) {
      await setFXRate('MYR', parseFloat(newRate), newDate);
      setNewRate('19');
    }
  };

  const handleCopyYesterday = async () => {
    if (myrRates.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      await setFXRate('MYR', myrRates[0].rate, today);
    }
  };

  if (!currentTrip) {
    return (
      <Card>
        <CardHeader><CardTitle>FX Rates</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Select a trip to manage FX rates.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>FX Rates</span>
          <Badge variant="outline">MYR to INR</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label htmlFor="fxDate" className="text-xs">Date</Label>
            <Input id="fxDate" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="fxRate" className="text-xs">Rate</Label>
            <Input id="fxRate" type="number" step="0.01" value={newRate} onChange={(e) => setNewRate(e.target.value)} placeholder="19.00" />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAddRate} className="w-full">Add</Button>
          </div>
        </div>

        {myrRates.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleCopyYesterday} className="w-full">
            Copy Last Rate to Today
          </Button>
        )}

        {myrRates.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Rate (1 MYR = ? INR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myrRates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell>{new Date(rate.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                  <TableCell className="text-right font-mono">₹{rate.rate.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground py-4">No FX rates set. Add your first rate for MYR to INR conversion.</p>
        )}
      </CardContent>
    </Card>
  );
}
