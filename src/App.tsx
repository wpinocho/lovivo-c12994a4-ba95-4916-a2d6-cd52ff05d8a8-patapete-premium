import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { trackPageView } from "@/lib/tracking-utils";
import { useURLCartLoader } from "@/hooks/useURLCartLoader";
import { CartProvider } from "@/contexts/CartContext";
import { CartUIProvider } from "@/components/CartProvider";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { PixelProvider } from "@/contexts/PixelContext";
import { PostHogProvider } from "@/contexts/PostHogContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
// ThankYou is imported statically — it's a critical post-purchase page
// and must never fail due to stale lazy-loaded chunks after a new deploy
import ThankYou from "./pages/ThankYou";

// Helper: on chunk load failure (stale deploy), reload the page once
const lazyWithReload = (importFn: () => Promise<any>) =>
  lazy(() =>
    importFn().catch(() => {
      if (!sessionStorage.getItem("chunk_reload")) {
        sessionStorage.setItem("chunk_reload", "1");
        window.location.reload();
      }
      return { default: () => null };
    })
  );

const Product = lazyWithReload(() => import('./pages/Product'));
const Blog = lazyWithReload(() => import('./pages/Blog'));
const BlogPost = lazyWithReload(() => import('./pages/BlogPost'));
const Checkout = lazyWithReload(() => import('./pages/Checkout'));
const Cart = lazyWithReload(() => import('./pages/Cart'));
const MyOrders = lazyWithReload(() => import('./pages/MyOrders'));
const Bundle = lazyWithReload(() => import('./pages/Bundle'));
const MySubscriptions = lazyWithReload(() => import('./pages/MySubscriptions'));

const queryClient = new QueryClient();

// Component to track page views on route changes AND scroll to top
function PageViewTracker() {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
    trackPageView();
  }, [location.pathname]);
  
  return null;
}

/** Loads cart from URL params (?items=...) on any page */
function URLCartLoader() {
  useURLCartLoader();
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SettingsProvider>
      <PixelProvider>
        <PostHogProvider>
          <AuthProvider>
            <CartProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <CartUIProvider>
                    <PageViewTracker />
                    <URLCartLoader />
                    <Suspense fallback={<div className="min-h-screen" />}>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/productos/:slug" element={<Product />} />
                        <Route path="/paquete/:slug" element={<Bundle />} />
                        <Route path="/carrito" element={<Cart />} />
                        <Route path="/pagar" element={<Checkout />} />
                        <Route path="/gracias" element={<ThankYou />} />
                        <Route path="/gracias/:orderId" element={<ThankYou />} />
                        <Route path="/mis-pedidos" element={<MyOrders />} />
                        <Route path="/mis-suscripciones" element={<MySubscriptions />} />
                        <Route path="/blog" element={<Blog />} />
                        <Route path="/blog/:slug" element={<BlogPost />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </CartUIProvider>
                </BrowserRouter>
              </TooltipProvider>
            </CartProvider>
          </AuthProvider>
        </PostHogProvider>
      </PixelProvider>
    </SettingsProvider>
  </QueryClientProvider>
);

export default App;