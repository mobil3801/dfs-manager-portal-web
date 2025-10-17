import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Mail, Phone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function Employees() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    gasStationId: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    role: "cashier" as "manager" | "cashier" | "attendant",
  });

  const utils = trpc.useUtils();
  const { data: employees, isLoading: employeesLoading } = trpc.employees.list.useQuery();
  const { data: stations, isLoading: stationsLoading } = trpc.gasStations.list.useQuery();
  
  const createEmployee = trpc.employees.create.useMutation({
    onSuccess: () => {
      utils.employees.list.invalidate();
      setOpen(false);
      setFormData({
        gasStationId: "",
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        role: "cashier",
      });
      toast.success("Employee added successfully!");
    },
    onError: (error) => {
      toast.error("Failed to add employee: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEmployee.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
          <p className="mt-2 text-gray-600">Manage your gas station employees</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="attendant">Attendant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createEmployee.isPending}>
                  {createEmployee.isPending ? "Adding..." : "Add Employee"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Employees List */}
      {employeesLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : employees && employees.length > 0 ? (
        <div className="space-y-4">
          {employees.map((employee) => {
            const station = stations?.find((s) => s.id === employee.gasStationId);
            return (
              <Card key={employee.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <Users className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {employee.firstName} {employee.lastName}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span className="capitalize">{employee.role}</span>
                          {station && <span>• {station.name}</span>}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          {employee.email && (
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 mr-1" />
                              {employee.email}
                            </div>
                          )}
                          {employee.phoneNumber && (
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-1" />
                              {employee.phoneNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full ${
                        employee.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {employee.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">No employees added yet</p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Employee
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

