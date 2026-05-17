"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  ShoppingBag,
  Bell,
  Heart
} from "lucide-react";
import { auth } from "@/firebase";
import { signOut, User as FirebaseUser } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function AccountMenu() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("f_cart");
    navigate("/auth-selector");
  };

  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-transparent px-2 md:px-4 py-2 font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <User className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
          {user && <span className="inline-block max-w-[80px] md:max-w-[100px] truncate text-sm">{displayName}</span>}
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg p-2 z-[9999]">
        {!user ? (
          <>
            <DropdownMenuLabel className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Welcome
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigate("/auth-selector")} className="flex items-center gap-2 py-2 px-2 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <span className="flex-1 font-medium">Sign In / Sign Up</span>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              My Account
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigate("/profile")} className="flex items-center gap-2 rounded-lg py-2 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
              <User className="w-4 h-4" />
              <span className="flex-1">Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/orders")} className="flex items-center gap-2 rounded-lg py-2 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
              <ShoppingBag className="w-4 h-4" />
              <span className="flex-1">My Orders</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/wishlist")} className="flex items-center gap-2 rounded-lg py-2 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
              <Heart className="w-4 h-4" />
              <span className="flex-1">Wishlist</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/notifications")} className="flex items-center gap-2 rounded-lg py-2 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="flex-1">Notifications</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1 border-zinc-100 dark:border-zinc-800" />

            <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 cursor-pointer">
              <LogOut className="w-4 h-4" />
              <span className="flex-1 font-medium">Log out</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
