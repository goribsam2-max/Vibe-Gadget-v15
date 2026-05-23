import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { db, auth } from "../firebase";
import { useNotify } from "../components/Notifications";
import { Button } from "../components/ui/button";
import { AuthLayout, AuthSeparator } from "../components/AuthLayout";
import Icon from "../components/Icon";
import { GoogleIcon, AppleIcon, FacebookIcon } from "../components/ui/BrandIcons";

const AuthSelector: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [config, setConfig] = useState<any>({
    googleLogin: true,
    facebookLogin: true,
    appleLogin: true,
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "platform"), (snap) => {
      if (snap.exists()) {
        setConfig((prev: any) => ({ ...prev, ...snap.data() }));
      }
    });
    return unsub;
  }, []);

  const captureUserDetails = async (user: any) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      const ipRes = await fetch("https://api.ipify.org?format=json").catch(
        () => null,
      );
      const ipData = ipRes ? await ipRes.json() : { ip: "Unknown" };

      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || "Guest User",
          photoURL: user.photoURL || "",
          role: "user",
          isBanned: false,
          createdAt: Date.now(),
          registrationDate: Date.now(),
          ipAddress: ipData.ip,
          lastActive: Date.now(),
        });
      } else {
        await setDoc(
          userRef,
          {
            lastActive: Date.now(),
            ipAddress: ipData.ip,
          },
          { merge: true },
        );
      }
    } catch (e) {
      console.error("Profile error:", e);
    }
  };

  const handleSocialLogin = async (providerName: string, enabled: boolean) => {
    if (!enabled) {
      notify(`${providerName} login is currently disabled by admin.`, "info");
      return;
    }

    try {
      let provider;
      if (providerName === "Google") provider = new GoogleAuthProvider();
      else if (providerName === "Facebook")
        provider = new FacebookAuthProvider();
      else if (providerName === "Apple")
        provider = new OAuthProvider("apple.com");
      else return;

      const result = await signInWithPopup(auth, provider);
      await captureUserDetails(result.user);
      notify(`Welcome, ${result.user.displayName || "User"}!`, "success");
      navigate("/");
    } catch (err: any) {
      console.error(err);
      if (err.code !== "auth/popup-closed-by-user") {
        notify(err.message, "error");
      }
    }
  };

  return (
    <AuthLayout
      title="Sign In or Join Now!"
      subtitle="Login or create your VibeGadgets account."
    >
      <div className="space-y-3">
        <Button 
          type="button" 
          variant="outline"
          size="lg" 
          className="w-full justify-start px-4 bg-white dark:bg-zinc-900 shadow-sm"
          onClick={() => handleSocialLogin("Google", config.googleLogin)}
          disabled={!config.googleLogin}
        >
          <GoogleIcon className='h-5 w-5 mr-3 text-zinc-900 dark:text-white' />
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">Continue with Google</span>
        </Button>
          <Button 
            type="button" 
            variant="outline"
            size="lg" 
            className="w-full justify-start px-4 bg-white dark:bg-zinc-900 shadow-sm"
            onClick={() => handleSocialLogin("Facebook", config.facebookLogin)}
            disabled={!config.facebookLogin}
          >
            <FacebookIcon className='h-5 w-5 mr-3' />
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">Continue with Facebook</span>
          </Button>
        <Button 
          type="button" 
          variant="outline"
          size="lg" 
          className="w-full justify-start px-4 bg-white dark:bg-zinc-900 shadow-sm"
          onClick={() => handleSocialLogin("Apple", config.appleLogin)}
          disabled={!config.appleLogin}
        >
          <AppleIcon className='h-5 w-5 mr-3 text-black dark:text-white' />
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">Continue with Apple</span>
        </Button>
      </div>

      <AuthSeparator />

      <div className="space-y-4">
        <Button 
          type="button" 
          size="lg"
          className="w-full bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-semibold shadow-lg shadow-black/20 dark:shadow-white/10"
          onClick={() => navigate("/signup")}
        >
          Create New Account
        </Button>
        <Button 
          type="button" 
          variant="outline"
          size="lg"
          className="w-full font-semibold border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md hover:bg-white dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          onClick={() => navigate("/signin")}
        >
          Sign In with Email
        </Button>
      </div>

      <p className="text-muted-foreground mt-8 text-xs text-center">
        By clicking continue, you agree to our{' '}
        <a href="/terms" className="hover:text-zinc-900 dark:text-zinc-100 underline underline-offset-4">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/privacy" className="hover:text-zinc-900 dark:text-zinc-100 underline underline-offset-4">
          Privacy Policy
        </a>
        .
      </p>
    </AuthLayout>
  );
};

export default AuthSelector;
