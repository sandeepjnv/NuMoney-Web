'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTripContext } from './TripContext';
import { fetchSettlement } from '@/lib/api';

export function BalancesPanel() {
  const { currentTrip } = useTripContext();

  const { data } = useQuery({
    queryKey: ['settlement', currentTrip?.id],
    queryFn: () => fetchSettlement(currentTrip!.id),
    enabled: !!currentTrip,
  });

  const ledger = data?.ledger || [];
  const currentMYRRate = data?.currentRate || 19;
  const totalNetBalance = ledger.reduce((sum, l) => sum + l.netBalance, 0);

  if (!currentTrip) {
    return (
      <Card>
        <CardHeader><CardTitle>Balances & Ledger</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Select a trip to view balances.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Balances & Ledger</span>
          <Badge variant={Math.abs(totalNetBalance) < 1 ? 'default' : 'destructive'}>
            {Math.abs(totalNetBalance) < 1 ? 'Balanced' : `Off by ₹${totalNetBalance.toFixed(2)}`}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {ledger.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead className="text-right">Starting</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Owes</TableHead>
                  <TableHead className="text-right">Net Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.map((entry) => (
                  <TableRow key={entry.memberId}>
                    <TableCell className="font-medium">{entry.memberName}</TableCell>
                    <TableCell className="text-right">
                      <div>
                        {entry.startingBalanceINR > 0 && <div className="text-xs">₹{entry.startingBalanceINR.toLocaleString()}</div>}
                        {entry.startingBalanceMYR > 0 && <div className="text-xs text-muted-foreground">RM {entry.startingBalanceMYR.toLocaleString()}</div>}
                        {entry.startingBalanceINR === 0 && entry.startingBalanceMYR === 0 && <span className="text-muted-foreground">-</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-green-600">{entry.totalSpent > 0 ? `₹${entry.totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '-'}</TableCell>
                    <TableCell className="text-right text-orange-600">{entry.totalShare > 0 ? `₹${entry.totalShare.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className={entry.netBalance > 0 ? 'text-green-600 font-semibold' : entry.netBalance < 0 ? 'text-red-600 font-semibold' : ''}>
                        {entry.netBalance >= 0 ? '+' : ''}₹{entry.netBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </div>
                      {entry.netBalance !== 0 && <div className="text-xs text-muted-foreground">RM {(entry.netBalance / currentMYRRate).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">Add members and expenses to see balances.</p>
        )}

        {ledger.length > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="font-medium text-sm mb-2">Understanding the Ledger</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li><span className="font-medium">Starting:</span> Cash/funds brought for the trip</li>
              <li><span className="font-medium">Paid:</span> Total amount paid for group expenses</li>
              <li><span className="font-medium">Owes:</span> Share of expenses they need to cover</li>
              <li><span className="font-medium text-green-600">+ve Balance:</span> Others owe them money</li>
              <li><span className="font-medium text-red-600">-ve Balance:</span> They owe money to others</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
