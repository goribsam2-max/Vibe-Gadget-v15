import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotify } from "../components/Notifications";
import Icon from "../components/Icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { cn } from "@/lib/utils";

const ShippingAddress: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newAddress, setNewAddress] = useState({ name: "", phone: "", altPhone: "", address: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth.currentUser) {
      getDoc(doc(db, "users", auth.currentUser.uid)).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.addresses && Array.isArray(data.addresses)) {
            setSavedAddresses(data.addresses);
            if (data.addresses.length > 0) setSelectedAddressId(data.addresses[0].id);
          }
        }
        setLoading(false);
      });
    } else {
      const localAddresses = JSON.parse(localStorage.getItem("vibe_shipping_addresses_v2") || "[]");
      setSavedAddresses(localAddresses);
      if (localAddresses.length > 0) setSelectedAddressId(localAddresses[0].id);
      setLoading(false);
    }
  }, []);

  const handleAdd = async () => {
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
        setIsAdding(false);
        setNewAddress({ name: "", phone: "", altPhone: "", address: "" });
        notify("Address saved!", "success");
      } catch (e) {
        notify("Error saving address.", "error");
      }
    } else {
      const newAddrs = [...savedAddresses, newAddrObj];
      setSavedAddresses(newAddrs);
      setSelectedAddressId(newAddrObj.id);
      setIsAdding(false);
      localStorage.setItem("vibe_shipping_addresses_v2", JSON.stringify(newAddrs));
      notify("Address saved Locally!", "success");
    }
  };

  const handleRemove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newAddrs = savedAddresses.filter(a => a.id !== id);
    if (auth.currentUser) {
       try {
         await updateDoc(doc(db, "users", auth.currentUser.uid), { addresses: newAddrs });
         setSavedAddresses(newAddrs);
         if (selectedAddressId === id) setSelectedAddressId(newAddrs.length > 0 ? newAddrs[0].id : null);
         notify("Address removed", "success");
       } catch(e) {
         notify("Error removing address", "error");
       }
    } else {
       setSavedAddresses(newAddrs);
       if (selectedAddressId === id) setSelectedAddressId(newAddrs.length > 0 ? newAddrs[0].id : null);
       localStorage.setItem("vibe_shipping_addresses_v2", JSON.stringify(newAddrs));
    }
  };

  if (loading) return null;

  return (
    <div className="p-6 animate-fade-in min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-800 max-w-lg mx-auto">
      <div className="space-y-6 flex-1">
        {savedAddresses.length > 0 && !isAdding ? (
          <div className="space-y-4">
             {savedAddresses.map((addr) => (
                <div
                  key={addr.id}
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={cn(
                    "p-4 rounded-2xl border-2 cursor-pointer transition-all bg-white dark:bg-zinc-900",
                    selectedAddressId === addr.id 
                      ? "border-zinc-900 dark:border-zinc-100 shadow-sm" 
                      : "border-transparent border-zinc-200 dark:border-zinc-800 opacity-70 hover:opacity-100"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", selectedAddressId === addr.id ? "border-zinc-900 dark:border-zinc-100" : "border-zinc-300")}>
                        {selectedAddressId === addr.id && <div className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-zinc-100" />}
                      </div>
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100">{addr.name}</h4>
                    </div>
                    <button onClick={(e) => handleRemove(addr.id, e)} className="text-[10px] uppercase font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded">Remove</button>
                  </div>
                  <div className="pl-7">
                    <p className="text-sm font-medium text-zinc-500">{addr.phone}</p>
                    <p className="text-sm mt-1 text-zinc-700 dark:text-zinc-300">{addr.address}</p>
                  </div>
                </div>
             ))}
             <Button variant="outline" className="w-full border-dashed py-6" onClick={() => setIsAdding(true)}>+ Add New Address</Button>
          </div>
        ) : !isAdding && (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <Icon
              name="map-marker"
              className="text-lg mb-4 text-zinc-900 dark:text-zinc-100"
            />
            <p className="text-sm font-bold tracking-tight">
              No address saved.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => setIsAdding(true)}>+ Add Delivery Address</Button>
          </div>
        )}

        {isAdding && (
          <div className="flex flex-col gap-4 animate-fade-in bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input placeholder="E.g. John Doe" value={newAddress.name} onChange={(e) => setNewAddress({...newAddress, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input placeholder="01XXXXXXXXX" value={newAddress.phone} onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Detailed Address *</Label>
              <Input placeholder="House, Road, Block, Area..." value={newAddress.address} onChange={(e) => setNewAddress({...newAddress, address: e.target.value})} />
            </div>
            <div className="flex space-x-3 mt-4">
              <Button
                onClick={handleAdd}
                className="flex-1 tracking-normal py-6"
              >
                Save
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsAdding(false)}
                className="py-6 px-6"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      <Button
        onClick={() => navigate("/checkout")}
        disabled={!selectedAddressId}
        className="w-full mt-10 shadow-sm shadow-black/20 disabled:opacity-50 tracking-normal py-6 rounded-2xl text-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900"
      >
        Proceed to Checkout
      </Button>
    </div>
  );
};

export default ShippingAddress;
