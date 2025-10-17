import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function ShiftReports() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    shiftId: "",
    totalSales: "",
    totalTax: "",
    cashAmount: "",
    creditAmount: "",
    debitAmount: "",
    mobileAmount: "",
    overShortAmount: "",
    fuelSales: "",
    grocerySales: "",
    notes: "",
  });

  const utils = trpc.useUtils();
  const { data: activeShifts } = trpc.shifts.active.useQuery({});
  const { data: stations } = trpc.gasStations.list.useQuery();
  const { data: employees } = trpc.employees.list.useQuery();

  const createReport = trpc.shiftReports.create.useMutation({
    onSuccess: () => {
      setOpen(false);
      setFormData({
        shiftId: "",
        totalSales: "",
        totalTax: "",
        cashAmount: "",
        creditAmount: "",
        debitAmount: "",
        mobileAmount: "",
        overShortAmount: "",
        fuelSales: "",
        grocerySales: "",
        notes: "",
      });
      toast.success("Shift closing report submitted successfully!");
    },
    onError: (error) => {
      toast.error("Failed to submit report: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert string values to numbers (in cents)
    const reportData = {
      shiftId: formData.shiftId,
      totalSales: Math.round(parseFloat(formData.totalSales) * 100),
      totalTax: Math.round(parseFloat(formData.totalTax) * 100),
      cashAmount: Math.round(parseFloat(formData.cashAmount) * 100),
      creditAmount: Math.round(parseFloat(formData.creditAmount) * 100),
      debitAmount: Math.round(parseFloat(formData.debitAmount) * 100),
      mobileAmount: Math.round(parseFloat(formData.mobileAmount) * 100),
      overShortAmount: Math.round(parseFloat(formData.overShortAmount) * 100),
      fuelSales: Math.round(parseFloat(formData.fuelSales) * 100),
      grocerySales: Math.round(parseFloat(formData.grocerySales) * 100),
      notes: formData.notes || undefined,
    };

    createReport.mutate(reportData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shift Closing Reports</h1>
          <p className="mt-2 text-gray-600">Submit and manage shift closing reports</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Submit Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submit Shift Closing Report</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="shiftId">Select Shift</Label>
                <Select
                  value={formData.shiftId}
                  onValueChange={(value) => setFormData({ ...formData, shiftId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a shift" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeShifts?.map((shift) => {
                      const station = stations?.find((s) => s.id === shift.gasStationId);
                      const employee = employees?.find((e) => e.id === shift.employeeId);
                      return (
                        <SelectItem key={shift.id} value={shift.id}>
                          {employee?.firstName} {employee?.lastName} - {station?.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalSales">Total Sales ($)</Label>
                  <Input
                    id="totalSales"
                    type="number"
                    step="0.01"
                    value={formData.totalSales}
                    onChange={(e) => setFormData({ ...formData, totalSales: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="totalTax">Total Tax ($)</Label>
                  <Input
                    id="totalTax"
                    type="number"
                    step="0.01"
                    value={formData.totalTax}
                    onChange={(e) => setFormData({ ...formData, totalTax: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3">Payment Methods</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cashAmount">Cash ($)</Label>
                    <Input
                      id="cashAmount"
                      type="number"
                      step="0.01"
                      value={formData.cashAmount}
                      onChange={(e) => setFormData({ ...formData, cashAmount: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="creditAmount">Credit ($)</Label>
                    <Input
                      id="creditAmount"
                      type="number"
                      step="0.01"
                      value={formData.creditAmount}
                      onChange={(e) => setFormData({ ...formData, creditAmount: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="debitAmount">Debit ($)</Label>
                    <Input
                      id="debitAmount"
                      type="number"
                      step="0.01"
                      value={formData.debitAmount}
                      onChange={(e) => setFormData({ ...formData, debitAmount: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobileAmount">Mobile Payment ($)</Label>
                    <Input
                      id="mobileAmount"
                      type="number"
                      step="0.01"
                      value={formData.mobileAmount}
                      onChange={(e) => setFormData({ ...formData, mobileAmount: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3">Sales Breakdown</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fuelSales">Fuel Sales ($)</Label>
                    <Input
                      id="fuelSales"
                      type="number"
                      step="0.01"
                      value={formData.fuelSales}
                      onChange={(e) => setFormData({ ...formData, fuelSales: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="grocerySales">Grocery Sales ($)</Label>
                    <Input
                      id="grocerySales"
                      type="number"
                      step="0.01"
                      value={formData.grocerySales}
                      onChange={(e) => setFormData({ ...formData, grocerySales: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="overShortAmount">Over/Short Amount ($)</Label>
                <Input
                  id="overShortAmount"
                  type="number"
                  step="0.01"
                  value={formData.overShortAmount}
                  onChange={(e) => setFormData({ ...formData, overShortAmount: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createReport.isPending}>
                  {createReport.isPending ? "Submitting..." : "Submit Report"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Recent Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Reports will appear here after submission. Use the date range filter to view historical reports.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

