import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import GasStations from "./pages/GasStations";
import Employees from "./pages/Employees";
import Shifts from "./pages/Shifts";
import ShiftReports from "./pages/ShiftReports";
import Expenses from "./pages/Expenses";
import FuelDeliveries from "./pages/FuelDeliveries";
import Analytics from "./pages/Analytics";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/stations" component={GasStations} />
        <Route path="/employees" component={Employees} />
        <Route path="/shifts" component={Shifts} />
        <Route path="/reports" component={ShiftReports} />
        <Route path="/expenses" component={Expenses} />
        <Route path="/fuel-deliveries" component={FuelDeliveries} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
