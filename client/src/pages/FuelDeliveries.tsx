import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Fuel, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type FuelItem = {
  fuelGrade: "regular" | "plus" | "premium" | "diesel";
  quantity: string;
  pricePerGallon: string;
  yellowMark: string;
  redMark: string;
};

export default function FuelDeliveries() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    gasStationId: "",
    billOfLadingNumber: "",
    deliveryDate: new Date().toISOString().split("T")[0],
    supplier: "",
  });
  const [fuelItems, setFuelItems] = useState<FuelItem[]>([
    { fuelGrade: "regular", quantity: "", pricePerGallon: "", yellowMark: "", redMark: "" },
  ]);

  const utils = trpc.useUtils();
  const { data: stations } = trpc.gasStations.list.useQuery();

  const createDelivery = trpc.fuelDeliveries.create.useMutation({
    onSuccess: () => {
      setOpen(false);
      setFormData({
        gasStationId: "",
        billOfLadingNumber: "",
        deliveryDate: new Date().toISOString().split("T")[0],
        supplier: "",
      });
      setFuelItems([
        { fuelGrade: "regular", quantity: "", pricePerGallon: "", yellowMark: "", redMark: "" },
      ]);
      toast.success("Fuel delivery logged successfully!");
    },
    onError: (error) => {
      toast.error("Failed to log fuel delivery: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const items = fuelItems.map((item) => ({
      fuelGrade: item.fuelGrade,
      quantity: parseInt(item.quantity),
      pricePerGallon: Math.round(parseFloat(item.pricePerGallon) * 100), // Convert to cents
      yellowMark: item.yellowMark || undefined,
      redMark: item.redMark || undefined,
    }));

    createDelivery.mutate({
      ...formData,
      items,
    });
  };

  const addFuelItem = () => {
    setFuelItems([
      ...fuelItems,
      { fuelGrade: "regular", quantity: "", pricePerGallon: "", yellowMark: "", redMark: "" },
    ]);
  };

  const removeFuelItem = (index: number) => {
    setFuelItems(fuelItems.filter((_, i) => i !== index));
  };

  const updateFuelItem = (index: number, field: keyof FuelItem, value: string) => {
    const updated = [...fuelItems];
    updated[index] = { ...updated[index], [field]: value };
    setFuelItems(updated);
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Log Fuel Delivery</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="billOfLadingNumber">Bill of Lading Number</Label>
                  <Input
                    id="billOfLadingNumber"
                    value={formData.billOfLadingNumber}
                    onChange={(e) => setFormData({ ...formData, billOfLadingNumber: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="supplier">Supplier (Optional)</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">Fuel Items</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addFuelItem}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Fuel Grade
                  </Button>
                </div>

                <div className="space-y-4">
                  {fuelItems.map((item, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Fuel Item {index + 1}</h4>
                        {fuelItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFuelItem(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Fuel Grade</Label>
                          <Select
                            value={item.fuelGrade}
                            onValueChange={(value: any) => updateFuelItem(index, "fuelGrade", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="regular">Regular</SelectItem>
                              <SelectItem value="plus">Plus</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                              <SelectItem value="diesel">Diesel</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Quantity (Gallons)</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateFuelItem(index, "quantity", e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label>Price per Gallon ($)</Label>
                          <Input
                            type="number"
                            step="0.001"
                            value={item.pricePerGallon}
                            onChange={(e) => updateFuelItem(index, "pricePerGallon", e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label>Yellow Mark</Label>
                          <Input
                            value={item.yellowMark}
                            onChange={(e) => updateFuelItem(index, "yellowMark", e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Red Mark</Label>
                          <Input
                            value={item.redMark}
                            onChange={(e) => updateFuelItem(index, "redMark", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
            Fuel deliveries will appear here. Each delivery includes Bill of Lading details, fuel grades, quantities, and pricing.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

