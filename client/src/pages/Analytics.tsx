import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, TrendingDown, BarChart3 } from "lucide-react";

export default function Analytics() {
  const [selectedStation, setSelectedStation] = useState("");
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: stations } = trpc.gasStations.list.useQuery();

  const { data: revenueData, isLoading: revenueLoading } = trpc.analytics.revenue.useQuery(
    {
      gasStationId: selectedStation,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
    { enabled: !!selectedStation }
  );

  const { data: profitData, isLoading: profitLoading } = trpc.analytics.profit.useQuery(
    {
      gasStationId: selectedStation,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
    { enabled: !!selectedStation }
  );

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-2 text-gray-600">Track revenue, expenses, and profitability</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="station">Gas Station</Label>
              <Select value={selectedStation} onValueChange={setSelectedStation}>
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
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Cards */}
      {selectedStation ? (
        <>
          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Revenue
                </CardTitle>
                <DollarSign className="w-5 h-5 text-green-600" />
              </CardHeader>
              <CardContent>
                {revenueLoading ? (
                  <div className="text-2xl font-bold text-gray-400">Loading...</div>
                ) : (
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(revenueData?.totalRevenue || 0)}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Fuel Revenue
                </CardTitle>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                {revenueLoading ? (
                  <div className="text-2xl font-bold text-gray-400">Loading...</div>
                ) : (
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(revenueData?.fuelRevenue || 0)}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Grocery Revenue
                </CardTitle>
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                {revenueLoading ? (
                  <div className="text-2xl font-bold text-gray-400">Loading...</div>
                ) : (
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(revenueData?.groceryRevenue || 0)}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Profit Analysis */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Expenses
                </CardTitle>
                <TrendingDown className="w-5 h-5 text-red-600" />
              </CardHeader>
              <CardContent>
                {profitLoading ? (
                  <div className="text-2xl font-bold text-gray-400">Loading...</div>
                ) : (
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(profitData?.expenses || 0)}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Net Profit
                </CardTitle>
                <DollarSign className="w-5 h-5 text-green-600" />
              </CardHeader>
              <CardContent>
                {profitLoading ? (
                  <div className="text-2xl font-bold text-gray-400">Loading...</div>
                ) : (
                  <div className={`text-2xl font-bold ${(profitData?.profit || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(profitData?.profit || 0)}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Profit Margin
                </CardTitle>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                {profitLoading ? (
                  <div className="text-2xl font-bold text-gray-400">Loading...</div>
                ) : (
                  <div className="text-2xl font-bold text-gray-900">
                    {profitData?.revenue && profitData.revenue > 0
                      ? ((profitData.profit / profitData.revenue) * 100).toFixed(2)
                      : "0.00"}
                    %
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">Total Revenue</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(profitData?.revenue || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">Total Expenses</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(profitData?.expenses || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-semibold text-gray-900">Net Profit</span>
                  <span className={`text-lg font-bold ${(profitData?.profit || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(profitData?.profit || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600">Select a gas station to view analytics</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

