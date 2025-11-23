'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTripContext } from './TripContext';
import { AddExpenseDialog } from './AddExpenseDialog';
import type { Expense } from '@/types';
import { Trash2, ChevronRight } from 'lucide-react';

const CATEGORIES = [
  { value: 'Food & Dining', icon: '🍽️' },
  { value: 'Transport', icon: '🚗' },
  { value: 'Accommodation', icon: '🏨' },
  { value: 'Shopping', icon: '🛍️' },
  { value: 'Entertainment', icon: '🎬' },
  { value: 'Activities', icon: '🎯' },
  { value: 'Other', icon: '📦' },
];

type FilterType = 'all' | 'my' | 'highValue' | 'INR' | 'MYR';

function ExpenseDetailView({ expense, onClose }: { expense: Expense; onClose: () => void }) {
  const { currentTrip, deleteExpense } = useTripContext();
  const members = currentTrip?.members || [];

  const paidByMember = members.find(m => m.id === expense.paidById);
  const categoryIcon = CATEGORIES.find(c => c.value === expense.category)?.icon;

  const handleDelete = async () => {
    await deleteExpense(expense.id);
    onClose();
  };

  return (
    <DialogContent className="sm:max-w-[450px]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {categoryIcon && <span>{categoryIcon}</span>}
          {expense.description}
        </DialogTitle>
        <DialogDescription>
          Expense details
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {/* Amount */}
        <div className="text-center py-4 bg-muted/50 rounded-lg">
          <div className="text-3xl font-bold">
            {expense.currency === 'MYR' ? 'RM ' : '₹'}{expense.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          {expense.currency === 'MYR' && (
            <div className="text-sm text-muted-foreground mt-1">
              ₹{expense.amountInBase.toLocaleString('en-IN', { maximumFractionDigits: 0 })} @ {expense.fxRate}
            </div>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <div className="text-muted-foreground">Paid by</div>
            <div className="font-medium">{paidByMember?.name || 'Unknown'}</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Date</div>
            <div className="font-medium">
              {new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
          {expense.category && (
            <div className="space-y-1">
              <div className="text-muted-foreground">Category</div>
              <div className="font-medium">{expense.category}</div>
            </div>
          )}
          <div className="space-y-1">
            <div className="text-muted-foreground">Split method</div>
            <div className="font-medium capitalize">{expense.splitMethod}</div>
          </div>
        </div>

        {/* Shares */}
        {expense.shares && expense.shares.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Split between</div>
          <div className="space-y-1.5">
            {expense.shares.map((share) => {
              const member = members.find(m => m.id === share.memberId);
              return (
                <div key={share.id} className="flex items-center justify-between text-sm py-1.5 px-3 rounded bg-muted/30">
                  <span>{member?.name || 'Unknown'}</span>
                  <span className="font-medium">
                    {expense.currency === 'MYR' ? 'RM ' : '₹'}{share.amount.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        )}
      </div>

      <DialogFooter className="gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="gap-1.5">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &quot;{expense.description}&quot; and update all balances.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function ExpenseList() {
  const { currentTrip } = useTripContext();
  const expenses = currentTrip?.expenses || [];
  const members = currentTrip?.members || [];

  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const getMemberName = (memberId: string) => members.find((m) => m.id === memberId)?.name || 'Unknown';

  const filteredExpenses = expenses.filter((exp) => {
    if (filter === 'my' && selectedMember && exp.paidById !== selectedMember) return false;
    if (filter === 'highValue' && exp.amountInBase < 1000) return false;
    if (filter === 'INR' && exp.currency !== 'INR') return false;
    if (filter === 'MYR' && exp.currency !== 'MYR') return false;
    if (categoryFilter !== 'all' && exp.category !== categoryFilter) return false;
    return true;
  });

  const categories = [...new Set(expenses.map((e) => e.category).filter(Boolean))];
  const totalInBase = filteredExpenses.reduce((sum, e) => sum + e.amountInBase, 0);

  if (!currentTrip) {
    return (
      <Card>
        <CardHeader><CardTitle>Expenses</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Select a trip to view expenses.</p></CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Expenses ({filteredExpenses.length})</span>
            <span className="text-sm font-normal text-muted-foreground">
              Total: ₹{totalInBase.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AddExpenseDialog />

          <div className="flex flex-wrap gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="my">My Expenses</SelectItem>
                <SelectItem value="highValue">High Value</SelectItem>
                <SelectItem value="INR">INR Only</SelectItem>
                <SelectItem value="MYR">MYR Only</SelectItem>
              </SelectContent>
            </Select>

            {filter === 'my' && (
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {categories.length > 0 && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c!}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            {filteredExpenses.map((expense) => {
              const categoryIcon = CATEGORIES.find(c => c.value === expense.category)?.icon;
              return (
                <button
                  key={expense.id}
                  onClick={() => setSelectedExpense(expense)}
                  className="w-full text-left p-3 border rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {categoryIcon && <span className="text-sm">{categoryIcon}</span>}
                        <span className="font-medium truncate">{expense.description}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getMemberName(expense.paidById)} • {new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pl-3">
                      <div className="text-right">
                        <div className="font-semibold">
                          {expense.currency === 'MYR' ? 'RM ' : '₹'}{expense.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </div>
                        {expense.currency === 'MYR' && (
                          <div className="text-xs text-muted-foreground">
                            ₹{expense.amountInBase.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {filteredExpenses.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              {expenses.length === 0 ? 'No expenses yet. Add your first expense!' : 'No expenses match the current filters.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Expense Detail Dialog */}
      <Dialog open={!!selectedExpense} onOpenChange={(open) => !open && setSelectedExpense(null)}>
        {selectedExpense && (
          <ExpenseDetailView
            expense={selectedExpense}
            onClose={() => setSelectedExpense(null)}
          />
        )}
      </Dialog>
    </>
  );
}
