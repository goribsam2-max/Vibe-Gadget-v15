import React, { useState, useEffect } from "react";
import { collection, query, documentId, where, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { Ticket } from "lucide-react";

export default function MyCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyCoupons = async () => {
      if (!auth.currentUser) {
          setLoading(false);
          return;
      }
      
      const userRef = await import("firebase/firestore").then(m => m.getDoc(m.doc(db, "users", auth.currentUser!.uid)));
      if (userRef.exists()) {
          const claimedIds = userRef.data().claimedCoupons || [];
          if (claimedIds.length > 0) {
              // chunk array into 10s if needed, or if few just use in
              const chunked = claimedIds.slice(0, 10); // Safe limit for 'in' query
              const q = query(collection(db, "coupons"), where(documentId(), "in", chunked));
              const snap = await getDocs(q);
              setCoupons(snap.docs.map(d => ({id: d.id, ...d.data()})));
          }
      }
      setLoading(false);
    };
    
    fetchMyCoupons();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6 animate-fade-in min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-black mb-2 text-zinc-900 dark:text-zinc-100">My Coupons</h1>
        <p className="text-sm font-medium text-zinc-500">Your claimed vouchers ready to use</p>
      </div>

      {loading ? (
          <div className="py-20 text-center text-zinc-500">Loading your coupons...</div>
      ) : coupons.length > 0 ? (
          <div className="space-y-4">
            {coupons.map((c, i) => {
              const isExpired = c.expiresAt && c.expiresAt < Date.now();
              return (
                <div key={i} className={`relative bg-green-500/10 dark:bg-green-900/10 rounded-[20px] overflow-hidden border border-green-200 dark:border-green-900 flex shadow-sm ${isExpired ? "opacity-60 grayscale" : ""}`}>
                    {/* Left section - Discount */}
                    <div className="w-[100px] md:w-[120px] bg-green-500 text-white flex flex-col justify-center items-center p-4 relative shrink-0">
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
                        
                        <div className="text-center md:text-right">
                           <span className="text-xs font-bold text-green-600 block mb-1">Available for use</span>
                           <button onClick={() => navigate('/cart')} className="underline text-sm font-bold text-zinc-900 dark:text-zinc-100">Shop now</button>
                        </div>
                    </div>
                </div>
            )})}
          </div>
      ) : (
          <div className="py-20 text-center bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 flex flex-col items-center">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                  <Ticket className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">No coupons claimed</h3>
              <p className="text-sm font-medium text-zinc-500 mb-6">You haven't claimed any vouchers yet.</p>
              <button onClick={() => navigate('/coupons')} className="px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold rounded-full">
                  Browse Coupons
              </button>
          </div>
      )}
    </div>
  );
}
