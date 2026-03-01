import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Provider } from "react-redux";
import { store } from "./store";
import Home from "./pages/Home";
import OrderPage from "./pages/Order";
import AdminLayout from "./pages/admin/AdminLayout";
import KitchenPage from "./pages/admin/Kitchen";
import MenuManagement from "./pages/admin/MenuManagement";
import QRCodesPage from "./pages/admin/QRCodes";

function AdminRouter() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={KitchenPage} />
        <Route path="/admin/menu" component={MenuManagement} />
        <Route path="/admin/qr" component={QRCodesPage} />
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/order" component={OrderPage} />
      <Route path="/admin" component={AdminRouter} />
      <Route path="/admin/:rest*" component={AdminRouter} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster richColors position="top-center" />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
