import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNotify } from "../components/Notifications";

const Coupon: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, "coupons"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (auth.currentUser) {
        const unsub = onSnapshot(doc(db, "users", auth.currentUser.uid), (docSnap) => {
            if (docSnap.exists()) setUserData(docSnap.data());
        });
        return () => unsub();
    }
  }, []);

  const handleClaim = async (couponId: string) => {
    if (!auth.currentUser) {
        notify("Please login to claim vouchers", "error");
        return;
    }
    try {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
            claimedCoupons: arrayUnion(couponId)
        });
        notify("Voucher claimed successfully! You can use it at checkout", "success");
    } catch (err) {
        notify("Failed to claim voucher", "error");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 animate-fade-in min-h-screen">
      <div className="mb-8 flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-black mb-2 text-zinc-900 dark:text-zinc-100">Coupon Vouchers</h1>
            <p className="text-sm font-medium text-zinc-500">Exclusive vouchers for your next purchase</p>
        </div>
        <button onClick={() => navigate('/my-coupons')} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-sm font-bold rounded-xl text-zinc-900 dark:text-zinc-100">
            My Coupons
        </button>
      </div>

      <div className="space-y-4">
        {coupons.map((c, i) => {
          const isExpired = c.expiresAt && c.expiresAt < Date.now();
          const isClaimed = userData?.claimedCoupons?.includes(c.id);
          return (
            <div key={i} className={`relative bg-amber-500/10 dark:bg-amber-900/10 rounded-[20px] overflow-hidden border border-amber-200 dark:border-amber-900 flex shadow-sm ${(isExpired && !isClaimed) ? "opacity-60 grayscale" : ""}`}>
                {/* Left section - Discount */}
                <div className="w-[100px] md:w-[120px] bg-amber-500 text-white flex flex-col justify-center items-center p-4 relative shrink-0">
                    <span className="text-2xl md:text-3xl font-black">{c.type === 'percent' ? `${c.discount}%` : `৳${c.discount}`}</span>
                    <span className="text-xs font-bold tracking-wider uppercase mt-1">OFF</span>
                    
                    {/* Jagged edge */}
                    <div className="absolute right-0 top-0 bottom-0 w-2 flex flex-col justify-between translate-x-1/2 py-1">
                        {[...Array(12)].map((_, j) => (
                            <div key={j} className="w-2.5 h-2.5 bg-zinc-50 dark:bg-[#0a0a0b] rounded-full my-0.5"></div>
                        ))}
                    </div>
                </div>
                
                {/* Right section - Details */}
                <div className="p-4 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 ml-[5px]">
                    <div>
                        <h3 className="font-bold text-lg mb-1 text-zinc-900 dark:text-zinc-100">{c.code}</h3>
                        <p className="text-xs text-zinc-500">
                            {c.minOrderAmount > 0 ? `For orders over ৳${c.minOrderAmount}` : "No minimum order amount"}
                            {c.expiresAt && <span className={`block mt-1 ${isExpired ? 'text-red-500 font-bold' : ''}`}>{isExpired ? "EXPIRED" : `Valid until: ${new Date(c.expiresAt).toLocaleDateString()}`}</span>}
                        </p>
                    </div>
                    
                    <button 
                        onClick={() => !isClaimed && !isExpired && handleClaim(c.id)}
                        disabled={isExpired || isClaimed}
                        className={`whitespace-nowrap px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider disabled:opacity-50 active:scale-95 transition-all ${isClaimed ? 'bg-green-500 text-white' : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'}`}
                    >
                      {isClaimed ? "Claimed ✓" : isExpired ? "Expired" : "Claim Voucher"}
                    </button>
                </div>
            </div>
        )})}
        {coupons.length === 0 && (
            <div className="py-20 text-center">
                <p className="text-zinc-500">No active coupons available at the moment.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Coupon;
