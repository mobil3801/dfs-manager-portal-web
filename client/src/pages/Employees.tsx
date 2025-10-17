import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserPlus, Eye, Download, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Employees() {
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [gasStationId, setGasStationId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<"manager" | "cashier" | "attendant">("cashier");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [idType, setIdType] = useState("");

  const { data: employees, isLoading } = trpc.employees.list.useQuery();
  const { data: gasStations } = trpc.gasStations.list.useQuery();
  const utils = trpc.useUtils();

  const createEmployeeMutation = trpc.employees.create.useMutation({
    onSuccess: async (data) => {
      const employeeId = (data as any).insertId || (data as any)[0]?.insertId;
      
      // Upload profile picture if provided
      if (profilePicture && employeeId) {
        await uploadFile(employeeId, profilePicture, "profile");
      }
      
      // Upload ID document if provided
      if (idDocument && employeeId) {
        await uploadFile(employeeId, idDocument, "id", idType);
      }
      
      toast.success("Employee added successfully!");
      utils.employees.list.invalidate();
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add employee");
    },
  });

  const uploadMutation = trpc.upload.uploadEmployeeDocument.useMutation();

  const uploadFile = async (
    employeeId: string,
    file: File,
    documentType: "profile" | "id",
    idDocType?: string
  ) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(",")[1];
          await uploadMutation.mutateAsync({
            employeeId,
            fileData: base64,
            fileName: file.name,
            fileType: file.type,
            documentType,
            ...(idDocType && { idType: idDocType }),
          });
          resolve(true);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const resetForm = () => {
    setGasStationId("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhoneNumber("");
    setRole("cashier");
    setProfilePicture(null);
    setIdDocument(null);
    setIdType("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEmployeeMutation.mutate({
      gasStationId: gasStationId || undefined,
      firstName,
      lastName,
      email: email || undefined,
      phoneNumber: phoneNumber || undefined,
      role,
    });
  };

  const handleViewEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setViewOpen(true);
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Download started");
    } catch (error) {
      toast.error("Failed to download file");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground mt-1">Manage your gas station employees</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>Enter employee details and upload documents</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  placeholder="(555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gasStation">Gas Station</Label>
                <Select value={gasStationId} onValueChange={setGasStationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a gas station" />
                  </SelectTrigger>
                  <SelectContent>
                    {gasStations?.map((station: any) => (
                      <SelectItem key={station.id} value={station.id}>
                        {station.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={role} onValueChange={(value: any) => setRole(value)}>
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

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold">Documents</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="profilePicture">Profile Picture</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="profilePicture"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
                    />
                    {profilePicture && (
                      <Badge variant="secondary">{profilePicture.name}</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idDocument">ID Document</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="idDocument"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setIdDocument(e.target.files?.[0] || null)}
                    />
                    {idDocument && <Badge variant="secondary">{idDocument.name}</Badge>}
                  </div>
                </div>

                {idDocument && (
                  <div className="space-y-2">
                    <Label htmlFor="idType">ID Type</Label>
                    <Select value={idType} onValueChange={setIdType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Driver License">Driver License</SelectItem>
                        <SelectItem value="Passport">Passport</SelectItem>
                        <SelectItem value="National ID">National ID</SelectItem>
                        <SelectItem value="State ID">State ID</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createEmployeeMutation.isPending}>
                  {createEmployeeMutation.isPending ? "Adding..." : "Add Employee"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Loading employees...</p>
          </CardContent>
        </Card>
      ) : employees && employees.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Employee List</CardTitle>
            <CardDescription>View and manage all employees</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profile</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee: any) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <Avatar>
                        <AvatarImage src={employee.profilePictureUrl || undefined} />
                        <AvatarFallback>
                          {employee.firstName[0]}
                          {employee.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                      {employee.firstName} {employee.lastName}
                    </TableCell>
                    <TableCell>{employee.email || "-"}</TableCell>
                    <TableCell>{employee.phoneNumber || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{employee.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={employee.isActive ? "default" : "secondary"}>
                        {employee.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewEmployee(employee)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No employees added yet</p>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first employee
            </p>
            <Button onClick={() => setOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Your First Employee
            </Button>
          </CardContent>
        </Card>
      )}

      {/* View Employee Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-6">
              <div className="flex items-start gap-6">
                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  {selectedEmployee.profilePictureUrl ? (
                    <div className="space-y-2">
                      <img
                        src={selectedEmployee.profilePictureUrl}
                        alt="Profile"
                        className="w-32 h-32 rounded-lg object-cover border"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDownload(
                            selectedEmployee.profilePictureUrl,
                            `${selectedEmployee.firstName}_${selectedEmployee.lastName}_profile.jpg`
                          )
                        }
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-lg border flex items-center justify-center bg-muted">
                      <User className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <p className="font-medium">
                      {selectedEmployee.firstName} {selectedEmployee.lastName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p>{selectedEmployee.email || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Phone</Label>
                    <p>{selectedEmployee.phoneNumber || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Role</Label>
                    <p>
                      <Badge variant="outline">{selectedEmployee.role}</Badge>
                    </p>
                  </div>
                </div>
              </div>

              {selectedEmployee.idDocumentUrl && (
                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>ID Document</Label>
                      {selectedEmployee.idDocumentType && (
                        <p className="text-sm text-muted-foreground">
                          Type: {selectedEmployee.idDocumentType}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleDownload(
                          selectedEmployee.idDocumentUrl,
                          `${selectedEmployee.firstName}_${selectedEmployee.lastName}_id.pdf`
                        )
                      }
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  {selectedEmployee.idDocumentUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <img
                      src={selectedEmployee.idDocumentUrl}
                      alt="ID Document"
                      className="w-full max-h-96 rounded-lg object-contain border"
                    />
                  ) : (
                    <div className="p-8 border rounded-lg text-center bg-muted">
                      <p className="text-sm text-muted-foreground">
                        PDF document - Click download to view
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

