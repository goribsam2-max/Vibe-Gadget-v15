
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot, updateDoc, collection, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { auth, db, messaging } from './firebase';
import { ToastProvider, useNotify } from './components/Notifications';
import { UserProfile } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { LumaSpin } from './components/ui/luma-spin';

const SEOProvider = () => {
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'seo'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.metaTitle) document.title = data.metaTitle;
        
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.setAttribute('name', 'description');
          document.head.appendChild(metaDesc);
        }
        if (data.metaDescription) metaDesc.setAttribute('content', data.metaDescription);

        let metaKeywords = document.querySelector('meta[name="keywords"]');
        if (!metaKeywords) {
          metaKeywords = document.createElement('meta');
          metaKeywords.setAttribute('name', 'keywords');
          document.head.appendChild(metaKeywords);
        }
        if (data.metaKeywords) metaKeywords.setAttribute('content', data.metaKeywords);

        let metaRobots = document.querySelector('meta[name="robots"]');
        if (!metaRobots) {
          metaRobots = document.createElement('meta');
          metaRobots.setAttribute('name', 'robots');
          document.head.appendChild(metaRobots);
        }
        metaRobots.setAttribute('content', data.robots || 'index, follow');
        
        // --- NEW SEO & BRANDING FIELDS ---
        
        if (data.siteLanguage) document.documentElement.lang = data.siteLanguage;
        
        let metaAuthor = document.querySelector('meta[name="author"]');
        if (!metaAuthor) {
          metaAuthor = document.createElement('meta');
          metaAuthor.setAttribute('name', 'author');
          document.head.appendChild(metaAuthor);
        }
        if (data.siteAuthor) metaAuthor.setAttribute('content', data.siteAuthor);

        let favicon = document.querySelector('link[rel="icon"]');
        if (!favicon) {
          favicon = document.createElement('link');
          favicon.setAttribute('rel', 'icon');
          document.head.appendChild(favicon);
        }
        if (data.faviconUrl) favicon.setAttribute('href', data.faviconUrl);

        let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
        if (!appleIcon) {
          appleIcon = document.createElement('link');
          appleIcon.setAttribute('rel', 'apple-touch-icon');
          document.head.appendChild(appleIcon);
        }
        if (data.appIconUrl) appleIcon.setAttribute('href', data.appIconUrl);
        
        let metaImage = document.querySelector('meta[property="og:image"]');
        if (!metaImage) {
          metaImage = document.createElement('meta');
          metaImage.setAttribute('property', 'og:image');
          document.head.appendChild(metaImage);
        }
        if (data.metaImage) metaImage.setAttribute('content', data.metaImage);
        
        let twitterImage = document.querySelector('meta[name="twitter:image"]');
        if (!twitterImage) {
          twitterImage = document.createElement('meta');
          twitterImage.setAttribute('name', 'twitter:image');
          document.head.appendChild(twitterImage);
        }
        if (data.metaImage) twitterImage.setAttribute('content', data.metaImage);

        let jsonLdScript = document.querySelector('script[type="application/ld+json"]');
        if (!jsonLdScript) {
          jsonLdScript = document.createElement('script');
          jsonLdScript.setAttribute('type', 'application/ld+json');
          document.head.appendChild(jsonLdScript);
        }
        if (data.jsonLd) {
           jsonLdScript.textContent = data.jsonLd;
        } else {
           jsonLdScript.textContent = JSON.stringify([
             {
               "@context": "https://schema.org",
               "@type": "WebSite",
               "name": "VibeGadgets",
               "url": "https://www.vibegadgets.shop",
               "potentialAction": {
                 "@type": "SearchAction",
                 "target": "https://www.vibegadgets.shop/#/search?q={search_term_string}",
                 "query-input": "required name=search_term_string"
               }
             },
             {
               "@context": "https://schema.org",
               "@type": "Organization",
               "name": "VibeGadgets",
               "url": "https://www.vibegadgets.shop",
               "logo": data.appIconUrl || "https://www.vibegadgets.shop/logo.png",
               "contactPoint": {
                 "@type": "ContactPoint",
                 "telephone": "+8801747708843",
                 "contactType": "Customer Service"
               }
             }
           ]);
        }
        
        // Inject Dynamic Manifest for PWA (Add to Home Screen)
        const manifest = {
          short_name: data.metaTitle || "VibeGadget",
          name: data.metaTitle || "VibeGadget Premium Store",
          description: data.metaDescription || "Premium e-commerce store",
          icons: data.appIconUrl ? [
             { src: data.appIconUrl, type: "image/png", sizes: "192x192", purpose: "any maskable" },
             { src: data.appIconUrl, type: "image/png", sizes: "512x512", purpose: "any maskable" }
          ] : [],
          start_url: "/",
          display: "standalone",
          theme_color: "#06331e",
          background_color: "#ffffff"
        };
        const blob = new Blob([JSON.stringify(manifest)], {type: 'application/json'});
        const manifestURL = URL.createObjectURL(blob);
        let manifestLink = document.querySelector('link[rel="manifest"]');
        if (!manifestLink) {
          manifestLink = document.createElement('link');
          manifestLink.setAttribute('rel', 'manifest');
          document.head.appendChild(manifestLink);
        }
        manifestLink.setAttribute('href', manifestURL);
        
        // --- END ---

        if (data.fbPixelId) {
          if (!(window as any).fbq) {
            // @ts-ignore
            !function(f,b,e,v,n,t,s)
            {if((f as any).fbq)return;n=(f as any).fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!(f as any)._fbq)(f as any)._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode?.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            (window as any).fbq('init', data.fbPixelId);
            (window as any).fbq('track', 'PageView');
          }
        }
      }
    });
    return () => unsub();
  }, []);
  
  return null;
};

// Page Imports
import AuthSelector from './pages/AuthSelector';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import ProductReviews from './pages/ProductReviews';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import AffiliatePage from './pages/Affiliate';
import MyOrders from './pages/MyOrders';
import OrderActionPage from './pages/OrderActionPage';
import NotificationsPage from './pages/Notifications';
import Onboarding from './pages/Onboarding';
import VerifyCode from './pages/VerifyCode';
import LocationAccess from './pages/LocationAccess';
import CheckoutPage from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import CompleteProfile from './pages/CompleteProfile';
import EditProfile from './pages/EditProfile';
import NewPassword from './pages/NewPassword';
import ForgotPassword from './pages/ForgotPassword';
import Wishlist from './pages/Wishlist';
import ShippingAddress from './pages/ShippingAddress';
import Coupon from './pages/Coupon';
import PaymentMethods from './pages/PaymentMethods';
import AddCard from './pages/AddCard';
import Search from './pages/Search';
import TrackOrder from './pages/TrackOrder';
import LeaveReview from './pages/LeaveReview';
import EReceipt from './pages/EReceipt';
import Settings from './pages/Settings';
import HelpCenter from './pages/HelpCenter';
import TicketDetails from './pages/TicketDetails';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AboutUs from './pages/AboutUs';
import Terms from './pages/Terms';
import ContactUs from './pages/ContactUs';
import SitemapPage from './pages/SitemapPage';
import PasswordManager from './pages/PasswordManager';
import AllProducts from './pages/AllProducts';
import FlashSale from './pages/FlashSale';
import WithdrawPage from './pages/Withdraw';
import BlogList from './pages/BlogList';
import BlogDetails from './pages/BlogDetails';
import CreateBlog from './pages/CreateBlog';
import NotFound from './pages/NotFound';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import ManageProducts from './pages/admin/ManageProducts';
import ManageUsers from './pages/admin/ManageUsers';
import ManagePushNotifications from './pages/admin/ManagePushNotifications';
import ManageOrders from './pages/admin/ManageOrders';
import ManageReviews from './pages/admin/ManageReviews';
import ManageBanners from './pages/admin/ManageBanners';
import ManageConfig from './pages/admin/ManageConfig';
import ManageCustomSections from './pages/admin/ManageCustomSections';
import ManageSEO from './pages/admin/ManageSEO';
import AdminNotifications from './pages/admin/AdminNotifications';

// Components
import BottomMenu from './components/ui/BottomMenu';
import ScrollToTop from './components/ScrollToTop';
import Logo from './components/Logo';
import DesktopLayout from './components/DesktopLayout';
import AdminLayout from './components/AdminLayout';

import ManageFakeOrders from './pages/admin/ManageFakeOrders';
import Deposit from './pages/Deposit';
import ManageDeposits from './pages/admin/ManageDeposits';
import BonusProducts from './pages/BonusProducts';
import ShoppingCredits from './pages/ShoppingCredits';
import BundleDeals from './pages/BundleDeals';
import MyCoupons from './pages/MyCoupons';
import MyCoins from './pages/MyCoins';
import GenericAdminMock from './pages/admin/GenericAdminMock';
import ManageCoupons from './pages/admin/ManageCoupons';
import ManageHelpDesk from './pages/admin/ManageHelpDesk';
import ManagePromoCodes from './pages/admin/ManagePromoCodes';
import ManageChats from './pages/admin/ManageChats';
import ManageStaff from './pages/admin/ManageStaff';
import ManageStories from './pages/admin/ManageStories';
import ManageWithdrawals from './pages/admin/ManageWithdrawals';
import ManageAffiliateRequests from './pages/admin/ManageAffiliateRequests';
import ManageCreatorRequests from './pages/admin/ManageCreatorRequests';
import ManageAffiliateVideos from './pages/admin/ManageAffiliateVideos';

import ManageRiders from './pages/admin/ManageRiders';

import ErrorBoundary from './components/ErrorBoundary';
import { AccountCenterPopup, SavedAccount } from './components/ui/AccountCenterPopup';

const MigrationHelper = () => {
  useEffect(() => {
    const migrate = async () => {
      if (localStorage.getItem('migrated_coupons_to_promos_v1')) return;
      try {
        const snap = await getDocs(collection(db, 'coupons'));
        if (snap.empty) {
            localStorage.setItem('migrated_coupons_to_promos_v1', 'true');
            return;
        }
        for (const d of snap.docs) {
           await setDoc(doc(db, 'promo_codes', d.id), d.data());
           await deleteDoc(doc(db, 'coupons', d.id));
        }
        localStorage.setItem('migrated_coupons_to_promos_v1', 'true');
      } catch (e) {
          console.error(e);
      }
    };
    migrate();
  }, []);
  return null;
}

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <ErrorBoundary>
      <div className="w-full min-h-screen">
        {children}
      </div>
    </ErrorBoundary>
  );
};

const AppContent: React.FC = () => {
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const notify = useNotify();

  const [isAccountCenterOpen, setIsAccountCenterOpen] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);

  // Listen to openAccountCenter event
  useEffect(() => {
    const handleOpen = () => {
      try {
        const str = localStorage.getItem("vibe_saved_accounts");
        if (str) {
          setSavedAccounts(JSON.parse(str));
        }
      } catch (e) {}
      setIsAccountCenterOpen(true);
    };
    window.addEventListener("openAccountCenter", handleOpen);
    return () => window.removeEventListener("openAccountCenter", handleOpen);
  }, []);

  // Update saved accounts from local storage when it opens or on mount
  useEffect(() => {
    try {
        const str = localStorage.getItem("vibe_saved_accounts");
        if (str) {
            const accounts = JSON.parse(str);
            setSavedAccounts(accounts);
            // If they are visiting index or profile and are NOT logged in, and have saved accounts
            if (accounts.length > 0 && !auth.currentUser && !loading && ['/','/profile'].includes(location.pathname)) {
                 // only auto open if we haven't shown it yet in this session?
                 // wait, user said: user account login na thakleo site aa dukle dynamic vabe popup asbe
                 if (!sessionStorage.getItem("account_center_shown")) {
                     sessionStorage.setItem("account_center_shown", "true");
                     setIsAccountCenterOpen(true);
                 }
            }
        }
    } catch(e) {}
  }, [loading, location.pathname]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search || location.search);
    const ref = searchParams.get('ref');
    if (ref) {
      const existingRef = localStorage.getItem('affiliateRef');
      if (existingRef !== ref.trim()) {
         localStorage.setItem('affiliateRef', ref.trim());
         // Show visual feedback so user knows the code is applied
         setTimeout(() => {
             notify(`Promo Code ${ref.trim()} activated! You'll get 5% OFF at checkout.`, "success");
         }, 1000);
      }
    }
  }, [location.search, notify]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        import('./lib/coinExpiry').then(({ sweepExpiredCoins }) => {
            sweepExpiredCoins(currentUser.uid).catch(e => console.error(e));
        });
        const unsubProfile = onSnapshot(doc(db, 'users', currentUser.uid), async (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data() as UserProfile);
          }
          setLoading(false);
        }, (err) => {
          setUserData(null);
          setLoading(false);
        });
        return () => unsubProfile();
      } else {
        setUserData(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) return (
    <div className="w-full min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Skeleton Navbar */}
      <div className="w-full h-16 md:h-20 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 animate-pulse flex items-center justify-between px-4 lg:px-8">
        <div className="w-32 h-8 bg-zinc-200 dark:bg-zinc-700 rounded-md"></div>
        <div className="hidden md:flex gap-4">
          <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700"></div>
          <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700"></div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 mt-6">
        {/* Skeleton Hero Banner */}
        <div className="w-full aspect-[21/9] max-h-[450px] bg-zinc-200 dark:bg-zinc-800 rounded-3xl animate-pulse mb-8"></div>
        
        {/* Skeleton Categories */}
        <div className="flex gap-4 mb-8 overflow-hidden">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="w-24 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse shrink-0"></div>
          ))}
        </div>

        {/* Skeleton Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6 lg:gap-8">
          {Array(12).fill(0).map((_, i) => (
            <div key={i} className="w-full flex-col gap-2 flex">
              <div className="w-full aspect-square bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse"></div>
              <div className="w-3/4 h-4 bg-zinc-200 dark:bg-zinc-800 rounded mt-2 animate-pulse"></div>
              <div className="w-1/2 h-4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
              <div className="w-2/3 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-full mt-2 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const showNav = ['/', '/profile', '/search', '/notifications', '/orders', '/wishlist'].includes(location.pathname);
  
  // Basic check: we allow access to admin routes if they are an admin or we assume staff will be blocked on specific routes later.
  // Ideally, we'd fetch the document from `staff` collection to see if they are staff.
  const isAdminOrStaff = userData?.role === 'admin' || userData?.email === 'admin@vibe.shop' || userData?.role === 'staff' || ['admin', 'staff'].includes(userData?.role || '');

  return (
    <DesktopLayout>
      <div className="fixed inset-0 pointer-events-none opacity-[0.015] z-[9999] mix-blend-overlay" style={{backgroundImage: 'url("https://upload.wikimedia.org/wikipedia/commons/7/76/1k_Dissolve_Noise_Texture.png")'}}></div>
      <SEOProvider />
      <AccountCenterPopup 
        isOpen={isAccountCenterOpen} 
        onClose={() => setIsAccountCenterOpen(false)} 
        savedAccounts={savedAccounts} 
        currentUid={auth.currentUser?.uid}
      />
      <div className="min-h-screen selection:bg-zinc-900 selection:text-white relative">
        <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrapper><Home userData={userData} /></PageWrapper>} />
          <Route path="/onboarding" element={<PageWrapper><Onboarding onFinish={() => {}} /></PageWrapper>} />
          <Route path="/auth-selector" element={<PageWrapper><AuthSelector /></PageWrapper>} />
          <Route path="/signin" element={<PageWrapper><SignIn /></PageWrapper>} />
          <Route path="/signup" element={<PageWrapper><SignUp /></PageWrapper>} />
          <Route path="/verify" element={<PageWrapper><VerifyCode /></PageWrapper>} />
          <Route path="/complete-profile" element={<PageWrapper><CompleteProfile /></PageWrapper>} />
          <Route path="/location" element={<PageWrapper><LocationAccess /></PageWrapper>} />
          <Route path="/product/:slug/:id" element={<PageWrapper><ProductDetails /></PageWrapper>} />
          <Route path="/product/:id" element={<PageWrapper><ProductDetails /></PageWrapper>} />
          <Route path="/product/:id/reviews" element={<PageWrapper><ProductReviews /></PageWrapper>} />
          <Route path="/cart" element={<PageWrapper><Cart /></PageWrapper>} />
          <Route path="/checkout" element={<PageWrapper><CheckoutPage /></PageWrapper>} />
          <Route path="/deposit" element={<PageWrapper><Deposit /></PageWrapper>} />
          <Route path="/my-coupons" element={<PageWrapper><MyCoupons /></PageWrapper>} />
          <Route path="/my-coins" element={<PageWrapper><MyCoins /></PageWrapper>} />
          <Route path="/bonus" element={<PageWrapper><BonusProducts /></PageWrapper>} />
          <Route path="/credits" element={<PageWrapper><ShoppingCredits /></PageWrapper>} />
          <Route path="/bundles" element={<PageWrapper><BundleDeals /></PageWrapper>} />
          <Route path="/success" element={<PageWrapper><OrderSuccess /></PageWrapper>} />
          <Route path="/profile" element={<PageWrapper><Profile userData={userData} /></PageWrapper>} />
          <Route path="/affiliate" element={<PageWrapper><AffiliatePage /></PageWrapper>} />
          <Route path="/withdraw" element={<PageWrapper><WithdrawPage userData={userData} /></PageWrapper>} />
          <Route path="/profile/edit" element={<PageWrapper><EditProfile /></PageWrapper>} />
          <Route path="/orders" element={<PageWrapper><MyOrders /></PageWrapper>} />
          <Route path="/orders/:actionName" element={<PageWrapper><OrderActionPage /></PageWrapper>} />
          <Route path="/notifications" element={<PageWrapper><NotificationsPage /></PageWrapper>} />
          <Route path="/wishlist" element={<PageWrapper><Wishlist /></PageWrapper>} />
          <Route path="/search" element={<PageWrapper><Search /></PageWrapper>} />
          <Route path="/all-products" element={<PageWrapper><AllProducts /></PageWrapper>} />
          <Route path="/flash-sale" element={<PageWrapper><FlashSale /></PageWrapper>} />
          <Route path="/blog" element={<PageWrapper><BlogList /></PageWrapper>} />
          <Route path="/blog/create" element={<PageWrapper><CreateBlog /></PageWrapper>} />
          <Route path="/blog/edit/:slug" element={<PageWrapper><CreateBlog /></PageWrapper>} />
          <Route path="/blog/:slug" element={<PageWrapper><BlogDetails /></PageWrapper>} />
          <Route path="/track-order/:id" element={<PageWrapper><TrackOrder /></PageWrapper>} />
          <Route path="/e-receipt/:id" element={<PageWrapper><EReceipt /></PageWrapper>} />
          <Route path="/leave-review" element={<PageWrapper><LeaveReview /></PageWrapper>} />
          <Route path="/settings" element={<PageWrapper><Settings /></PageWrapper>} />
          <Route path="/settings/password" element={<PageWrapper><PasswordManager /></PageWrapper>} />
          <Route path="/help-center" element={<PageWrapper><HelpCenter /></PageWrapper>} />
          <Route path="/ticket/:id" element={<PageWrapper><TicketDetails /></PageWrapper>} />
          <Route path="/privacy" element={<PageWrapper><PrivacyPolicy /></PageWrapper>} />
          <Route path="/about" element={<PageWrapper><AboutUs /></PageWrapper>} />
          <Route path="/terms" element={<PageWrapper><Terms /></PageWrapper>} />
          <Route path="/contact" element={<PageWrapper><ContactUs /></PageWrapper>} />
          <Route path="/sitemap-page" element={<PageWrapper><SitemapPage /></PageWrapper>} />
          <Route path="/shipping-address" element={<PageWrapper><ShippingAddress /></PageWrapper>} />
          <Route path="/payment-methods" element={<PageWrapper><PaymentMethods /></PageWrapper>} />
          <Route path="/coupon" element={<PageWrapper><Coupon /></PageWrapper>} />
          <Route path="/add-card" element={<PageWrapper><AddCard /></PageWrapper>} />
          <Route path="/new-password" element={<PageWrapper><NewPassword /></PageWrapper>} />
          <Route path="/forgot-password" element={<PageWrapper><ForgotPassword /></PageWrapper>} />
          <Route path="/__/auth/action" element={<PageWrapper><NewPassword /></PageWrapper>} />
          <Route path="/auth/action" element={<PageWrapper><NewPassword /></PageWrapper>} />
          
          <Route path="/admin/*" element={isAdminOrStaff ? (
             <Routes>
                <Route element={<AdminLayout userData={userData} />}>
                  <Route index element={<PageWrapper><AdminDashboard /></PageWrapper>} />
                  <Route path="products" element={<PageWrapper><ManageProducts /></PageWrapper>} />
                  <Route path="users" element={<PageWrapper><ManageUsers /></PageWrapper>} />
                  <Route path="push-notifications" element={<PageWrapper><ManagePushNotifications /></PageWrapper>} />
                  <Route path="orders" element={<PageWrapper><ManageOrders /></PageWrapper>} />
                  <Route path="reviews" element={<PageWrapper><ManageReviews /></PageWrapper>} />
                  <Route path="fake-orders" element={<PageWrapper><ManageFakeOrders /></PageWrapper>} />
                  <Route path="deposits" element={<PageWrapper><ManageDeposits /></PageWrapper>} />
                  <Route path="notifications" element={<PageWrapper><AdminNotifications /></PageWrapper>} />
                  <Route path="banners" element={<PageWrapper><ManageBanners /></PageWrapper>} />
                  <Route path="config" element={<PageWrapper><ManageConfig /></PageWrapper>} />
                  <Route path="custom-sections" element={<PageWrapper><ManageCustomSections /></PageWrapper>} />
                  <Route path="stories" element={<PageWrapper><ManageStories /></PageWrapper>} />
                  <Route path="seo" element={<PageWrapper><ManageSEO /></PageWrapper>} />
                  <Route path="coupons" element={<PageWrapper><ManageCoupons /></PageWrapper>} />
                  <Route path="promo-codes" element={<PageWrapper><ManagePromoCodes /></PageWrapper>} />
                  <Route path="chats" element={<PageWrapper><ManageChats /></PageWrapper>} />
                  <Route path="helpdesk" element={<PageWrapper><ManageHelpDesk /></PageWrapper>} />
                  <Route path="staff" element={<PageWrapper><ManageStaff /></PageWrapper>} />
                  <Route path="riders" element={<PageWrapper><ManageRiders /></PageWrapper>} />
                  <Route path="withdrawals" element={<PageWrapper><ManageWithdrawals /></PageWrapper>} />
                  <Route path="affiliate-requests" element={<PageWrapper><ManageAffiliateRequests /></PageWrapper>} />
                  <Route path="creator-requests" element={<PageWrapper><ManageCreatorRequests /></PageWrapper>} />
                  <Route path="affiliate-videos" element={<PageWrapper><ManageAffiliateVideos /></PageWrapper>} />
                  <Route path="mock/*" element={<PageWrapper><GenericAdminMock /></PageWrapper>} />
                </Route>
             </Routes>
          ) : <Navigate to="/" replace />} />
          <Route path="/:slug" element={<PageWrapper><ProductDetails /></PageWrapper>} />
          <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
        </Routes>
      {showNav && <BottomMenu />}
    </div>
    </DesktopLayout>
  );
};

import { ThemeProvider } from './components/ThemeContext';
import { MobileGuard } from './components/MobileGuard';
// import { NotificationPermissionModal } from './components/ui/NotificationPermissionModal';

import { FloatingChat } from './components/FloatingChat';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <MigrationHelper />
        <Router>
          <AppContent />
          {/* <NotificationPermissionModal /> */}
          <FloatingChat />
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
