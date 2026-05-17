import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase";
import { UserProfile } from "../../types";
import { useNotify, useConfirm } from "../../components/Notifications";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "../../components/ui/modal-drop";
import Icon from "../../components/Icon";

const ManageUsers: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const confirm = useConfirm();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    user: UserProfile | null;
  }>({ isOpen: false, user: null });
  const [customWalletAmount, setCustomWalletAmount] = useState<string>("");

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map((d) => ({ ...d.data() }) as UserProfile));
    });
    return unsubscribe;
  }, []);

  const toggleBan = async (uid: string, currentStatus: boolean) => {
    await updateDoc(doc(db, "users", uid), { isBanned: !currentStatus });
    notify(currentStatus ? "User unblocked" : "User blocked", "info");
  };

  const updateWalletBalance = async (uid: string, newBalance: number) => {
    try {
      await updateDoc(doc(db, "users", uid), {
        walletBalance: Math.max(0, newBalance),
      });
      if (detailModal.user && detailModal.user.uid === uid) {
        setDetailModal({
          ...detailModal,
          user: { ...detailModal.user, walletBalance: Math.max(0, newBalance) },
        });
      }
      notify("Wallet balance updated", "success");
    } catch (e) {
      notify("Failed to update wallet", "error");
    }
  };

  const removeAffiliate = async (uid: string) => {
    confirm({
      title: "Remove Affiliate",
      message: "Are you sure you want to remove this user from the affiliate program?",
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, "users", uid), {
            isAffiliate: false,
            affiliateStatus: "rejected",
          });
          if (detailModal.user && detailModal.user.uid === uid) {
            setDetailModal({
              ...detailModal,
              user: {
                ...detailModal.user,
                isAffiliate: false,
                affiliateStatus: "rejected",
              },
            });
          }
          notify("User removed from affiliate program", "success");
        } catch (e) {
          notify("Error removing affiliate", "error");
        }
      }
    });
  };

  const addAffiliate = async (uid: string) => {
    confirm({
      title: "Add Affiliate",
      message: "Are you sure you want to add this user to the affiliate program?",
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, "users", uid), {
            isAffiliate: true,
            affiliateStatus: "approved",
          });
          if (detailModal.user && detailModal.user.uid === uid) {
            setDetailModal({
              ...detailModal,
              user: {
                ...detailModal.user,
                isAffiliate: true,
                affiliateStatus: "approved",
              },
            });
          }
          notify("User added to affiliate program", "success");
        } catch (e) {
          notify("Error adding affiliate", "error");
        }
      }
    });
  };

  const [filterType, setFilterType] = useState<"all" | "affiliates">("all");

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.ipAddress?.includes(search);
    const matchesFilter = filterType === "all" || u.isAffiliate;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-10 min-h-screen bg-[#FDFDFD]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
        <div className="flex items-center space-x-6">
          <div>
            <h1 className="text-xl md:text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              User List
            </h1>
            <p className="text-[10px] text-zinc-400 font-bold tracking-normal mt-1">
              Manage Customer Access
            </p>
          </div>
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setFilterType("all")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filterType === "all" ? "bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
            >
              All Users
            </button>
            <button
              onClick={() => setFilterType("affiliates")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filterType === "affiliates" ? "bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
            >
              Affiliates
            </button>
          </div>
        </div>
        <div className="relative w-full sm:max-w-md group">
          <input
            type="text"
            placeholder="Search by name, email or IP..."
            className="w-full p-5 bg-zinc-50 dark:bg-zinc-800 rounded-2xl outline-none border border-zinc-100 dark:border-zinc-800 focus:border-zinc-900 transition-all font-bold text-sm pl-14 shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Icon
            name="search"
            className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300"
          />
        </div>
      </div>

      <div className="flex flex-col space-y-3 max-w-4xl mx-auto">
        {filteredUsers.map((user) => (
          <motion.div
            layout
            key={user.uid}
            className="flex flex-col md:flex-row md:items-center justify-between gap-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm group hover:border-pink-300 dark:hover:border-pink-800 transition-colors"
          >
            <div className="flex items-start gap-4 pl-2">
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                <img
                  src={
                    user.photoURL ||
                    `https://ui-avatars.com/api/?name=${user.displayName}&background=000&color=fff`
                  }
                  className="w-full h-full object-cover"
                  alt=""
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate max-w-[140px] sm:max-w-xs">
                    {user.displayName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${user.role === "admin" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-zinc-100/50 text-zinc-500 dark:bg-zinc-800"}`}
                  >
                    {user.role}
                  </span>
                  {user.isBanned && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">
                      Banned
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  <span>{user.email}</span>
                  <span>•</span>
                  <span>IP: {user.ipAddress || "UNKNOWN"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setDetailModal({ isOpen: true, user })}
                className="flex items-center justify-center size-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                title="Profile"
              >
                <Icon name="user" className="text-zinc-600 dark:text-zinc-400 text-xs" />
              </button>
              <button
                onClick={() => toggleBan(user.uid, user.isBanned)}
                className={`flex items-center justify-center size-8 rounded-full transition-colors ${user.isBanned ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-red-50 text-red-500 hover:bg-red-100"}`}
                title={user.isBanned ? "Unban User" : "Ban User"}
              >
                <Icon name={user.isBanned ? "unlock" : "ban"} className="text-xs" />
              </button>
            </div>
          </motion.div>
        ))}
        {filteredUsers.length === 0 && (
          <div className="py-20 text-center text-zinc-400 font-bold tracking-normal text-xs">
            No users found
          </div>
        )}
      </div>

      <Modal
        zIndex={100}
        isOpen={detailModal.isOpen && detailModal.user !== null}
        onClose={() => setDetailModal({ isOpen: false, user: null })}
        title={detailModal.user?.displayName || "User Details"}
        subtitle={detailModal.user?.email || ""}
        animationType="scale"
        type="blur"
      >
        {detailModal.user && (
          <div className="flex-1 overflow-y-auto space-y-8">
            <div className="bg-zinc-50 dark:bg-[#1A1A1A] rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
              <h4 className="text-xs font-semibold tracking-normal text-zinc-900 dark:text-zinc-100 mb-6">
                Partner Management
              </h4>

              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between mb-8">
                <div>
                  <p className="text-sm font-medium text-zinc-500 mb-1">
                    Affiliate Status
                  </p>
                  {detailModal.user.isAffiliate ? (
                    <span className="px-3 py-1 bg-zinc-200 dark:bg-zinc-700 dark:bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900/10 text-zinc-950 dark:text-zinc-50 dark:text-zinc-800 dark:text-zinc-200 rounded-full text-xs font-bold tracking-normal border border-zinc-200 dark:border-zinc-800 dark:border-emerald-800/30">
                      Active Affiliate
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full text-xs font-bold tracking-normal border border-zinc-300 dark:border-zinc-700">
                      Not Enrolled
                    </span>
                  )}
                </div>
                {detailModal.user.isAffiliate ? (
                  <button
                    onClick={() => removeAffiliate(detailModal.user!.uid)}
                    className="px-5 py-2.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-full text-xs font-bold tracking-normal hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                  >
                    Remove Access
                  </button>
                ) : (
                  <button
                    onClick={() => addAffiliate(detailModal.user!.uid)}
                    className="px-5 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full text-xs font-bold tracking-normal hover:bg-zinc-800 dark:hover:bg-white transition-colors"
                  >
                    Grant Access
                  </button>
                )}
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
                <p className="text-sm font-medium text-zinc-500 mb-4">
                  Wallet Balance:{" "}
                  <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100 ml-2">
                    ৳{detailModal.user.walletBalance || 0}
                  </span>
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="number"
                    placeholder="Amount..."
                    value={customWalletAmount}
                    onChange={(e) => setCustomWalletAmount(e.target.value)}
                    className="flex-1 bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-700 px-4 py-3 rounded-xl text-sm font-medium outline-none text-zinc-900 dark:text-zinc-100"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (customWalletAmount)
                          updateWalletBalance(
                            detailModal.user!.uid,
                            (detailModal.user!.walletBalance || 0) +
                              Number(customWalletAmount),
                          );
                        setCustomWalletAmount("");
                      }}
                      className="px-5 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-full text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      + Add
                    </button>
                    <button
                      onClick={() => {
                        if (customWalletAmount)
                          updateWalletBalance(
                            detailModal.user!.uid,
                            (detailModal.user!.walletBalance || 0) -
                              Number(customWalletAmount),
                          );
                        setCustomWalletAmount("");
                      }}
                      className="px-5 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-full text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      - Sub
                    </button>
                    <button
                      onClick={() => {
                        if (customWalletAmount)
                          updateWalletBalance(
                            detailModal.user!.uid,
                            Number(customWalletAmount),
                          );
                        setCustomWalletAmount("");
                      }}
                      className="px-5 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full text-xs font-bold hover:bg-zinc-800 dark:hover:bg-white transition-colors"
                    >
                      Set
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold tracking-normal text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-4">
                Device & Session Data
              </h4>
              <div className="space-y-1">
                <DetailBit
                  label="IP Address"
                  value={detailModal.user.ipAddress}
                />
                <DetailBit label="ISP" value={detailModal.user.isp} />
                <DetailBit
                  label="Time Zone"
                  value={detailModal.user.timeZone}
                />
                <DetailBit label="OS" value={detailModal.user.osName} />
                <DetailBit
                  label="Browser"
                  value={detailModal.user.browserName}
                />
                <DetailBit
                  label="Location"
                  value={detailModal.user.locationName}
                />
                <DetailBit
                  label="Joined"
                  value={new Date(
                    detailModal.user.createdAt,
                  ).toLocaleString()}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const DetailBit = ({ label, value }: { label: string; value?: any }) => (
  <div className="flex justify-between items-center py-3 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 px-4 rounded-lg transition-colors mx-[-1rem]">
    <span className="text-[10px] font-medium text-zinc-500  tracking-normal">
      {label}
    </span>
    <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
      {value || "N/A"}
    </span>
  </div>
);

export default ManageUsers;
