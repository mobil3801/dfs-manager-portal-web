import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Plus, StopCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Shifts() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    gasStationId: "",
    employeeId: "",
  });

  const utils = trpc.useUtils();
  const { data: activeShifts, isLoading } = trpc.shifts.active.useQuery({});
  const { data: stations } = trpc.gasStations.list.useQuery();
  const { data: employees } = trpc.employees.list.useQuery();

  const createShift = trpc.shifts.create.useMutation({
    onSuccess: () => {
      utils.shifts.active.invalidate();
      setOpen(false);
      setFormData({ gasStationId: "", employeeId: "" });
      toast.success("Shift started successfully!");
    },
    onError: (error) => {
      toast.error("Failed to start shift: " + error.message);
    },
  });

  const endShift = trpc.shifts.end.useMutation({
    onSuccess: () => {
      utils.shifts.active.invalidate();
      toast.success("Shift ended successfully!");
    },
    onError: (error) => {
      toast.error("Failed to end shift: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createShift.mutate({
      ...formData,
      startTime: new Date(),
    });
  };

  const handleEndShift = (shiftId: string) => {
    endShift.mutate({
      shiftId,
      endTime: new Date(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shifts</h1>
          <p className="mt-2 text-gray-600">Manage employee shifts</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Start Shift
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start New Shift</DialogTitle>
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
                <Label htmlFor="employeeId">Employee</Label>
                <Select
                  value={formData.employeeId}
                  onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees
                      ?.filter((emp) => emp.isActive)
                      .map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createShift.isPending}>
                  {createShift.isPending ? "Starting..." : "Start Shift"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Shifts */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Shifts</h2>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : activeShifts && activeShifts.length > 0 ? (
          <div className="space-y-4">
            {activeShifts.map((shift) => {
              const station = stations?.find((s) => s.id === shift.gasStationId);
              const employee = employees?.find((e) => e.id === shift.employeeId);
              return (
                <Card key={shift.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <Clock className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {employee?.firstName} {employee?.lastName}
                          </h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span>{station?.name}</span>
                            <span>• Started: {format(new Date(shift.startTime), "MMM dd, yyyy h:mm a")}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleEndShift(shift.id)}
                        disabled={endShift.isPending}
                      >
                        <StopCircle className="w-4 h-4 mr-2" />
                        End Shift
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">No active shifts</p>
              <Button onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Start a Shift
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

