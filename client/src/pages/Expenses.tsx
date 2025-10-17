import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Plus } from "lucide-react";
import { toast } from "sonner";

export default function Expenses() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    gasStationId: "",
    category: "supplies" as "payroll" | "utilities" | "maintenance" | "supplies" | "rent" | "insurance" | "taxes" | "other",
    amount: "",
    description: "",
    expenseDate: new Date().toISOString().split("T")[0],
  });

  const utils = trpc.useUtils();
  const { data: stations } = trpc.gasStations.list.useQuery();

  const createExpense = trpc.expenses.create.useMutation({
    onSuccess: () => {
      setOpen(false);
      setFormData({
        gasStationId: "",
        category: "supplies",
        amount: "",
        description: "",
        expenseDate: new Date().toISOString().split("T")[0],
      });
      toast.success("Expense added successfully!");
    },
    onError: (error) => {
      toast.error("Failed to add expense: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createExpense.mutate({
      ...formData,
      amount: Math.round(parseFloat(formData.amount) * 100), // Convert to cents
    });
  };

  const categories = [
    { value: "payroll", label: "Payroll" },
    { value: "utilities", label: "Utilities" },
    { value: "maintenance", label: "Maintenance" },
    { value: "supplies", label: "Supplies" },
    { value: "rent", label: "Rent" },
    { value: "insurance", label: "Insurance" },
    { value: "taxes", label: "Taxes" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="mt-2 text-gray-600">Track and manage gas station expenses</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="gasStationId">Gas Station</Label>
                <Select
                  value={formData.gasStationId}
                  onValueChange={(value) => setFormData({ ...formData, gasStationId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a gas station" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations?.map((station) => (
                      <SelectItem key={station.id} value={station.id}>
                        {station.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="expenseDate">Date</Label>
                <Input
                  id="expenseDate"
                  type="date"
                  value={formData.expenseDate}
                  onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createExpense.isPending}>
                  {createExpense.isPending ? "Adding..." : "Add Expense"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Expenses Overview */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {categories.slice(0, 4).map((category) => (
          <Card key={category.value}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {category.label}
              </CardTitle>
              <DollarSign className="w-5 h-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">$0</div>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Expenses will appear here. Use filters to view expenses by category, date range, or gas station.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

