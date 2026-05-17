import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNotify } from "../components/Notifications";
import { getFriendlyErrorMessage } from "../lib/firebaseErrorMapper";
import { AuthLayout, AuthSeparator } from "../components/AuthLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { AtSign, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

const SignIn: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const notify = useNotify();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      // Save to Account Center
      try {
          const accountsStr = localStorage.getItem("vibe_saved_accounts");
          let accounts = accountsStr ? JSON.parse(accountsStr) : [];
          accounts = accounts.filter((a: any) => a.uid !== user.uid);
          accounts.push({
              uid: user.uid,
              email: user.email,
              password: password,
              displayName: user.displayName || "User",
              photoURL: user.photoURL || "",
              lastPasswordChange: null,
          });
          localStorage.setItem("vibe_saved_accounts", JSON.stringify(accounts));
      } catch (e) {
          console.error(e);
      }

      await setDoc(
        doc(db, "users", user.uid),
        { lastActive: Date.now() },
        { merge: true },
      );

      notify("Welcome back!", "success");
      navigate("/");
    } catch (err: any) {
      notify(getFriendlyErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your account to continue."
    >
      <form onSubmit={handleSignIn} className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Email Address
            </label>
            <div className="relative h-max">
              <Input
                placeholder="your.email@example.com"
                className="peer ps-10 h-12 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3.5 peer-disabled:opacity-50">
                <AtSign className="size-4" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-zinc-800 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative h-max">
              <Input
                placeholder="••••••••"
                className="peer ps-10 pe-10 h-12 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3.5 peer-disabled:opacity-50">
                <Lock className="size-4" aria-hidden="true" />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
        </div>

        <Button
          disabled={loading}
          className="w-full h-12 mt-6 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl font-semibold shadow-lg shadow-black/20 dark:shadow-white/10"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <AuthSeparator text="NEW HERE?" />
      
      <Button 
        type="button" 
        variant="outline"
        className="w-full h-12 font-semibold border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md rounded-xl"
        onClick={() => navigate("/signup")}
      >
        Create an Account
      </Button>
    </AuthLayout>
  );
};

export default SignIn;
