import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  doc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { UserProfile } from "../types";
import Icon from "../components/Icon";
import { useNotify } from "../components/Notifications";
import { sendWithdrawalRequestToTelegram } from "../services/telegram";

import { Card } from "@/components/ui/card"
import { Wallet, TrendingUp, Eye, RefreshCw, ArrowDown, ArrowUp, ArrowLeftRight, Clock, Bitcoin, CheckCircle2, History } from "lucide-react"

const WithdrawPage: React.FC<{ userData: UserProfile | null }> = ({
  userData,
}) => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bkashNumber, setBkashNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any>(null);

  useEffect(() => {
    // Fetch configs
    import("firebase/firestore").then(({ getDoc, doc }) => {
      getDoc(doc(db, "settings", "platform")).then((snap) => {
        if (snap.exists()) setConfigs(snap.data());
      });
    });

    if (!userData) {
      if (!auth.currentUser) navigate("/auth-selector");
      return;
    }

    const unsub = onSnapshot(
      query(
        collection(db, "withdrawals"),
        where("userId", "==", userData.uid),
        orderBy("createdAt", "desc"),
      ),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
        setWithdrawals(list);
      },
    );

    return () => unsub();
  }, [userData, navigate]);

  const handleWithdraw = async () => {
    if (!userData) return;
    const amount = Number(withdrawAmount);
    const minWithdrawal = configs?.affiliateMinWithdrawal ?? 50;

    if (!amount || amount < minWithdrawal)
      return notify(`Minimum withdraw is ৳${minWithdrawal}`, "error");
    if (amount > (userData.walletBalance || 0))
      return notify("Insufficient balance", "error");
    if (!bkashNumber || bkashNumber.length < 11)
      return notify("Enter valid bKash number", "error");
    if (!accountName) return notify("Enter account name", "error");

    setSubmittingWithdraw(true);
    try {
      await addDoc(collection(db, "withdrawals"), {
        userId: userData.uid,
        amount,
        bkashNumber,
        accountName,
        status: "Pending",
        createdAt: Date.now(),
      });
      await updateDoc(doc(db, "users", userData.uid), {
        walletBalance: (userData.walletBalance || 0) - amount,
      });

      sendWithdrawalRequestToTelegram({
        userId: userData.uid,
        userName: userData.displayName || "Unknown",
        amount,
        method: "bkash",
        accountNumber: bkashNumber,
        createdAt: Date.now(),
      });

      notify("Withdraw request submitted successfully", "success");
      setWithdrawAmount("");
      setBkashNumber("");
      setAccountName("");
    } catch (e) {
      notify("Failed to submit request", "error");
    }
    setSubmittingWithdraw(false);
  };

  if (!userData)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="spinner-third" className="animate-spin text-xl" />
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 min-h-screen bg-background text-foreground font-sans relative overflow-hidden">
        <div aria-hidden className="fixed inset-0 isolate contain-strict -z-10 opacity-30 dark:opacity-60 pointer-events-none">
            <div className="bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,rgba(0,0,0,0.06)_0,rgba(0,0,0,0.02)_50%,rgba(0,0,0,0.01)_80%)] dark:bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,rgba(255,255,255,0.06)_0,rgba(255,255,255,0.02)_50%,rgba(255,255,255,0.01)_80%)] absolute top-0 right-0 h-[800px] w-[560px] -translate-y-[350px] rounded-full" />
            <div className="bg-[radial-gradient(50%_50%_at_50%_50%,rgba(0,0,0,0.04)_0,rgba(0,0,0,0.01)_80%,transparent_100%)] dark:bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,255,255,0.04)_0,rgba(255,255,255,0.01)_80%,transparent_100%)] absolute top-0 right-0 h-[800px] w-[240px] -translate-y-[350px] rounded-full" />
        </div>
      

      <div className="flex flex-col lg:flex-row gap-6 mb-10 w-full max-w-5xl mx-auto">
        {/* Wallet style card */}
        <Card className="flex-1 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-3xl">
          <div className="space-y-6">
            <div className="space-y-3">
              <Card className="p-4 bg-gradient-to-r from-pink-200 to-rose-200 dark:from-pink-900/40 dark:to-rose-900/40 border border-pink-300/50 dark:border-pink-800/50 shadow-sm rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-black/10 dark:bg-white/10 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                    </div>
                    <span className="font-medium text-gray-800 dark:text-gray-200">Pending</span>
                  </div>
                  <span className="font-semibold text-gray-800 dark:text-gray-100">
                    ৳{withdrawals.filter(w => w.status === 'Pending').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
                  </span>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-r from-purple-200 to-indigo-200 dark:from-purple-900/40 dark:to-indigo-900/40 border border-purple-300/50 dark:border-purple-800/50 shadow-sm rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-black/10 dark:bg-white/10 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                    </div>
                    <span className="font-medium text-gray-800 dark:text-gray-200">Completed</span>
                  </div>
                  <span className="font-semibold text-gray-800 dark:text-gray-100">
                    ৳{withdrawals.filter(w => w.status === 'Completed').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
                  </span>
                </div>
              </Card>
            </div>

            <div className="space-y-4 py-6 px-4 border border-gray-100 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                  </div>
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Available Balance</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                  ৳{(userData.walletBalance || 0).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <div className="flex items-center gap-4 p-3 border border-gray-100 dark:border-zinc-800 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center border border-pink-200 dark:border-pink-800/50">
                  <History className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Total Withdrawals</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{withdrawals.length} requests</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2rem] shadow-sm mb-12">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Icon
              name="arrow-down"
              className="text-zinc-600 dark:text-zinc-400 text-xl"
            />
          </div>
          <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Request Withdrawal</span>
        </div>
        <div className="space-y-6 mb-8">
          <div>
            <label className="text-xs font-semibold text-zinc-500 tracking-wide uppercase mb-3 block">
              Amount (Min ৳{configs?.affiliateMinWithdrawal ?? 50})
            </label>
            <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xl transition-colors group-focus-within:text-zinc-900 dark:group-focus-within:text-white">
                ৳
              </div>
              <input
                type="number"
                min={configs?.affiliateMinWithdrawal ?? 50}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-100 dark:border-zinc-800 pl-14 pr-6 py-5 rounded-full outline-none font-bold text-3xl text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-white transition-all shadow-inner"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-zinc-500 tracking-wide uppercase mb-3 block">
                bKash Number
              </label>
              <input
                type="text"
                value={bkashNumber}
                onChange={(e) => setBkashNumber(e.target.value)}
                placeholder="01XXX..."
                className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 px-6 py-5 rounded-full outline-none font-semibold text-lg text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-white transition-all shadow-inner"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 tracking-wide uppercase mb-3 block">
                Account Name
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 px-6 py-5 rounded-full outline-none font-semibold text-lg text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-white transition-all shadow-inner"
              />
            </div>
          </div>
        </div>
        <button
          onClick={handleWithdraw}
          disabled={submittingWithdraw}
          className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-5 rounded-full font-bold tracking-wide hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center space-x-3 shadow-lg"
        >
          {submittingWithdraw ? (
            <Icon name="spinner-third" className="animate-spin text-xl" />
          ) : (
            <>
              <span>Submit Request</span>
              <Icon name="arrow-right" />
            </>
          )}
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Withdrawal History
          </h3>
          <span className="text-xs font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full uppercase tracking-widest">
            {withdrawals.length} total
          </span>
        </div>

        {withdrawals.length === 0 ? (
          <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-[2rem] border border-dashed border-zinc-200 dark:border-zinc-800">
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
               <Icon
                 name="history"
                 className="text-2xl text-zinc-400 dark:text-zinc-500"
               />
            </div>
            <p className="text-sm font-semibold tracking-wide text-zinc-500">
              No withdrawals yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
              >
                <div className="flex items-center overflow-hidden pr-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 mr-4 transition-transform group-hover:scale-105 ${w.status === "Completed" ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm" : w.status === "Rejected" ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" : "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"}`}
                  >
                    <Icon
                      name={
                        w.status === "Completed"
                          ? "check"
                          : w.status === "Rejected"
                            ? "times"
                            : "clock"
                      }
                      className="text-lg"
                    />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center space-x-3 pb-1">
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {w.bkashNumber}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${w.status === "Completed" ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" : w.status === "Rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" : "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400"}`}
                      >
                        {w.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-400 tracking-wide">
                      {new Date(w.createdAt).toLocaleDateString()} at {new Date(w.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 flex items-center">
                  <span className="text-sm text-zinc-400 mr-1 font-bold group-hover:text-zinc-500 transition-colors">৳</span>
                  <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {w.amount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawPage;
