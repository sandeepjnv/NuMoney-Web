'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useTripContext } from './TripContext';
import { calculateShares } from '@/lib/api';
import type { SplitConfig, Currency, SplitMethod, Expense } from '@/types';
import {
  Plus,
  Wallet,
  ArrowRight,
  Check,
  AlertCircle,
  Equal,
  Hash,
  Percent,
  Scale,
  Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'Food & Dining', icon: '🍽️' },
  { value: 'Transport', icon: '🚗' },
  { value: 'Accommodation', icon: '🏨' },
  { value: 'Shopping', icon: '🛍️' },
  { value: 'Entertainment', icon: '🎬' },
  { value: 'Activities', icon: '🎯' },
  { value: 'Other', icon: '📦' },
];

const SPLIT_METHODS = [
  { value: 'even', label: 'Even', icon: Equal },
  { value: 'fixed', label: 'Fixed', icon: Hash },
  { value: 'percentage', label: '%', icon: Percent },
  { value: 'weight', label: 'Weight', icon: Scale },
];

interface AddExpenseDialogProps {
  expense?: Expense;
  trigger?: React.ReactNode;
  onClose?: () => void;
}

export function AddExpenseDialog({ expense, trigger, onClose }: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const { currentTrip, addExpense } = useTripContext();
  const members = currentTrip?.members || [];

  const isEditMode = !!expense;

  const [paidById, setPaidById] = useState(expense?.paidById || '');
  const [amount, setAmount] = useState(expense?.amount?.toString() || '');
  const [currency, setCurrency] = useState<Currency>((expense?.currency as Currency) || 'MYR');
  const [description, setDescription] = useState(expense?.description || '');
  const [category, setCategory] = useState(expense?.category || '');
  const [date, setDate] = useState(expense?.date || new Date().toISOString().split('T')[0]);
  const [splitMethod, setSplitMethod] = useState<SplitMethod>((expense?.splitMethod as SplitMethod) || 'even');
  const [fxRate, setFxRate] = useState(expense?.fxRate?.toString() || '19');
  const [splitConfig, setSplitConfig] = useState<Record<string, string>>({});
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize selected members
  useEffect(() => {
    if (expense && expense.shares) {
      const memberIds = new Set(expense.shares.map(s => s.memberId));
      setSelectedMembers(memberIds);
    } else if (members.length > 0) {
      setSelectedMembers(new Set(members.map(m => m.id)));
    }
  }, [expense, members]);

  // Initialize split config from expense
  useEffect(() => {
    if (expense && expense.shares && splitMethod !== 'even') {
      const config: Record<string, string> = {};
      expense.shares.forEach(s => {
        if (splitMethod === 'fixed') {
          config[s.memberId] = s.amount.toString();
        } else if (splitMethod === 'percentage') {
          const total = expense.amount;
          config[s.memberId] = ((s.amount / total) * 100).toFixed(2);
        } else {
          config[s.memberId] = '1';
        }
      });
      setSplitConfig(config);
    }
  }, [expense, splitMethod]);

  useEffect(() => {
    if (currentTrip && date && currency === 'MYR') {
      const rates = currentTrip.fxRates.filter((r) => r.currency === 'MYR' && r.date <= date);
      if (rates.length > 0) {
        rates.sort((a, b) => b.date.localeCompare(a.date));
        setFxRate(rates[0].rate.toString());
      }
    } else if (currency === 'INR') {
      setFxRate('1');
    }
  }, [currentTrip, date, currency]);

  useEffect(() => {
    if (!expense) {
      const config: Record<string, string> = {};
      members.forEach((m) => {
        if (selectedMembers.has(m.id)) {
          config[m.id] = splitMethod === 'weight' ? '1' : splitMethod === 'percentage' ? (100 / selectedMembers.size).toFixed(2) : '0';
        }
      });
      setSplitConfig(config);
    }
  }, [members, splitMethod, selectedMembers, expense]);

  const handleMemberToggle = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedMembers.size === members.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(members.map(m => m.id)));
    }
  };

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  const handleSubmit = async () => {
    if (!currentTrip || !paidById || !amount || !description || selectedMembers.size === 0) return;

    setIsSubmitting(true);
    try {
      const parsedAmount = parseFloat(amount);
      const parsedFxRate = parseFloat(fxRate);

      const selectedMembersList = members.filter(m => selectedMembers.has(m.id));
      const splitConfigArray: SplitConfig[] = splitMethod === 'even'
        ? selectedMembersList.map((m) => ({ memberId: m.id, value: 1 }))
        : selectedMembersList.map((m) => ({ memberId: m.id, value: parseFloat(splitConfig[m.id]) || 0 }));

      const shares = calculateShares(selectedMembersList, parsedAmount, currency, parsedFxRate, splitMethod, splitConfigArray);

      await addExpense({
        tripId: currentTrip.id,
        paidById,
        amount: parsedAmount,
        currency,
        description,
        category: category || undefined,
        date,
        splitMethod,
        fxRate: parsedFxRate,
        shares,
      });

      // Reset form
      setAmount('');
      setDescription('');
      setCategory('');
      setSplitMethod('even');
      setPaidById('');
      setSelectedMembers(new Set(members.map(m => m.id)));
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const convertedAmount = currency === 'INR' ? parseFloat(amount) || 0 : (parseFloat(amount) || 0) * (parseFloat(fxRate) || 0);
  const totalSplitValue = Object.entries(splitConfig)
    .filter(([id]) => selectedMembers.has(id))
    .reduce((sum, [, v]) => sum + (parseFloat(v) || 0), 0);
  const isPercentageValid = splitMethod !== 'percentage' || Math.abs(totalSplitValue - 100) < 0.01;
  const isFixedValid = splitMethod !== 'fixed' || Math.abs(totalSplitValue - parseFloat(amount || '0')) < 0.01;
  const isFormValid = paidById && amount && description && selectedMembers.size > 0 && isPercentageValid && isFixedValid;

  const perPersonAmount = selectedMembers.size > 0 ? (parseFloat(amount) || 0) / selectedMembers.size : 0;

  if (!currentTrip || members.length === 0) {
    return (
      <Button disabled className="w-full gap-2">
        <Plus className="h-4 w-4" />
        Add Expense (Add members first)
      </Button>
    );
  }

  const dialogTrigger = trigger || (
    <Button className="w-full gap-2">
      <Plus className="h-4 w-4" />
      Add Expense
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{dialogTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl">{isEditMode ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the expense details.' : 'Record a shared expense for the trip.'}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 space-y-4">
          {/* Row 1: Paid By & Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Paid By</Label>
              <Select value={paidById} onValueChange={setPaidById}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Currency</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">₹ INR</SelectItem>
                  <SelectItem value="MYR">RM MYR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {currency === 'MYR' ? 'RM' : '₹'}
                </span>
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-10 h-10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          {/* FX Rate (conditional) */}
          {currency === 'MYR' && amount && (
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 text-sm">
              <span className="text-muted-foreground">FX:</span>
              <Input
                type="number"
                step="0.01"
                value={fxRate}
                onChange={(e) => setFxRate(e.target.value)}
                className="w-16 h-7 text-center text-xs"
              />
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                ₹{convertedAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {/* Row 3: Description & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What for?"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center gap-2">
                        <span>{c.icon}</span>
                        {c.value}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Members Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Split between</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={handleSelectAll}
              >
                {selectedMembers.size === members.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {members.map((m) => (
                <label
                  key={m.id}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all',
                    selectedMembers.has(m.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/50'
                  )}
                >
                  <Checkbox
                    checked={selectedMembers.has(m.id)}
                    onCheckedChange={() => handleMemberToggle(m.id)}
                  />
                  <span className="text-sm truncate">{m.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Split Method */}
          {selectedMembers.size > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Split method</Label>

              <div className="grid grid-cols-4 gap-1.5">
                {SPLIT_METHODS.map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setSplitMethod(method.value as SplitMethod)}
                    className={cn(
                      'flex flex-col items-center gap-1 py-2 px-2 rounded-md border transition-all text-xs',
                      splitMethod === method.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-muted'
                    )}
                  >
                    <method.icon className="h-4 w-4" />
                    <span className="font-medium">{method.label}</span>
                  </button>
                ))}
              </div>

              {/* Split Details */}
              <Card>
                <CardContent className="p-3 space-y-2">
                  {members.filter(m => selectedMembers.has(m.id)).map((m) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <span className="flex-1 text-sm truncate">{m.name}</span>
                      {splitMethod === 'even' ? (
                        <span className="text-sm text-muted-foreground">
                          {currency === 'MYR' ? 'RM ' : '₹'}{perPersonAmount.toFixed(2)}
                        </span>
                      ) : (
                        <div className="relative w-20">
                          <Input
                            type="number"
                            step={splitMethod === 'weight' ? '0.1' : '0.01'}
                            value={splitConfig[m.id] || '0'}
                            onChange={(e) => setSplitConfig((prev) => ({ ...prev, [m.id]: e.target.value }))}
                            className="h-8 text-right pr-6 text-sm"
                          />
                          {splitMethod === 'percentage' && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Validation */}
                  {(splitMethod === 'percentage' || splitMethod === 'fixed') && (
                    <div className={cn(
                      'flex items-center gap-1.5 text-xs mt-2 pt-2 border-t',
                      (splitMethod === 'percentage' && !isPercentageValid) || (splitMethod === 'fixed' && !isFixedValid)
                        ? 'text-destructive'
                        : 'text-emerald-600 dark:text-emerald-400'
                    )}>
                      {((splitMethod === 'percentage' && isPercentageValid) || (splitMethod === 'fixed' && isFixedValid)) ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      <span>
                        {splitMethod === 'percentage' && `Total: ${totalSplitValue.toFixed(1)}%`}
                        {splitMethod === 'fixed' && `Total: ${totalSplitValue.toFixed(2)}`}
                        {!isPercentageValid && splitMethod === 'percentage' && ' (need 100%)'}
                        {!isFixedValid && splitMethod === 'fixed' && ` (need ${amount || '0'})`}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-4 gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid || isSubmitting} className="gap-2">
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {isEditMode ? 'Saving...' : 'Adding...'}
              </>
            ) : (
              <>
                {isEditMode ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {isEditMode ? 'Save Changes' : 'Add Expense'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Export a component for viewing/editing expense
export function ExpenseDetailDialog({ expense }: { expense: Expense }) {
  const { currentTrip } = useTripContext();
  const members = currentTrip?.members || [];
  const paidByMember = members.find(m => m.id === expense.paidById);

  return (
    <AddExpenseDialog
      expense={expense}
      trigger={
        <button className="w-full text-left hover:bg-muted/50 transition-colors rounded-lg p-1 -m-1">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{expense.description}</span>
                {expense.category && (
                  <span className="text-xs text-muted-foreground">
                    {CATEGORIES.find(c => c.value === expense.category)?.icon}
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {paidByMember?.name} paid • {new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </div>
            </div>
            <div className="text-right pl-3">
              <div className="font-semibold">
                {expense.currency === 'MYR' ? 'RM ' : '₹'}{expense.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
              {expense.currency === 'MYR' && (
                <div className="text-xs text-muted-foreground">
                  ₹{expense.amountInBase.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
              )}
            </div>
          </div>
        </button>
      }
    />
  );
}
