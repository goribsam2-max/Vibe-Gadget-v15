import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, addDoc, doc, getDoc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import { useNotify } from "../components/Notifications";
import { OrderStatus } from "../types";
import { sendOrderToTelegram } from "../services/telegram";
import { CustomSectionEmbed } from "../components/CustomSectionEmbed";
import { useTheme } from "../components/ThemeContext";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Skeleton } from "../components/ui/skeleton";
import {
  CreditCard, Truck, Shield, MapPin,
  Lock, Check, ChevronLeft, Percent, X, Smartphone, ShoppingBag
} from "lucide-react";
import { cn } from "../lib/utils";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const notify = useNotify();
  const { isDark } = useTheme();

  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [userIp, setUserIp] = useState<string>("");
  const [settings, setSettings] = useState<any>(null);

  // Address
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ name: "", phone: "", altPhone: "", address: "" });

  // Payment
  const prefMeth = localStorage.getItem("vibe_preferred_payment");
  const defaultBank = prefMeth === "bKash" || prefMeth === "Nagad" ? (prefMeth.toLowerCase() as "bkash" | "nagad") : null;
  const defaultPaymentType = prefMeth === "Cash on Delivery" ? "cod" : defaultBank ? "advance" : "cod";
  const [paymentType, setPaymentType] = useState<"cod" | "advance" | null>(defaultPaymentType);
  const [advanceType, setAdvanceType] = useState<"full" | "delivery" | null>(null);
  const [bankingMethod, setBankingMethod] = useState<"bkash" | "nagad" | null>(defaultBank);
  const [bankingAccountName, setBankingAccountName] = useState("");
  const [bankingTrxId, setBankingTrxId] = useState("");

  // Promo & Gift
  const [couponCode, setCouponCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [isGift, setIsGift] = useState(false);
  const [giftNote, setGiftNote] = useState("");
  const [affiliateRef, setAffiliateRef] = useState<string | null>(null);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  useEffect(() => {
    const ref = localStorage.getItem("affiliateRef");
    if (ref) {
      setAffiliateRef(ref);
      setCouponCode(ref);
      setAppliedPromo({ id: "affiliate", type: "percent", discount: 5, code: "REF-LINK" });
    }

    fetch("https://api.ipify.org?format=json").then(r => r.json()).then(d => setUserIp(d.ip)).catch(() => setUserIp("Unavailable"));

    const unsubSettings = onSnapshot(doc(db, "settings", "platform"), (doc) => {
      if (doc.exists()) setSettings(doc.data());
    });

    const cart = JSON.parse(localStorage.getItem("f_cart") || "[]");
    if (cart.length === 0) {
      navigate("/");
      return;
    }
    setItems(cart);

    if (auth.currentUser) {
      getDoc(doc(db, "users", auth.currentUser.uid)).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.addresses && Array.isArray(data.addresses)) {
            setSavedAddresses(data.addresses);
            if (data.addresses.length > 0) setSelectedAddressId(data.addresses[0].id);
          } else {
            setIsAddingNewAddress(true);
          }
        }
        setIsLoading(false);
      });
    } else {
      const localAddresses = JSON.parse(localStorage.getItem("vibe_shipping_addresses_v2") || "[]");
      setSavedAddresses(localAddresses);
      if (localAddresses.length > 0) setSelectedAddressId(localAddresses[0].id);
      else setIsAddingNewAddress(true);
      setIsLoading(false);
    }
    return () => unsubSettings();
  }, [navigate]);

  const subtotal = items.reduce((a, c) => a + c.price * c.quantity, 0);
  const deliveryFee = settings?.deliveryCharge || 120;
  let discount = 0;
  if (appliedPromo) {
    if (appliedPromo.type === "percent") discount = Math.round(subtotal * (appliedPromo.discount / 100));
    else discount = appliedPromo.discount;
  }
  const total = subtotal + deliveryFee - discount;

  const handleSaveAddress = async () => {
    if (!newAddress.name || !newAddress.phone || !newAddress.address) {
      return notify("Please complete all required fields.", "error");
    }
    const newAddrObj = { id: Math.random().toString(36).substring(7), ...newAddress };
    if (auth.currentUser) {
      try {
        const { setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "users", auth.currentUser.uid), { addresses: arrayUnion(newAddrObj) }, { merge: true });
        setSavedAddresses([...savedAddresses, newAddrObj]);
        setSelectedAddressId(newAddrObj.id);
        setIsAddingNewAddress(false);
        notify("Address saved.", "success");
      } catch (e) { notify("Error saving address.", "error"); }
    } else {
      const newAddrs = [...savedAddresses, newAddrObj];
      setSavedAddresses(newAddrs);
      setSelectedAddressId(newAddrObj.id);
      setIsAddingNewAddress(false);
      localStorage.setItem("vibe_shipping_addresses_v2", JSON.stringify(newAddrs));
    }
  };

  const applyPromo = async () => {
    setCouponError("");
    if (!couponCode.trim()) return;
    try {
      const { query, where, getDocs, collection } = await import("firebase/firestore");
      const q = query(collection(db, "coupons"), where("code", "==", couponCode.trim().toUpperCase()));
      const snap = await getDocs(q);
      if (snap.empty) setCouponError("Invalid coupon");
      else {
        const c = snap.docs[0].data();
        if (!c.isActive) setCouponError("Coupon inactive");
        else {
          setAppliedPromo({ id: snap.docs[0].id, ...c });
          notify("Coupon applied!", "success");
        }
      }
    } catch (e) { setCouponError("Error verifying coupon"); }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setCouponCode("");
  };

  const placeOrder = async () => {
    const activeAddress = savedAddresses.find((a) => a.id === selectedAddressId);
    if (!activeAddress) return notify("Address required", "error");

    setIsLoading(true);
    try {
      let paymentStr = "Cash on Delivery";
      let paymentOptStr = "N/A";
      let trxStr = "";

      if (paymentType === "advance") {
        paymentStr = bankingMethod === "bkash" ? "bKash Mobile Banking" : "Nagad Mobile Banking";
        paymentOptStr = advanceType === "full" ? "Full Payment" : "Delivery Fee Advanced";
        trxStr = bankingTrxId.trim();
      }

      const orderData = {
        userId: auth.currentUser?.uid || "guest",
        customerName: activeAddress.name,
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity, priceAtPurchase: i.price, name: i.name, image: i.image })),
        total: total,
        subTotal: subtotal,
        discount: discount,
        couponCode: appliedPromo ? appliedPromo.code : null,
        status: OrderStatus.PENDING,
        paymentMethod: paymentStr,
        paymentOption: paymentOptStr,
        accountNameSender: bankingAccountName.trim(),
        transactionId: trxStr,
        shippingAddress: activeAddress.address,
        contactNumber: activeAddress.phone,
        altNumber: activeAddress.altPhone || "",
        ipAddress: userIp,
        createdAt: Date.now(),
        isSuspicious: false,
        riskReason: "",
        isGift: isGift,
        giftNote: isGift ? giftNote : null,
        affiliateRef: affiliateRef || null,
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);

      if (orderData.affiliateRef) {
        try {
          const { increment } = await import("firebase/firestore");
          await updateDoc(doc(db, "users", orderData.affiliateRef), { walletBalance: increment(50) });
          await addDoc(collection(db, "affiliates_log"), { affiliateId: orderData.affiliateRef, orderId: docRef.id, customerName: activeAddress.name, commission: 50, createdAt: Date.now() });
        } catch (e) {}
      }

      if (appliedPromo && appliedPromo.id !== "affiliate") {
        try {
          const { increment, arrayUnion } = await import("firebase/firestore");
          await updateDoc(doc(db, "coupons", appliedPromo.id), { usedCount: increment(1), usedIPs: arrayUnion(userIp) });
        } catch (e) {}
      }

      await sendOrderToTelegram({ ...orderData, id: docRef.id });
      localStorage.removeItem("f_cart");
      navigate(`/success?orderId=${docRef.id}`);
    } catch (err: any) {
      notify("Order failed! Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const validateStep = (step: number) => {
    if (step === 1) return !!selectedAddressId;
    if (step === 2) {
      if (paymentType === "cod") return true;
      if (paymentType === "advance") {
        return !!bankingMethod && !!advanceType && !!bankingAccountName.trim() && !!bankingTrxId.trim();
      }
      return false;
    }
    if (step === 3) return agreeToTerms;
    return false;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((p) => Math.min(p + 1, 3));
    } else notify("Please complete the required fields.", "error");
  };

  const prevStep = () => setCurrentStep((p) => Math.max(p - 1, 1));

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6 flex flex-col gap-6 font-inter bg-zinc-50 dark:bg-[#000000]">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-zinc-50 dark:bg-[#000000] font-inter">
      <div className="max-w-7xl mx-auto p-6 flex flex-col gap-6">
        

        {/* Progress Steps */}
        <div className="flex items-center justify-between sm:justify-start sm:gap-6 py-4 overflow-x-auto no-scrollbar mask-linear-fade pr-4">
          {[
            { step: 1, label: "Shipping", icon: Truck },
            { step: 2, label: "Payment", icon: CreditCard },
            { step: 3, label: "Review", icon: Check },
          ].map(({ step, label, icon: Icon }, index) => (
            <div key={step} className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 sm:gap-2">
                <div
                  className={cn(
                    "flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 transition-colors",
                    currentStep >= step ? "bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900" : "border-zinc-300 dark:border-zinc-700 text-zinc-400"
                  )}
                >
                  {currentStep > step ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : <Icon className="h-3 w-3 sm:h-4 sm:w-4" />}
                </div>
                <span className={cn("text-[10px] sm:text-sm font-bold whitespace-nowrap", currentStep >= step ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400")}>
                  {label}
                </span>
              </div>
              {index < 2 && <div className={cn("w-4 sm:w-8 h-0.5", currentStep > step ? "bg-zinc-100 dark:bg-zinc-8000" : "bg-zinc-200 dark:bg-zinc-800")} />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Step 1: Shipping */}
            {currentStep === 1 && (
              <Card className="rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col gap-2">
                <CardHeader>
                  <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                    <MapPin className="h-5 w-5 text-zinc-900 dark:text-zinc-100" /> Shipping Information
                  </h2>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                  {savedAddresses.length > 0 && !isAddingNewAddress && (
                    <div className="space-y-3">
                      {savedAddresses.map((addr) => (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={cn(
                            "p-4 border-2 rounded-2xl cursor-pointer transition-all",
                            selectedAddressId === addr.id ? "border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800/50 dark:bg-emerald-900/10" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", selectedAddressId === addr.id ? "border-zinc-900 dark:border-zinc-100" : "border-zinc-300")}>
                              {selectedAddressId === addr.id && <div className="w-2 h-2 rounded-full bg-zinc-100 dark:bg-zinc-8000" />}
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-zinc-900 dark:text-zinc-100">{addr.name}</div>
                              <div className="text-sm font-medium text-zinc-500">{addr.phone}</div>
                              <div className="text-sm mt-1 text-zinc-600 dark:text-zinc-400">{addr.address}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full mt-2 border-dashed" onClick={() => setIsAddingNewAddress(true)}>+ Add New Address</Button>
                    </div>
                  )}

                  {(isAddingNewAddress || savedAddresses.length === 0) && (
                    <div className="flex flex-col gap-4">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-2">
                           <Label>Full Name *</Label>
                           <Input placeholder="E.g. John Doe" value={newAddress.name} onChange={(e) => setNewAddress({...newAddress, name: e.target.value})} />
                         </div>
                         <div className="space-y-2">
                           <Label>Phone *</Label>
                           <Input placeholder="01XXXXXXXXX" value={newAddress.phone} onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})} />
                         </div>
                       </div>
                       <div className="space-y-2">
                         <Label>Detailed Address *</Label>
                         <Input placeholder="House, Road, Block, Area..." value={newAddress.address} onChange={(e) => setNewAddress({...newAddress, address: e.target.value})} />
                       </div>
                       <div className="flex gap-2">
                         <Button onClick={handleSaveAddress}>Save Address</Button>
                         {savedAddresses.length > 0 && <Button variant="ghost" onClick={() => setIsAddingNewAddress(false)}>Cancel</Button>}
                       </div>
                    </div>
                  )}

                  {/* Gift Toggle */}
                  <div className="mt-4 border-t border-zinc-100 dark:border-zinc-800 pt-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <Checkbox id="gift" checked={isGift} onCheckedChange={(c) => setIsGift(!!c)} />
                        <div>
                          <Label htmlFor="gift" className="font-bold text-base cursor-pointer">Send as a Gift</Label>
                          <p className="text-sm text-zinc-500">Invoice will hide prices. COD disabled.</p>
                        </div>
                      </div>
                      {isGift && (
                        <div className="space-y-2 ml-7">
                          <Label>Gift Note</Label>
                          <Input placeholder="Happy Birthday!..." value={giftNote} onChange={(e) => setGiftNote(e.target.value)} />
                        </div>
                      )}
                    </div>
                  </div>

                </CardContent>
                <CardFooter className="flex justify-end pt-4 pb-2">
                  <Button onClick={nextStep} disabled={!validateStep(1)} size="default" className="text-xs sm:text-sm px-4 sm:px-6">Continue</Button>
                </CardFooter>
              </Card>
            )}

            {/* Step 2: Payment */}
            {currentStep === 2 && (
              <Card className="rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col gap-2">
                <CardHeader>
                  <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                    <CreditCard className="h-5 w-5 text-zinc-900 dark:text-zinc-100" /> Payment Information
                  </h2>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      disabled={isGift}
                      onClick={() => setPaymentType("cod")}
                      className={cn("flex flex-col items-center gap-3 p-6 border-2 rounded-2xl transition-colors", paymentType === "cod" ? "border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800/50 dark:bg-emerald-900/10" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700", isGift && "opacity-50 cursor-not-allowed")}
                    >
                      <Truck className="h-8 w-8 text-zinc-700 dark:text-zinc-300" />
                      <div className="text-center">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">Cash on Delivery</div>
                        <div className="text-xs font-semibold text-zinc-500 mt-1">Pay at doorstep</div>
                      </div>
                    </button>

                    <button
                      onClick={() => setPaymentType("advance")}
                      className={cn("flex flex-col items-center gap-3 p-6 border-2 rounded-2xl transition-colors", paymentType === "advance" ? "border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800/50 dark:bg-emerald-900/10" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700")}
                    >
                      <Smartphone className="h-8 w-8 text-zinc-700 dark:text-zinc-300" />
                      <div className="text-center">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">Mobile Banking</div>
                        <div className="text-xs font-semibold text-zinc-500 mt-1">bKash / Nagad</div>
                      </div>
                    </button>
                  </div>

                  {paymentType === "advance" && (
                    <div className="flex flex-col gap-6 mt-4 border-t border-zinc-100 dark:border-zinc-800 pt-6 animate-in fade-in slide-in-from-top-4">
                      <div className="space-y-4">
                        <Label className="text-base text-zinc-900 dark:text-zinc-100">Select Amount to Pay Now</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <button
                            onClick={() => setAdvanceType("delivery")}
                            className={cn("flex items-center justify-between p-4 border-2 rounded-xl text-left", advanceType === "delivery" ? "border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800/50 dark:bg-emerald-900/10" : "border-zinc-200 dark:border-zinc-800")}
                          >
                            <div>
                              <div className="font-bold">Delivery Fee Only</div>
                              <div className="text-xs text-zinc-500">Pay rest on arrival</div>
                            </div>
                            <div className="font-bold px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">৳{deliveryFee}</div>
                          </button>
                          <button
                            onClick={() => setAdvanceType("full")}
                            className={cn("flex items-center justify-between p-4 border-2 rounded-xl text-left", advanceType === "full" ? "border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800/50 dark:bg-emerald-900/10" : "border-zinc-200 dark:border-zinc-800")}
                          >
                            <div>
                              <div className="font-bold">Full Payment</div>
                              <div className="text-xs text-zinc-500">Secure entire order</div>
                            </div>
                            <div className="font-bold px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">৳{total}</div>
                          </button>
                        </div>
                      </div>

                      {advanceType && (
                        <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                          <Label className="text-base text-zinc-900 dark:text-zinc-100">Select Provider & Make Payment</Label>
                          <div className="flex gap-4">
                            <button onClick={() => setBankingMethod("bkash")} className={cn("flex-1 py-3 border-2 rounded-xl font-bold text-sm", bankingMethod === "bkash" ? "border-pink-500 text-pink-600 bg-pink-50" : "border-zinc-200 text-zinc-500")}>bKash</button>
                            <button onClick={() => setBankingMethod("nagad")} className={cn("flex-1 py-3 border-2 rounded-xl font-bold text-sm", bankingMethod === "nagad" ? "border-orange-500 text-orange-600 bg-orange-50" : "border-zinc-200 text-zinc-500")}>Nagad</button>
                          </div>

                          {bankingMethod && (
                            <div className="p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4 mt-2">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                  <div className="text-[10px] font-bold text-zinc-500">Send Money to</div>
                                  <div className="text-sm sm:text-lg font-bold">{(bankingMethod === 'bkash' ? settings?.bkashNumber : settings?.nagadNumber) || "01778953114"}</div>
                                </div>
                                <Button size="sm" variant="outline" className="w-full sm:w-auto text-xs" onClick={() => navigator.clipboard.writeText((bankingMethod === 'bkash' ? settings?.bkashNumber : settings?.nagadNumber) || "01778953114")}>Copy Number</Button>
                              </div>
                              <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 p-3 rounded-xl text-xs font-bold leading-relaxed">
                                Please Send Money exactly ৳{advanceType === "full" ? total : deliveryFee}. Then enter the details below to verify.
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div className="space-y-1">
                                  <Label>Sender Name</Label>
                                  <Input placeholder="Account name" value={bankingAccountName} onChange={(e) => setBankingAccountName(e.target.value)} className="text-sm" />
                                </div>
                                <div className="space-y-1">
                                  <Label>TrxID</Label>
                                  <Input placeholder="9A6GH..." value={bankingTrxId} onChange={(e) => setBankingTrxId(e.target.value)} className="text-sm" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                </CardContent>
                <CardFooter className="flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800 pt-4 pb-2">
                  <Button variant="ghost" className="text-xs sm:text-sm px-2 sm:px-4" onClick={prevStep}><ChevronLeft className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> Back</Button>
                  <Button onClick={nextStep} disabled={!validateStep(2)} size="default" className="text-xs sm:text-sm px-4 sm:px-6">Review Order</Button>
                </CardFooter>
              </Card>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <Card className="rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col gap-2">
                <CardHeader>
                  <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                    <Check className="h-5 w-5 text-zinc-900 dark:text-zinc-100" /> Review Your Order
                  </h2>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-zinc-500">Shipping Details</Label>
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-sm font-medium">
                        <p>{savedAddresses.find((a) => a.id === selectedAddressId)?.name}</p>
                        <p>{savedAddresses.find((a) => a.id === selectedAddressId)?.phone}</p>
                        <p className="mt-2">{savedAddresses.find((a) => a.id === selectedAddressId)?.address}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-500">Payment Details</Label>
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-sm font-medium">
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">
                          {paymentType === "cod" ? "Cash on Delivery" : `${bankingMethod?.toUpperCase()} (${advanceType})`}
                        </p>
                        {paymentType === "advance" && <p className="mt-2 text-zinc-500">TrxID: {bankingTrxId}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-6">
                    <Checkbox id="terms" checked={agreeToTerms} onCheckedChange={(c) => setAgreeToTerms(!!c)} />
                    <Label htmlFor="terms" className="text-sm font-bold leading-snug cursor-pointer mt-0.5">
                      I agree to the <span className="underline text-zinc-800 dark:text-zinc-200">Terms of Service</span> and <span className="underline text-zinc-800 dark:text-zinc-200">Privacy Policy</span>. Note: Returns are subjective to warranty policies.
                    </Label>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-row justify-between items-center border-t border-zinc-100 dark:border-zinc-800 pt-4 pb-2 sm:gap-4 gap-2">
                  <Button variant="ghost" className="text-xs sm:text-sm px-2 sm:px-4" onClick={prevStep}><ChevronLeft className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> Back</Button>
                  <Button onClick={placeOrder} disabled={!validateStep(3) || isLoading} size="default" className="bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-lg shadow-black/10 dark:shadow-white/10 text-white dark:text-zinc-900 border-0 text-xs sm:text-sm px-4 sm:px-6 flex-1 sm:flex-none">
                    <Lock className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Complete
                  </Button>
                </CardFooter>
              </Card>
            )}

          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            <Card className="rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <CardHeader className="bg-zinc-50/50 dark:bg-zinc-800/20 border-b border-zinc-100 dark:border-zinc-800 pb-5">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="text-zinc-500 w-5 h-5" /> Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                <div className="flex flex-col gap-4 max-h-64 overflow-y-auto pr-2 scrollbar-thin">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="relative w-16 h-16 shrink-0 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 p-1">
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                        <span className="absolute -top-2 -right-2 bg-zinc-900 text-white w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold shadow-sm">{item.quantity}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate text-zinc-900 dark:text-zinc-100">{item.name}</div>
                        <div className="font-bold text-sm text-zinc-500 mt-1">৳{item.price * item.quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {!appliedPromo ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Input placeholder="Promo Code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="h-10 text-xs" />
                      <Button onClick={applyPromo} variant="outline" size="sm" className="h-10 text-xs shrink-0">Apply</Button>
                    </div>
                    {couponError && <div className="text-xs font-bold text-red-500">{couponError}</div>}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-zinc-100 dark:bg-zinc-800 dark:bg-emerald-900/10 border border-zinc-200 dark:border-zinc-800 dark:border-zinc-900 dark:border-zinc-100/20 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-zinc-800 dark:text-zinc-200" />
                      <span className="font-bold text-sm text-emerald-800 dark:text-emerald-300">{appliedPromo.code}</span>
                    </div>
                    <button onClick={removePromo} className="text-zinc-800 dark:text-zinc-200 hover:text-red-500"><X className="w-4 h-4"/></button>
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-sm font-medium">
                  <div className="flex justify-between text-zinc-500">
                    <span>Subtotal</span>
                    <span className="text-zinc-900 dark:text-zinc-100">৳{subtotal}</span>
                  </div>
                  {discount > 0 && (
                     <div className="flex justify-between text-zinc-800 dark:text-zinc-200 font-bold">
                       <span>Discount</span>
                       <span>-৳{discount}</span>
                     </div>
                  )}
                  <div className="flex justify-between text-zinc-500">
                    <span>Shipping</span>
                    <span className="text-zinc-900 dark:text-zinc-100">৳{deliveryFee}</span>
                  </div>
                  <div className="flex justify-between items-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
                     <span className="text-zinc-500 font-bold">Total</span>
                     <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">৳{total}</span>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <CustomSectionEmbed location="checkout_bottom" />
    </div>
  );
}
