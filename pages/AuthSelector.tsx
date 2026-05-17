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

export const GoogleIcon = (props: React.ComponentProps<'svg'>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="currentColor"
		{...props}
	>
		<g>
			<path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669   C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62   c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401   c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" />
		</g>
	</svg>
);

export const AppleIcon = (props: React.ComponentProps<'svg'>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="currentColor"
		{...props}
	>
		<path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.126 3.805 3.076 1.52-.05 2.08-.96 3.916-.96 1.815 0 2.336.96 3.936.927 1.638-.033 2.65-1.545 3.636-2.993 1.134-1.658 1.603-3.266 1.625-3.348-.035-.015-3.138-1.205-3.167-4.793-.024-3.003 2.457-4.469 2.573-4.542-1.404-2.05-3.565-2.33-4.32-2.385-1.848-.124-3.692 1.144-4.636 1.144zm-.952-4.96c1.025-1.242 1.716-2.966 1.53-4.68-.152.062-1.933.268-3.018 1.454-.963 1.054-1.764 2.812-1.544 4.498 1.764.137 3.004-.848 3.032-.828z" />
	</svg>
);

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
          <Icon name="facebook-f" className='h-5 w-5 mr-3 text-[#1877F2]' />
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
