'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useTripContext } from './TripContext';

export function MembersPanel() {
  const { currentTrip, addMember, removeMember, setMemberBalance } = useTripContext();
  const [newMemberName, setNewMemberName] = useState('');
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [inrBalance, setInrBalance] = useState('0');
  const [myrBalance, setMyrBalance] = useState('0');
  const [myrFxRate, setMyrFxRate] = useState('19');

  const members = currentTrip?.members || [];

  const handleAddMember = async () => {
    if (newMemberName.trim()) {
      await addMember(newMemberName.trim());
      setNewMemberName('');
    }
  };

  const openBalanceDialog = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    const inr = member?.balances?.find((b) => b.currency === 'INR');
    const myr = member?.balances?.find((b) => b.currency === 'MYR');
    setInrBalance(inr?.amount?.toString() || '0');
    setMyrBalance(myr?.amount?.toString() || '0');
    setMyrFxRate(myr?.fxRate?.toString() || '19');
    setSelectedMemberId(memberId);
    setBalanceDialogOpen(true);
  };

  const handleSaveBalance = async () => {
    if (!selectedMemberId) return;
    await setMemberBalance(selectedMemberId, 'INR', parseFloat(inrBalance) || 0);
    await setMemberBalance(selectedMemberId, 'MYR', parseFloat(myrBalance) || 0, parseFloat(myrFxRate) || 19);
    setBalanceDialogOpen(false);
    setSelectedMemberId(null);
  };

  const getBalanceDisplay = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    const parts: string[] = [];
    const inr = member?.balances?.find((b) => b.currency === 'INR');
    const myr = member?.balances?.find((b) => b.currency === 'MYR');
    if (inr && inr.amount !== 0) parts.push(`₹${inr.amount.toLocaleString()}`);
    if (myr && myr.amount !== 0) parts.push(`RM ${myr.amount.toLocaleString()}`);
    return parts.length > 0 ? parts.join(' + ') : 'No starting balance';
  };

  if (!currentTrip) {
    return (
      <Card>
        <CardHeader><CardTitle>Members</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Select a trip to manage members.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Members ({members.length})</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="Member name" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddMember()} />
          <Button onClick={handleAddMember} disabled={!newMemberName.trim()}>Add</Button>
        </div>

        <div className="space-y-2">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex flex-col">
                <span className="font-medium">{member.name}</span>
                <span className="text-xs text-muted-foreground">{getBalanceDisplay(member.id)}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openBalanceDialog(member.id)}>Set Balance</Button>
                <Button variant="destructive" size="sm" onClick={() => removeMember(member.id)}>Remove</Button>
              </div>
            </div>
          ))}
        </div>

        {members.length === 0 && <p className="text-center text-muted-foreground py-4">Add members to start tracking expenses.</p>}

        <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Starting Balance</DialogTitle>
              <DialogDescription>Enter the starting balance for each currency.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="inrBalance">INR Balance</Label>
                <Input id="inrBalance" type="number" value={inrBalance} onChange={(e) => setInrBalance(e.target.value)} placeholder="0" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="myrBalance">MYR Balance</Label>
                <Input id="myrBalance" type="number" value={myrBalance} onChange={(e) => setMyrBalance(e.target.value)} placeholder="0" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="myrFxRate">MYR to INR Rate <Badge variant="secondary">Custom</Badge></Label>
                <Input id="myrFxRate" type="number" step="0.01" value={myrFxRate} onChange={(e) => setMyrFxRate(e.target.value)} placeholder="19" />
                <p className="text-xs text-muted-foreground">Rate used to convert MYR starting balance to INR</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBalanceDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveBalance}>Save Balance</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
