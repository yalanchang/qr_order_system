import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
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
  const [location] = useLocation();

  let Content: React.ComponentType = KitchenPage;
  if (location === "/admin/menu") Content = MenuManagement;
  else if (location === "/admin/qr") Content = QRCodesPage;
  else if (location !== "/admin" && !location.startsWith("/admin")) Content = NotFound;

  return (
    <AdminLayout>
      <Content />
    </AdminLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/order" component={OrderPage} />
      <Route path="/admin" component={AdminRouter} />
      <Route path="/admin/menu" component={AdminRouter} />
      <Route path="/admin/qr" component={AdminRouter} />
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
