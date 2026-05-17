import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNotify } from "../components/Notifications";
import { getFriendlyErrorMessage } from "../lib/firebaseErrorMapper";
import { AuthLayout, AuthSeparator } from "../components/AuthLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { AtSign, Lock, Eye, EyeOff, Loader2, User } from "lucide-react";

const SignUp: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const notify = useNotify();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree)
      return notify("Please agree to the Terms & Conditions", "error");

    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCred.user;
      await updateProfile(user, { displayName: name });

      try {
          const accountsStr = localStorage.getItem("vibe_saved_accounts");
          let accounts = accountsStr ? JSON.parse(accountsStr) : [];
          accounts = accounts.filter((a: any) => a.uid !== user.uid);
          accounts.push({
              uid: user.uid,
              email: user.email,
              password: password,
              displayName: name,
              photoURL: "",
              lastPasswordChange: null,
          });
          localStorage.setItem("vibe_saved_accounts", JSON.stringify(accounts));
      } catch (e) {}

      const userData = {
        uid: user.uid,
        email,
        displayName: name,
        role: "user",
        isBanned: false,
        createdAt: Date.now(),
        registrationDate: Date.now(),
        lastActive: Date.now(),
      };

      await setDoc(doc(db, "users", user.uid), userData);

      notify("Account created successfully!", "success");
      navigate("/");
    } catch (err: any) {
      notify(getFriendlyErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Start exploring premium gadgets today."
    >
      <form onSubmit={handleSignUp} className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Full Name
            </label>
            <div className="relative h-max">
              <Input
                placeholder="e.g. John Doe"
                className="peer ps-10 h-12 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3.5 peer-disabled:opacity-50">
                <User className="size-4" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Email Address
            </label>
            <div className="relative h-max">
              <Input
                placeholder="name@example.com"
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
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Password
            </label>
            <div className="relative h-max">
              <Input
                placeholder="At least 6 characters"
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

        <div className="flex items-center space-x-3 pt-2">
          <input
            type="checkbox"
            id="terms"
            className="w-4 h-4 accent-zinc-900 dark:accent-white bg-zinc-100 dark:bg-zinc-800 border-zinc-300 rounded focus:ring-zinc-900 dark:ring-zinc-100 focus:ring-2 cursor-pointer"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          <label
            htmlFor="terms"
            className="text-xs font-medium text-zinc-500 dark:text-zinc-400 cursor-pointer"
          >
            I agree to the{" "}
            <Link to="/terms" className="text-zinc-900 dark:text-zinc-100 font-semibold underline underline-offset-2">
              Terms & Conditions
            </Link>
          </label>
        </div>

        <Button
          disabled={loading}
          className="w-full h-12 mt-6 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl font-semibold shadow-lg shadow-black/20 dark:shadow-white/10"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {loading ? "Creating account..." : "Sign Up"}
        </Button>
      </form>

      <AuthSeparator text="ALREADY HAVE AN ACCOUNT?" />
      
      <Button 
        type="button" 
        variant="outline"
        className="w-full h-12 font-semibold border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md rounded-xl"
        onClick={() => navigate("/signin")}
      >
        Sign In Instead
      </Button>
    </AuthLayout>
  );
};

export default SignUp;
