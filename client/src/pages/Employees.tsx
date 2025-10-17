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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { UserPlus, Eye, Download, User, X, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface IdDocument {
  file: File;
  type: string;
  preview: string;
}

export default function Employees() {
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedStationIds, setSelectedStationIds] = useState<string[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<"manager" | "cashier" | "attendant">("cashier");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>("");
  const [idDocuments, setIdDocuments] = useState<IdDocument[]>([]);

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
      
      // Upload ID documents if provided
      if (idDocuments.length > 0 && employeeId) {
        for (const idDoc of idDocuments) {
          await uploadFile(employeeId, idDoc.file, "id", idDoc.type);
        }
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

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddIdDocument = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.pdf";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setIdDocuments([
            ...idDocuments,
            {
              file,
              type: "",
              preview: reader.result as string,
            },
          ]);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleRemoveIdDocument = (index: number) => {
    setIdDocuments(idDocuments.filter((_, i) => i !== index));
  };

  const handleIdTypeChange = (index: number, type: string) => {
    const updated = [...idDocuments];
    updated[index].type = type;
    setIdDocuments(updated);
  };

  const handleStationToggle = (stationId: string) => {
    setSelectedStationIds((prev) =>
      prev.includes(stationId)
        ? prev.filter((id) => id !== stationId)
        : [...prev, stationId]
    );
  };

  const resetForm = () => {
    setSelectedStationIds([]);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhoneNumber("");
    setRole("cashier");
    setProfilePicture(null);
    setProfilePicturePreview("");
    setIdDocuments([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that all ID documents have types
    if (idDocuments.some((doc) => !doc.type)) {
      toast.error("Please select ID type for all documents");
      return;
    }
    
    createEmployeeMutation.mutate({
      gasStationIds: selectedStationIds,
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

  const getStationNames = (stationIds: string[]) => {
    if (!stationIds || stationIds.length === 0) return "-";
    return stationIds
      .map((id) => gasStations?.find((s: any) => s.id === id)?.name)
      .filter(Boolean)
      .join(", ");
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
                <Label>Gas Stations (Select Multiple)</Label>
                <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                  {gasStations && gasStations.length > 0 ? (
                    gasStations.map((station: any) => (
                      <div key={station.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`station-${station.id}`}
                          checked={selectedStationIds.includes(station.id)}
                          onCheckedChange={() => handleStationToggle(station.id)}
                        />
                        <label
                          htmlFor={`station-${station.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {station.name}
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No gas stations available</p>
                  )}
                </div>
                {selectedStationIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedStationIds.map((id) => {
                      const station = gasStations?.find((s: any) => s.id === id);
                      return (
                        <Badge key={id} variant="secondary" className="text-xs">
                          {station?.name}
                        </Badge>
                      );
                    })}
                  </div>
                )}
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
                  <div className="flex items-center gap-4">
                    <Input
                      id="profilePicture"
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="flex-1"
                    />
                    {profilePicturePreview && (
                      <img
                        src={profilePicturePreview}
                        alt="Preview"
                        className="w-16 h-16 rounded-lg object-cover border"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>ID Documents</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddIdDocument}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add ID
                    </Button>
                  </div>
                  
                  {idDocuments.length > 0 && (
                    <div className="space-y-3">
                      {idDocuments.map((doc, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-3 space-y-2"
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative">
                              {doc.preview.startsWith("data:image") ? (
                                <img
                                  src={doc.preview}
                                  alt={`ID ${index + 1}`}
                                  className="w-24 h-24 rounded object-cover border"
                                />
                              ) : (
                                <div className="w-24 h-24 rounded border flex items-center justify-center bg-muted">
                                  <p className="text-xs text-center">PDF</p>
                                </div>
                              )}
                              {doc.type && (
                                <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                  {doc.type}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium truncate">
                                  {doc.file.name}
                                </p>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveIdDocument(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <Select
                                value={doc.type}
                                onValueChange={(value) => handleIdTypeChange(index, value)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select ID type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Driver License">Driver License</SelectItem>
                                  <SelectItem value="Passport">Passport</SelectItem>
                                  <SelectItem value="State ID">State ID</SelectItem>
                                  <SelectItem value="National ID">National ID</SelectItem>
                                  <SelectItem value="Work Permit">Work Permit</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                  <TableHead>Stations</TableHead>
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
                        <AvatarImage src={employee.profilePictureUrl || undefined} alt={`${employee.firstName} ${employee.lastName}`} />
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
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {employee.gasStationIds && employee.gasStationIds.length > 0 ? (
                          employee.gasStationIds.map((stationId: string) => {
                            const station = gasStations?.find((s: any) => s.id === stationId);
                            return station ? (
                              <Badge key={stationId} variant="secondary" className="text-xs">
                                {station.name}
                              </Badge>
                            ) : null;
                          })
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                  <div>
                    <Label className="text-xs text-muted-foreground">Assigned Stations</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedEmployee.gasStationIds && selectedEmployee.gasStationIds.length > 0 ? (
                        selectedEmployee.gasStationIds.map((stationId: string) => {
                          const station = gasStations?.find((s: any) => s.id === stationId);
                          return station ? (
                            <Badge key={stationId} variant="secondary">
                              {station.name}
                            </Badge>
                          ) : null;
                        })
                      ) : (
                        <span className="text-sm text-muted-foreground">No stations assigned</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {selectedEmployee.idDocuments && selectedEmployee.idDocuments.length > 0 && (
                <div className="border-t pt-4 space-y-3">
                  <Label className="text-base font-semibold">ID Documents</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedEmployee.idDocuments.map((doc: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{doc.type}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDownload(
                                doc.url,
                                `${selectedEmployee.firstName}_${selectedEmployee.lastName}_${doc.type}.jpg`
                              )
                            }
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="relative">
                          {doc.url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                            <>
                              <img
                                src={doc.url}
                                alt={doc.type}
                                className="w-full h-48 rounded object-cover border"
                              />
                              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                {doc.type}
                              </div>
                            </>
                          ) : (
                            <div className="h-48 border rounded flex items-center justify-center bg-muted">
                              <div className="text-center">
                                <p className="text-sm font-medium">{doc.type}</p>
                                <p className="text-xs text-muted-foreground mt-1">PDF Document</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show legacy ID document if exists */}
              {selectedEmployee.idDocumentUrl && 
               (!selectedEmployee.idDocuments || selectedEmployee.idDocuments.length === 0) && (
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
                  <div className="relative">
                    {selectedEmployee.idDocumentUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                      <>
                        <img
                          src={selectedEmployee.idDocumentUrl}
                          alt="ID Document"
                          className="w-full max-h-96 rounded-lg object-contain border"
                        />
                        {selectedEmployee.idDocumentType && (
                          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {selectedEmployee.idDocumentType}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-8 border rounded-lg text-center bg-muted">
                        <p className="text-sm text-muted-foreground">
                          PDF document - Click download to view
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

