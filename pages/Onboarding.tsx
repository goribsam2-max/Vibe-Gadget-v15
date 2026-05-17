import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const slides = [
  {
    image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=500",
    title: "Let's find the Best & Latest Gadgets",
    desc: "Discover premium quality electronics and mobile accessories tailored to your tech lifestyle.",
  },
  {
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=500",
    title: "Experience Seamless Delivery Monitoring",
    desc: "Track your orders in real-time and get updates instantly right at your doorstep.",
  },
  {
    image: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=500",
    title: "Explore Our Vast Gadget Products We Offer",
    desc: "Browse a huge variety of products from top brands and find the best deals every day.",
  },
  {
    image: "https://images.unsplash.com/photo-1601524909162-ae8725290836?q=80&w=500",
    title: "Build Your Exclusive Favorites List",
    desc: "Save the gadgets you love and create a personalized wishlist for easy shopping later.",
  },
];

const Onboarding: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const handleFinish = () => {
    localStorage.setItem("vibe_onboarded", "true");
    onFinish();
    navigate("/auth-selector");
  };

  const next = () => {
    if (current === slides.length - 1) {
      handleFinish();
    } else {
      setCurrent(current + 1);
    }
  };

  return (
    <div className="h-screen flex flex-col p-8 bg-zinc-50 dark:bg-zinc-800 max-w-md mx-auto">
      <div className="flex justify-end mb-6">
        <button
          onClick={handleFinish}
          className="text-xs font-bold tracking-normal text-zinc-400 hover:text-black dark:text-white transition-colors"
        >
          Skip
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full flex flex-col items-center"
          >
            <div className="w-full aspect-[4/5] bg-zinc-50 dark:bg-zinc-800 rounded-full mb-12 overflow-hidden shadow-sm shadow-zinc-100">
              <img src={slides[current].image} className="w-full h-full object-cover" alt="" />
            </div>
            <h1 className="text-xl font-semibold text-center mb-4 tracking-tight leading-none">
              {slides[current].title}
            </h1>
            <p className="text-zinc-500 text-sm text-center leading-relaxed mb-10 px-6 font-medium">
              {slides[current].desc}
            </p>
          </motion.div>
        </AnimatePresence>
        <div className="flex space-x-2 mb-10">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 \${i === current ? "w-8 bg-zinc-900" : "w-2 bg-zinc-200"}`}
            ></div>
          ))}
        </div>
      </div>
      <div className="space-y-4 w-full">
        <Button
          variant="primary"
          onClick={next}
          className="w-full shadow-sm shadow-black/10 py-5 text-sm tracking-normal"
        >
          {current === slides.length - 1 ? "Start Shopping" : "Continue"}
        </Button>

        {current === 0 && (
          <p className="text-center text-[10px] font-bold  tracking-normal text-zinc-400">
            Already a member?{" "}
            <button
              onClick={() => navigate("/signin")}
              className="text-black dark:text-white underline"
            >
              Sign In
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
