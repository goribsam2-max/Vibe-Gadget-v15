import React, { useState, useEffect } from "react";
import { collection, addDoc, getDoc, doc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNotify } from "../components/Notifications";
import { useNavigate } from "react-router-dom";

const Deposit: React.FC = () => {
  const [amount, setAmount] = useState("");
  const [trxId, setTrxId] = useState("");
  const [method, setMethod] = useState("bkash");
  const [loading, setLoading] = useState(false);
  const [adminNumbers, setAdminNumbers] = useState({ bkash: "", nagad: "" });
  
  const notify = useNotify();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      const docSnap = await getDoc(doc(db, "settings", "platform"));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAdminNumbers({
          bkash: data.bkashNumber || "Not Set",
          nagad: data.nagadNumber || "Not Set",
        });
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !trxId) return notify("Please fill all fields", "error");
    
    setLoading(true);
    try {
      const depositData = {
        userId: auth.currentUser?.uid,
        userEmail: auth.currentUser?.email,
        amount: Number(amount),
        trxId,
        method,
        status: "pending",
        createdAt: Date.now()
      };
      await addDoc(collection(db, "deposits"), depositData);
      
      const { sendDepositRequestToTelegram } = await import("../services/telegram");
      await sendDepositRequestToTelegram(depositData);

      notify("Deposit request sent. Wait for approval.", "success");
      navigate("/profile");
    } catch (err) {
      notify("Deposit failed. Try again.", "error");
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-锌-100">Deposit Money</h2>
      
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800">
        <label className="block text-sm font-semibold mb-2">Select Payment Method</label>
        <div className="flex gap-4 mb-6">
          <button 
            type="button"
            onClick={() => setMethod('bkash')}
            className={`flex-1 py-3 rounded-xl border-2 font-bold ${method === 'bkash' ? 'border-pink-500 text-pink-600 bg-pink-50 dark:bg-pink-900/20' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500'}`}
          >
            bKash
          </button>
          <button 
            type="button"
            onClick={() => setMethod('nagad')}
            className={`flex-1 py-3 rounded-xl border-2 font-bold ${method === 'nagad' ? 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-900/20' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500'}`}
          >
            Nagad
          </button>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl mb-6 text-sm text-zinc-700 dark:text-zinc-300">
          Send money to this {method === 'bkash' ? 'bKash' : 'Nagad'} Number:
          <div className="text-xl font-bold tracking-widest mt-1 text-zinc-900 dark:text-zinc-100">
            {method === 'bkash' ? adminNumbers.bkash : adminNumbers.nagad}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Amount Sent (৳)</label>
            <input 
              type="number" 
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm border-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-锌-100 outline-none"
              placeholder="e.g. 500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Transaction ID (TrxID)</label>
            <input 
              type="text" 
              required
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm border-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-锌-100 outline-none"
              placeholder="e.g. 8H3KJ2L9A"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 mt-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold tracking-wide disabled:opacity-50 active:scale-95 transition-transform"
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Deposit;
