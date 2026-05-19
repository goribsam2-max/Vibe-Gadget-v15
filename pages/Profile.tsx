import React, { useState, useEffect } from "react";
import { UserProfile, Order, OrderStatus } from "../types";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase";
import { signOut, updateProfile } from "firebase/auth";
import { doc, updateDoc, collection, query, where, getDocs, orderBy, onSnapshot } from "firebase/firestore";
import { useNotify } from "../components/Notifications";
import { uploadToImgbb } from "../services/imgbb";
import { cn } from "../lib/utils";
import { AvatarUploader } from "../components/ui/avatar-uploader";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import Icon from "../components/Icon";
import { motion } from "framer-motion";
import { Settings, UserPlus, Star, Shield, ShoppingBag, FileText, Heart, Headphones, Lock, Info, Mail, LogOut, ShieldCheck, ChevronRight, Wallet, TrendingUp, Diamond, Gift, CreditCard, Truck, Package, MessageSquareShare, Clock, Ticket, Store, CircleDollarSign, Sparkles } from "lucide-react";
import { useTheme } from "../components/ThemeContext";
import { TourProvider, TourAlertDialog, useTour } from "@/components/ui/tour";
import { ProductCard } from "../components/ui/ProductCard";

const ProfileTourSteps = () => {
    const { setSteps } = useTour();
    useEffect(() => {
        setSteps([
            {
                selectorId: "profile-info",
                content: (
                    <div className="space-y-2">
                        <h3 className="font-bold text-lg">Your Profile</h3>
                        <p className="text-sm text-zinc-500">Quickly see your saved items and total order counts.</p>
                    </div>
                ),
                position: "bottom"
            },
            {
                selectorId: "profile-member",
                content: (
                    <div className="space-y-2">
                        <h3 className="font-bold text-lg">Member Status</h3>
                        <p className="text-sm text-zinc-500">Check your current membership tier for exclusive benefits.</p>
                    </div>
                ),
                position: "bottom"
            },
            {
                selectorId: "profile-referral",
                content: (
                    <div className="space-y-2">
                        <h3 className="font-bold text-lg">Refer & Earn</h3>
                        <p className="text-sm text-zinc-500">Share with friends to earn real money! Click here to open your dashboard.</p>
                    </div>
                ),
                position: "top"
            },
            {
                selectorId: "profile-menu",
                content: (
                    <div className="space-y-2">
                        <h3 className="font-bold text-lg">Settings & More</h3>
                        <p className="text-sm text-zinc-500">Access your past orders, wishlist, addresses and app settings here.</p>
                    </div>
                ),
                position: "top"
            }
        ]);
    }, [setSteps]);
    return null;
};

const Profile: React.FC<{ userData: UserProfile | null }> = ({
  userData: initialUserData,
}) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const notify = useNotify();
  const [updating, setUpdating] = useState(false);
  const [localUserData, setLocalUserData] = useState<UserProfile | null>(
    initialUserData,
  );
  const [orderCount, setOrderCount] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [activeBanner, setActiveBanner] = useState(0);

  useEffect(() => {
    setLocalUserData(initialUserData);
  }, [initialUserData]);

  useEffect(() => {
    const qBanners = query(collection(db, "banners"), orderBy("createdAt", "desc"));
    const unsubscribeBanners = onSnapshot(qBanners, (snapshot) => {
        setBanners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribeBanners();
  }, []);

  useEffect(() => {
    let heroBanners = [];
    if (banners && banners.length > 0) {
      heroBanners = banners.filter(b => b.bannerType === "profile");
    }
    if (heroBanners.length > 1) {
      const interval = setInterval(
        () => setActiveBanner((prev) => (prev + 1) % heroBanners.length),
        4000
      );
      return () => clearInterval(interval);
    }
  }, [banners]);

  useEffect(() => {
    const fetchOrders = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const q = query(collection(db, "orders"), where("userId", "==", user.uid));
          const querySnapshot = await getDocs(q);
          const userOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
          setOrders(userOrders);
          setOrderCount(userOrders.length);
        } catch (error) {
          console.error("Error fetching orders:", error);
        }
      }
    };
    fetchOrders();
  }, [auth.currentUser]);

  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const q = query(collection(db, "products"));
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        // Shuffle or just pick a few for recommendations
        const shuffled = docs.sort(() => 0.5 - Math.random());
        setRecommendedProducts(shuffled.slice(0, 6));
      } catch (error) {
        console.error("Error fetching recommended products:", error);
      }
    };
    fetchRecommended();
  }, []);

  const handleAvatarUpload = async (file: File) => {
    if (!auth.currentUser) return { success: false };
    
    setUpdating(true);
    try {
      const url = await uploadToImgbb(file);
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        photoURL: url
      });
      await updateProfile(auth.currentUser, {
        photoURL: url
      });
      setLocalUserData((prev) => prev ? { ...prev, photoURL: url } : null);
      notify("Profile picture updated", "success");
      return { success: true };
    } catch (e: any) {
      notify(e.message || "Failed to update profile picture", "error");
      return { success: false };
    } finally {
      setUpdating(false);
    }
  };

  if (!localUserData) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-40 animate-fade-in bg-zinc-50 dark:bg-[#000000] min-h-screen">
          <div className="w-24 h-24 bg-white dark:bg-zinc-900 rounded-[15px] flex items-center justify-center mb-6 border border-zinc-200 dark:border-zinc-800">
            <Icon
              name="user"
              className="text-2xl text-zinc-400 dark:text-zinc-500"
            />
          </div>
          <h2 className="text-xl font-semibold mb-2 tracking-tight text-zinc-900 dark:text-zinc-100">
            Sign In to Continue
          </h2>
          <p className="text-sm font-medium text-zinc-500 mb-10 max-w-xs leading-relaxed">
            Log in to view your profile, track orders, and manage wishlist.
          </p>
          <button
            onClick={() => navigate("/auth-selector")}
            className="px-8 py-4 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 rounded-[15px] font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center space-x-3"
          >
            <span>Sign In</span>
            <Icon name="arrow-right" className="text-xs" />
          </button>
        </div>
    );
  }

  const isAdmin =
    localUserData?.role === "admin" ||
    localUserData?.email?.toLowerCase().trim() === "admin@vibe.shop" ||
    localUserData?.role === "staff";

  const [showTour, setShowTour] = useState(true);

  return (
    <TourProvider tourId="profile">
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-zinc-950 font-sans">
      <ProfileTourSteps />
      <TourAlertDialog isOpen={showTour} setIsOpen={setShowTour} />
      {/* Top Header Area (Teal) */}
      <div className="relative bg-[#109E92] px-6 pt-12 pb-32 rounded-b-[40px] shadow-sm">
         <div className="flex justify-end items-center relative z-20">
            <button onClick={() => navigate('/settings')} className="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl flex items-center justify-center shadow-sm transition-colors">
                <Settings className="w-5 h-5 text-white" />
            </button>
         </div>
      </div>

      {/* Main Content Card overlapping the header */}
      <div className="px-5 -mt-20 relative z-30 max-w-lg lg:max-w-6xl mx-auto flex flex-col lg:grid lg:grid-cols-12 gap-5 lg:gap-8">
          
          <div className="lg:col-span-5 space-y-5">
              <div id="profile-info" className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 shadow-sm">
                  <div className="flex flex-col lg:flex-row justify-between items-center lg:items-end mb-4 gap-4 lg:gap-0">
                      <div className="-mt-16 lg:-mt-12 relative shrink-0">
                         <AvatarUploader onUpload={handleAvatarUpload}>
                             <div className="relative group">
                                <Avatar className="w-24 h-24 lg:w-28 lg:h-28 rounded-full border-[4px] border-white dark:border-zinc-900 shadow-sm cursor-pointer object-cover">
                                    <AvatarImage src={localUserData?.photoURL || `https://ui-avatars.com/api/?name=${localUserData.displayName}&background=000&color=fff`} className="object-cover"/>
                                    <AvatarFallback className="text-2xl font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                                    {localUserData.displayName?.charAt(0) || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                    <Icon name="camera" className="text-white text-xl" />
                                </div>
                             </div>
                         </AvatarUploader>
                      </div>
                      <button onClick={() => {
                          if (localUserData.isAffiliate) {
                              const link = `${window.location.origin}?ref=${localUserData.uid}`;
                              navigator.clipboard.writeText(link);
                              notify("Referral link copied to clipboard!", "success");
                          } else {
                              navigate('/affiliate');
                          }
                      }} className="flex items-center space-x-1.5 px-4 py-2 mt-2 lg:mt-0 rounded-full border-2 border-[#FF5C01] text-[#FF5C01] text-sm font-semibold hover:bg-[#FF5C01]/5 transition-colors shrink-0">
                          <UserPlus className="w-4 h-4" />
                          <span>Invite</span>
                      </button>
                  </div>

                  <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start text-center lg:text-left gap-4 lg:gap-0">
                      <div 
                         onClick={() => window.dispatchEvent(new CustomEvent('openAccountCenter'))}
                         className="cursor-pointer active:scale-95 transition-transform"
                      >
                          <h1 className="text-[22px] lg:text-[24px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight mb-1 flex items-center justify-center lg:justify-start space-x-1">
                              <span>{localUserData.displayName || "User"}</span>
                              <ChevronRight className="w-4 h-4 text-zinc-400 rotate-90 lg:rotate-0" />
                          </h1>
                          <p className="text-sm text-zinc-500 font-medium break-all">
                              {localUserData.email}
                          </p>
                      </div>
                      <div className="flex space-x-6 text-center">
                          <div>
                              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{orderCount}</p>
                              <p className="text-xs text-zinc-500 font-medium">Orders</p>
                          </div>
                          <div>
                              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{localUserData.wishlist?.length || 0}</p>
                              <p className="text-xs text-zinc-500 font-medium">Saved</p>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Premium Status */}
              <div id="profile-member" onClick={() => navigate('/affiliate')} className="bg-white dark:bg-zinc-900 rounded-[24px] shadow-sm p-4 px-5 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform">
                  <div className="flex items-center space-x-3">
                      <Diamond className="w-5 h-5 text-blue-500 fill-blue-500" />
                      <span className="font-semibold text-[15px] text-zinc-900 dark:text-zinc-100">Member Status</span>
                  </div>
                  <div className="flex items-center space-x-1">
                      <span className="text-[#FF5C01] text-sm font-semibold">{localUserData.isAffiliate ? "Pro" : "Standard"}</span>
                      <ChevronRight className="w-4 h-4 text-[#FF5C01]" strokeWidth={2.5}/>
                  </div>
              </div>

              {/* Affiliate Grid */}
              {localUserData?.isAffiliate && (
                <div className="grid grid-cols-2 gap-4">
                    <div onClick={() => navigate('/affiliate')} className="p-5 bg-white dark:bg-zinc-900 rounded-[24px] shadow-sm border border-emerald-100 dark:border-emerald-900/30 text-center cursor-pointer active:scale-[0.98] transition-transform">
                        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-0.5">৳ {localUserData.walletBalance || 0}</p>
                        <p className="text-[13px] text-zinc-500 font-medium">Wallet</p>
                    </div>
                    <div onClick={() => navigate('/affiliate')} className="p-5 bg-white dark:bg-zinc-900 rounded-[24px] shadow-sm border border-emerald-100 dark:border-emerald-900/30 text-center cursor-pointer active:scale-[0.98] transition-transform">
                        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-0.5">৳ {localUserData.totalEarned || 0}</p>
                        <p className="text-[13px] text-zinc-500 font-medium">Total Earned</p>
                    </div>
                </div>
              )}
              
              {/* Order Actions */}
          <div className="bg-white dark:bg-zinc-900 rounded-[24px] shadow-sm p-5 py-6">
              <div className="grid grid-cols-4 gap-2">
                  <div onClick={() => navigate('/orders/pay')} className="flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform group">
                      <div className="relative mb-2">
                          <CreditCard className="w-6 h-6 text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors" />
                          {orders.filter(o => o.status === OrderStatus.PENDING).length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white dark:border-zinc-900">
                                {orders.filter(o => o.status === OrderStatus.PENDING).length}
                            </span>
                          )}
                      </div>
                      <span className="text-[12px] font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200">Pay</span>
                  </div>
                  
                  <div onClick={() => navigate('/orders/ship')} className="flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform group">
                      <div className="relative mb-2">
                          <Truck className="w-6 h-6 text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors" />
                          {orders.filter(o => o.status === OrderStatus.SHIPPED || o.status === OrderStatus.ON_THE_WAY).length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white dark:border-zinc-900">
                                {orders.filter(o => o.status === OrderStatus.SHIPPED || o.status === OrderStatus.ON_THE_WAY).length}
                            </span>
                          )}
                      </div>
                      <span className="text-[12px] font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200">Ship</span>
                  </div>

                  <div onClick={() => navigate('/orders/receive')} className="flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform group">
                      <div className="relative mb-2">
                          <Package className="w-6 h-6 text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors" />
                          {orders.filter(o => o.status === OrderStatus.DELIVERED && (Date.now() - ((o as any).updatedAt || o.createdAt)) <= 24 * 60 * 60 * 1000).length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white dark:border-zinc-900">
                                {orders.filter(o => o.status === OrderStatus.DELIVERED && (Date.now() - ((o as any).updatedAt || o.createdAt)) <= 24 * 60 * 60 * 1000).length}
                            </span>
                          )}
                      </div>
                      <span className="text-[12px] font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200">Receive</span>
                  </div>

                  <div onClick={() => navigate('/orders/review')} className="flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform group">
                      <div className="relative mb-2">
                          <MessageSquareShare className="w-6 h-6 text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors" />
                          {orders.filter(o => o.status === OrderStatus.DELIVERED).length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white dark:border-zinc-900">
                                {orders.filter(o => o.status === OrderStatus.DELIVERED).length}
                            </span>
                          )}
                      </div>
                      <span className="text-[12px] font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200">Review</span>
                  </div>
              </div>
          </div>
          
            {/* Quick Links Row 1 */}
            <div className="bg-white dark:bg-zinc-900 rounded-[24px] shadow-sm p-5 py-6">
                <div className="grid grid-cols-3 gap-2">
                    <div onClick={() => navigate('/orders')} className="flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform group text-center">
                        <Clock className="w-6 h-6 mb-2 text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
                        <span className="text-[11px] md:text-[12px] font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">History</span>
                    </div>
                    <div onClick={() => navigate('/wishlist')} className="flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform group text-center">
                        <Heart className="w-6 h-6 mb-2 text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
                        <span className="text-[11px] md:text-[12px] font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">Wishlist</span>
                    </div>
                    <div onClick={() => navigate('/coupon')} className="flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform group text-center">
                        <Ticket className="w-6 h-6 mb-2 text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
                        <span className="text-[11px] md:text-[12px] font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">Coupons</span>
                    </div>
                </div>
            </div>

            {/* Banner */}
            {banners.filter(b => b.bannerType === "profile").length > 0 && (
                <div className="rounded-[24px] overflow-hidden shadow-sm aspect-[21/9] relative group cursor-pointer" onClick={() => navigate(banners.filter(b => b.bannerType === "profile")[activeBanner]?.link || '/all-products')}>
                    <div
                    className="flex transition-transform duration-700 ease-[cubic-bezier(0.23, 1, 0.32, 1)] h-full"
                    style={{ transform: `translateX(-${activeBanner * 100}%)` }}
                    >
                    {banners.filter(b => b.bannerType === "profile").map((banner) => (
                        <div key={banner.id} className="min-w-full h-full relative">
                        <img src={banner.imageUrl} alt="Banner" className="w-full h-full object-cover" />
                        </div>
                    ))}
                    </div>
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-white text-xs font-medium">
                        {activeBanner + 1} / {banners.filter(b => b.bannerType === "profile").length}
                    </div>
                </div>
            )}

            {/* Highlighted Row */}
            <div className="grid grid-cols-2 gap-4">
                <div onClick={() => navigate('/bundles')} className="bg-[#FFF4E6] dark:bg-[#2A1F13] rounded-[24px] p-4 flex flex-row items-center justify-between cursor-pointer shadow-sm active:scale-95 transition-transform">
                    <div>
                        <h4 className="font-bold text-[15px] md:text-base text-zinc-900 dark:text-zinc-100 mb-0.5 tracking-tight">Bundle offers</h4>
                        <p className="text-xs text-zinc-500 mb-2">Infinite bundles</p>
                        <span className="px-3 py-1 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold text-[10px] rounded-full shadow-sm">Shop now</span>
                    </div>
                    <ShoppingBag className="w-10 h-10 text-[#FF5C01] drop-shadow-sm opacity-90"/>
                </div>

                <div onClick={() => navigate((localUserData?.coins || 0) > 0 ? '/my-coins' : '/my-coins')} className="bg-[#FFF0F5] dark:bg-[#2F1D25] rounded-[24px] p-4 flex flex-row items-center justify-between cursor-pointer shadow-sm active:scale-95 transition-transform">
                    <div>
                        <h4 className="font-bold text-[15px] md:text-base text-zinc-900 dark:text-zinc-100 mb-0.5 tracking-tight flex items-center">
                            Coins: {localUserData?.coins || 0}
                        </h4>
                        <p className="text-xs text-zinc-500 mb-2">{(localUserData?.coins || 0) > 0 ? "Check your balance" : "Deposit or earn coins"}</p>
                        <span className="px-3 py-1 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold text-[10px] rounded-full shadow-sm">{(localUserData?.coins || 0) > 0 ? "Check Coins" : "Deposit or Earn"}</span>
                    </div>
                    <CircleDollarSign className="w-10 h-10 text-amber-500 drop-shadow-sm opacity-90"/>
                </div>
            </div>

            {/* Quick Links Row 2 */}
            <div className="bg-white dark:bg-zinc-900 rounded-[24px] shadow-sm p-4 py-5 md:p-5 md:py-6">
                <div className="grid grid-cols-3 gap-1">
                    <div onClick={() => navigate('/deposit')} className="flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform group text-center">
                        <Wallet className="w-5 h-5 md:w-6 md:h-6 mb-2 text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
                        <span className="text-[10px] md:text-[11px] font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">Deposit</span>
                    </div>
                    <div onClick={() => navigate('/bonus')} className="flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform group text-center">
                        <Gift className="w-5 h-5 md:w-6 md:h-6 mb-2 text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
                        <span className="text-[10px] md:text-[11px] font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">Bonus</span>
                    </div>
                    <div onClick={() => navigate('/help-center')} className="flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform group text-center">
                        <Headphones className="w-5 h-5 md:w-6 md:h-6 mb-2 text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
                        <span className="text-[10px] md:text-[11px] leading-tight font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">Help<br/>Center</span>
                    </div>
                </div>
            </div>

          {/* Admin Panel */}
          {isAdmin && (
            <div 
              onClick={() => navigate("/admin")}
              className="bg-gradient-to-r from-zinc-800 to-zinc-900 dark:from-zinc-100 dark:to-zinc-300 rounded-[28px] p-5 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform shadow-md"
            >
              <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 dark:bg-black/10 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-white dark:text-black" />
                  </div>
                  <div>
                      <h3 className="font-bold text-lg text-white dark:text-black">Admin Portal</h3>
                      <p className="text-sm font-medium text-zinc-300 dark:text-zinc-600">Manage your store & orders</p>
                  </div>
              </div>
              <div className="w-10 h-10 bg-white/10 dark:bg-black/10 rounded-full flex items-center justify-center">
                  <ChevronRight className="w-5 h-5 text-white dark:text-black" />
              </div>
            </div>
          )}

          {/* Referral Banner */}
          <div id="profile-referral" onClick={() => {
              if (!localUserData) navigate("/auth-selector");
              else navigate("/affiliate");
            }} className="bg-[#FF6611] rounded-[24px] shadow-sm p-5 relative overflow-hidden flex flex-col justify-center cursor-pointer active:scale-[0.98] transition-transform text-white mt-1 h-32">
              <h3 className="font-bold text-[20px] mb-2.5 relative z-10 leading-tight">
                {!localUserData ? 'Log in to refer & earn' : localUserData.affiliateStatus !== 'approved' ? 'Apply for partner to earn' : 'Refer a friend'}
              </h3>
              <div className="flex items-center space-x-2 bg-white w-fit px-2 py-1.5 rounded-xl relative z-10 shadow-sm">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#FFC27A] to-[#FF8C00] flex items-center justify-center text-[12px] font-bold text-white shadow-inner">
                      ৳
                  </div>
                  <span className="text-[13px] font-bold text-zinc-900 pr-1 tracking-tight">
                    {!localUserData ? 'Login to Earn' : localUserData.affiliateStatus !== 'approved' ? 'Apply Now' : 'Up to 200 / referral'}
                  </span>
              </div>
              
              {/* Background waves/decorations */}
              <div className="absolute right-[50px] top-1/2 -translate-y-1/2 rounded-full border-2 border-white/10 w-48 h-48 pointer-events-none" />
              <div className="absolute right-[80px] top-1/2 -translate-y-1/2 rounded-full border-2 border-white/10 w-32 h-32 pointer-events-none" />
              <div className="absolute right-[110px] top-1/2 -translate-y-1/2 rounded-full border-2 border-white/10 w-16 h-16 pointer-events-none" />

              {/* Characters / Pandas representation */}
              <div className="absolute right-0 bottom-[-10px] h-[110%] w-[160px] pointer-events-none drop-shadow-xl z-10">
                  <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Panda1&backgroundColor=transparent&primaryColor=FF6611" alt=" Mascot" className="absolute bottom-2 right-12 w-20 h-20 object-contain drop-shadow-md brightness-0 invert" style={{ WebkitFilter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }} />
                  <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Panda2&backgroundColor=transparent&primaryColor=FF6611" alt=" Mascot" className="absolute bottom-4 right-2 w-24 h-24 object-contain drop-shadow-md brightness-0 invert" style={{ WebkitFilter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }} />
                  
                  {/* Floating Coins */}
                  <div className="absolute top-6 right-32 w-4 h-4 rounded-full bg-yellow-300 shadow-sm rotate-12" />
                  <div className="absolute top-12 right-2 w-5 h-5 rounded-full bg-yellow-400 shadow-sm -rotate-12" />
                  <div className="absolute bottom-8 right-24 w-3 h-3 rounded-full bg-yellow-200 shadow-sm rotate-45" />
                  <div className="absolute bottom-2 right-[120px] w-6 h-6 rounded-md bg-yellow-100 shadow-sm rotate-12 opacity-80" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}/>
              </div>
          </div>

          </div>

          <div className="lg:col-span-7 space-y-5">
              {/* Menu Items */}
          <div id="profile-menu" className="bg-white dark:bg-zinc-900 rounded-[32px] overflow-hidden shadow-sm p-2">
              <div className="lg:grid lg:grid-cols-2 lg:gap-2">
                  <ProfileMenuItem icon={<ShoppingBag className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />} label="My Orders" onClick={() => navigate('/orders')} />
                  <ProfileMenuItem icon={<Heart className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />} label="My Wishlist" onClick={() => navigate('/wishlist')} />
                  <ProfileMenuItem icon={<FileText className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />} label="Blog" onClick={() => navigate('/blog')} />
                  <ProfileMenuItem icon={<Headphones className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />} label="Help Center" onClick={() => navigate('/help-center')} />
                  <ProfileMenuItem icon={<Lock className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />} label="Privacy Policy" onClick={() => navigate('/privacy')} />
                  <ProfileMenuItem icon={<ShieldCheck className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />} label="Terms & Conditions" onClick={() => navigate('/terms')} />
                  <ProfileMenuItem icon={<Info className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />} label="About Us" onClick={() => navigate('/about')} />
                  <ProfileMenuItem icon={<Mail className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />} label="Contact Us" onClick={() => navigate('/contact')} />
              </div>
              <div 
                  onClick={() => {
                      window.dispatchEvent(new CustomEvent('openAccountCenter'));
                  }}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors active:bg-zinc-100 dark:active:bg-zinc-800 mt-2 rounded-xl"
              >
                  <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/10 flex items-center justify-center shadow-sm">
                         <LogOut className="w-5 h-5 text-red-500" />
                      </div>
                      <span className="font-medium text-[15px] text-red-500">Log Out</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-400" strokeWidth={2} />
              </div>
          </div>

          </div>
      </div>

      {/* Recommended Products */}
      {recommendedProducts.length > 0 && (
        <div className="max-w-lg lg:max-w-6xl mx-auto px-5 mt-8 pb-10">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 tracking-tight">You Might Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-6 gap-4 xl:grid-cols-5 2xl:grid-cols-6">
            {recommendedProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

    </div>
    </TourProvider>
  );
};

function ProfileMenuItem({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
    return (
        <div 
            onClick={onClick}
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors active:bg-zinc-100 dark:active:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800/50 last:border-b-0"
        >
            <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                   {icon}
                </div>
                <span className="font-medium text-[15px] text-zinc-900 dark:text-zinc-100">{label}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-400" strokeWidth={2} />
        </div>
    )
}

export default Profile;

