import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Fuel, Plus } from "lucide-react";
import { toast } from "sonner";

export default function FuelDeliveries() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    gasStationId: "",
    fuelType: "",
    quantity: "",
    pricePerGallon: "",
    supplier: "",
    billOfLading: "",
    deliveryDate: new Date().toISOString().split("T")[0],
  });

  const utils = trpc.useUtils();
  const { data: stations } = trpc.gasStations.list.useQuery();

  const createDelivery = trpc.fuelDeliveries.create.useMutation({
    onSuccess: () => {
      setOpen(false);
      setFormData({
        gasStationId: "",
        fuelType: "",
        quantity: "",
        pricePerGallon: "",
        supplier: "",
        billOfLading: "",
        deliveryDate: new Date().toISOString().split("T")[0],
      });
      toast.success("Fuel delivery logged successfully!");
      utils.fuelDeliveries.byStation.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to log fuel delivery: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createDelivery.mutate({
      ...formData,
      quantity: parseFloat(formData.quantity),
      pricePerGallon: parseFloat(formData.pricePerGallon),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fuel Deliveries</h1>
          <p className="mt-2 text-gray-600">Log and track fuel deliveries with Bill of Lading</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Log Delivery
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Log Fuel Delivery</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gasStation">Gas Station</Label>
                  <Select
                    value={formData.gasStationId}
                    onValueChange={(value) => setFormData({ ...formData, gasStationId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select station" />
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
                  <Label htmlFor="deliveryDate">Delivery Date</Label>
                  <Input
                    id="deliveryDate"
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fuelType">Fuel Type</Label>
                  <Select
                    value={formData.fuelType}
                    onValueChange={(value) => setFormData({ ...formData, fuelType: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Regular">Regular</SelectItem>
                      <SelectItem value="Plus">Plus</SelectItem>
                      <SelectItem value="Premium">Premium</SelectItem>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity (Gallons)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pricePerGallon">Price per Gallon ($)</Label>
                  <Input
                    id="pricePerGallon"
                    type="number"
                    step="0.001"
                    value={formData.pricePerGallon}
                    onChange={(e) => setFormData({ ...formData, pricePerGallon: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="billOfLading">Bill of Lading Number (Optional)</Label>
                <Input
                  id="billOfLading"
                  value={formData.billOfLading}
                  onChange={(e) => setFormData({ ...formData, billOfLading: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createDelivery.isPending}>
                  {createDelivery.isPending ? "Logging..." : "Log Delivery"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Deliveries List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Fuel className="w-5 h-5 mr-2 text-yellow-600" />
            Recent Fuel Deliveries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Fuel deliveries will appear here with Bill of Lading details, fuel type, quantities, and pricing.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

