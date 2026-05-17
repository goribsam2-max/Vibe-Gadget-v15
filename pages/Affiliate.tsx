import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  onSnapshot,
  addDoc,
} from "firebase/firestore";
import { UserProfile, AffiliateLog } from "../types";
import { AffiliateOnboardingForm, AffiliateFormData } from "../components/AffiliateOnboardingForm";
import Icon from "../components/Icon";
import { useNotify } from "../components/Notifications";
import {
  sendAffiliateRequestToTelegram,
  sendCreatorVideoToTelegram,
} from "../services/telegram";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "../components/ThemeContext";
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, TrendingUp, Eye, RefreshCw, ArrowDown, ArrowUp, ArrowLeftRight, Clock, Bitcoin, Link as LinkIcon, Gift, LayoutDashboard, Presentation, Loader2 } from "lucide-react"

import { DiscreteTabs, TabItem } from "../components/ui/discrete-tab";
import { TourProvider, TourAlertDialog, useTour } from "@/components/ui/tour";

// GIF Generator
import { generateStickerGif } from "../components/GifGenerator";

const AffiliateTourSteps = () => {
    const { setSteps } = useTour();
    useEffect(() => {
        setSteps([
            {
                selectorId: "affiliate-wallet",
                content: (
                    <div className="space-y-2">
                        <h3 className="font-bold text-lg">My Balance</h3>
                        <p className="text-sm text-zinc-500">View your current withdrawal balance and total earnings from affiliates.</p>
                    </div>
                ),
                position: "bottom"
            },
            {
                selectorId: "affiliate-link",
                content: (
                    <div className="space-y-2">
                        <h3 className="font-bold text-lg">Referral Link</h3>
                        <p className="text-sm text-zinc-500">Copy this link and share it to earn commissions on every successful order!</p>
                    </div>
                ),
                position: "bottom"
            },
            {
                selectorId: "affiliate-history",
                content: (
                    <div className="space-y-2">
                        <h3 className="font-bold text-lg">Transaction History</h3>
                        <p className="text-sm text-zinc-500">Monitor all click events, signups and earnings from your affiliates in real-time.</p>
                    </div>
                ),
                position: "top"
            }
        ]);
    }, [setSteps]);
    return null;
};

const tabsData: TabItem[] = [
  { id: "dashboard", title: "Dashboard", icon: LayoutDashboard as any },
  { id: "creator_hub", title: "Creator Hub", icon: Presentation as any },
  { id: "small_creators", title: "Small Creators", icon: Gift as any },
];

const SmallCreatorsHub: React.FC<{ userData: UserProfile }> = ({ userData }) => {
  const notify = useNotify();
  const [colorScheme, setColorScheme] = useState<"black" | "white">("white");
  const [submitting, setSubmitting] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  
  const [generatingGif, setGeneratingGif] = useState<string | null>(null);
  const [gifProgress, setGifProgress] = useState(0);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [generatedName, setGeneratedName] = useState("");

  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl) return notify("Please enter the video URL", "error");

    setSubmitting(true);
    try {
      const data = {
        userId: userData.uid,
        userName: userData.displayName || "Unknown",
        userCode: userData.affiliateCode || "",
        platform: "small_creator",
        videoUrl,
        rewardAmount: 10,
        status: "pending",
        createdAt: Date.now(),
      };
      await addDoc(collection(db, "creator_videos"), data);

      await sendCreatorVideoToTelegram(data);

      notify("Video submitted for review successfully!", "success");
      setVideoUrl("");
    } catch (err) {
      console.error(err);
      notify("Failed to submit video", "error");
    }
    setSubmitting(false);
  };

  const handleDownload = async (stId: string, fileName: string) => {
    try {
      setGeneratingGif(stId);
      setGifProgress(0);
      setGeneratedUrl(null);
      setGeneratedName(fileName);

      const url = await generateStickerGif(stId, colorScheme, (p) => {
        setGifProgress(Math.round(p * 100));
      });

      setGeneratedUrl(url);
      setGeneratingGif(null);

      // Attempt auto-download (might gracefully fail on mobile webviews, hence the modal)
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to generate GIF:", err);
      notify("Failed to generate animated GIF", "error");
      setGeneratingGif(null);
    }
  };

  const textColor = colorScheme === "black" ? "#ffffff" : "#000000";
  const bgColor = colorScheme === "black" ? "#000000" : "#ffffff";

  const handleShareOrDownload = async () => {
    if (!generatedUrl) return;
    try {
      if (navigator.share && navigator.canShare) {
        // Build blob synchronously to preserve user interaction gesture
        const byteString = atob(generatedUrl.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: 'image/gif' });
        const file = new File([blob], generatedName, { type: 'image/gif' });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Vibe Gadget Sticker",
          });
          return;
        }
      }
    } catch (e) {
      console.warn("Share failed:", e);
    }

    // Fallback manual download
    const link = document.createElement("a");
    link.href = generatedUrl;
    link.download = generatedName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stickers = [
    {
      id: "flash_sale",
      title: "Flash Sale (Neon)",
      desc: "Neon glowing flash sale badge",
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="100%" height="100%">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;900&amp;display=swap');
          @keyframes glow { 0%, 100% { filter: drop-shadow(0 0 10px #ec4899); transform: scale(1); } 50% { filter: drop-shadow(0 0 25px #ec4899) drop-shadow(0 0 10px #ec4899); transform: scale(1.05); } }
          .fst { animation: glow 2s ease-in-out infinite; transform-origin: center; }
          .t1 { font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 45px; fill: #ec4899; }
          .t2 { font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 45px; fill: ${textColor}; }
          .t3 { font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 16px; fill: #f97316; }
        </style>
        <g class="fst">
          <rect x="30" y="30" width="260" height="260" rx="40" fill="${bgColor}" stroke="#ec4899" stroke-width="6" />
          <text x="160" y="130" text-anchor="middle" class="t1">FLASH</text>
          <text x="160" y="180" text-anchor="middle" class="t2">SALE</text>
          <text x="160" y="230" text-anchor="middle" class="t3">VIBE GADGET</text>
        </g>
      </svg>`,
    },
    {
      id: "discount_tag",
      title: "Extra 5% OFF (Pro)",
      desc: "Premium luxury discount badge",
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="100%" height="100%">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&amp;display=swap');
          @keyframes floatTag { 0%, 100% { transform: translateY(0); filter: drop-shadow(0 15px 20px rgba(139,92,246,0.4)); } 50% { transform: translateY(-10px); filter: drop-shadow(0 25px 25px rgba(139,92,246,0.5)); } }
          .dct { animation: floatTag 3s ease-in-out infinite; transform-origin: center; }
          .t1 { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 24px; fill: ${textColor}; }
          .t2 { font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 65px; fill: url(#grad); }
          .t3 { font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 16px; fill: #8b5cf6; }
        </style>
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#8b5cf6"/>
            <stop offset="100%" stop-color="#3b82f6"/>
          </linearGradient>
        </defs>
        <g class="dct">
          <circle cx="160" cy="160" r="130" fill="${bgColor}" stroke="url(#grad)" stroke-width="8" />
          <text x="160" y="125" text-anchor="middle" class="t1">EXTRA</text>
          <text x="160" y="195" text-anchor="middle" class="t2">5%</text>
          <text x="160" y="240" text-anchor="middle" class="t3">DISCOUNT</text>
        </g>
      </svg>`,
    },
    {
      id: "trusted_brand",
      title: "Trusted Store",
      desc: "Minimalist clean trust badge",
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="100%" height="100%">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@800;900&amp;display=swap');
          @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }
          .bg-hex { animation: rotate 20s linear infinite; transform-origin: 160px 160px; }
          .tbl { animation: pulse 2s ease-in-out infinite; transform-origin: center; }
          .t1 { font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 40px; fill: ${textColor}; }
          .t2 { font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 40px; fill: #10b981; }
          .t3 { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 16px; fill: ${textColor}; }
        </style>
        <g class="tbl">
          <g class="bg-hex">
            <polygon points="160,20 281.24,90 281.24,230 160,300 38.76,230 38.76,90" fill="${bgColor}" stroke="#10b981" stroke-width="5" />
            <polygon points="160,35 268.25,97.5 268.25,222.5 160,285 51.75,222.5 51.75,97.5" fill="none" stroke="#10b981" stroke-width="2" stroke-dasharray="10 10" />
          </g>
          <text x="160" y="145" text-anchor="middle" class="t1">TRUSTED</text>
          <text x="160" y="185" text-anchor="middle" class="t2">STORE</text>
          <text x="160" y="235" text-anchor="middle" class="t3">VIBE GADGET</text>
        </g>
      </svg>`,
    },
    {
      id: "new_arrival",
      title: "New Arrival",
      desc: "Trendy new gadget spotlight",
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="100%" height="100%">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;900&amp;display=swap');
          @keyframes spin { 100% { transform: rotate(360deg); } }
          @keyframes bop { 0%, 100% { transform: scale(1); filter: drop-shadow(0 0 15px rgba(234,179,8,0.3)); } 50% { transform: scale(1.05); filter: drop-shadow(0 0 25px rgba(234,179,8,0.6)); } }
          .naring { animation: spin 10s linear infinite; transform-origin: 160px 160px; }
          .nabop { animation: bop 1s ease-in-out infinite; transform-origin: center; }
          .t1 { font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 45px; fill: #eab308; }
          .t2 { font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 45px; fill: ${textColor}; }
          .t3 { font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 16px; fill: #ca8a04; }
        </style>
        <g>
          <circle cx="160" cy="160" r="140" fill="none" stroke="#eab308" stroke-width="4" stroke-dasharray="20 20" class="naring" />
          <g class="nabop">
            <circle cx="160" cy="160" r="120" fill="${bgColor}" />
            <text x="160" y="145" text-anchor="middle" class="t1">NEW</text>
            <text x="160" y="185" text-anchor="middle" class="t2">ARRIVAL</text>
            <text x="160" y="235" text-anchor="middle" class="t3">LATEST VIBE</text>
          </g>
        </g>
      </svg>`,
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in relative z-10 w-full">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-xl">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 blur-3xl rounded-full pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 blur-3xl rounded-full pointer-events-none -translate-x-1/2 translate-y-1/2"></div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Earn with Vibe Gadget! 🚀
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed">
                Put these custom animated stickers on your videos (Facebook, TikTok, YouTube). 
                Add our website link to your video description or comment section. 
                <strong className="text-zinc-900 dark:text-zinc-100 block mt-2 px-3 py-2 bg-pink-50 dark:bg-pink-900/30 rounded-lg w-max border border-pink-100 dark:border-pink-800/30">
                  🎁 You will get ৳10 for every 1k views!
                </strong>
              </p>
            </div>
            
            <div className="shrink-0 bg-zinc-50 dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Customize Sticker Color
              </label>
              <div className="flex bg-zinc-200 dark:bg-zinc-800 rounded-lg p-1">
                <button 
                  onClick={() => setColorScheme('white')}
                  className={`flex-1 py-1 px-4 text-xs font-semibold rounded-md transition-all ${colorScheme === 'white' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                >
                  Light
                </button>
                <button 
                  onClick={() => setColorScheme('black')}
                  className={`flex-1 py-1 px-4 text-xs font-semibold rounded-md transition-all ${colorScheme === 'black' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                >
                  Dark
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 text-center">
            {stickers.map((st) => (
               <div key={st.id} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 flex flex-col items-center justify-between group shadow-sm relative overflow-hidden transition-all hover:shadow-md">
                 <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 
                 <div 
                   className="w-32 h-32 md:w-36 md:h-36 mb-4 filter drop-shadow-md relative z-10 flex shrink-0 items-center justify-center"
                   dangerouslySetInnerHTML={{ __html: st.svg }}
                 ></div>
                 
                 <div className="flex-1 flex flex-col justify-end w-full">
                   <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm md:text-base mb-1">{st.title}</h3>
                   <p className="text-[11px] md:text-xs text-zinc-500 mb-4 px-2 line-clamp-2 leading-tight">
                     "{st.desc}"
                   </p>
                   <button 
                     onClick={() => handleDownload(st.id, `vibe-${st.id}.gif`)}
                     disabled={generatingGif === st.id}
                     type="button"
                     className="inline-flex items-center justify-center bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold py-2.5 px-4 rounded-xl w-full hover:scale-105 active:scale-95 transition-transform shadow-md disabled:opacity-50 disabled:scale-100"
                   >
                     {generatingGif === st.id ? (
                       <><Loader2 className="mr-1.5 w-[14px] h-[14px] animate-spin" /> Generating...</>
                     ) : (
                       <><Icon name="download" className="mr-1.5" style={{ width: '14px', height: '14px' }} /> Download GIF</>
                     )}
                   </button>
                 </div>
               </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-3xl p-6 flex flex-col justify-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900 flex items-center justify-center shrink-0 shadow-inner">
                <Icon name="info-circle" className="text-orange-500 text-xl" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-base mb-2">How to claim your reward?</h4>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-4">
                  Once your video reaches at least <strong>1,000 views</strong>, submit its link in the form. Our team will verify the video view count and check if our website link is in the description/comment, then instantly add the money to your Wallet!
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold bg-orange-100/50 dark:bg-orange-900/30 px-3 py-2 rounded-lg inline-block">
                  Note: Payout is ৳10 per 1k views. Unlimited videos allowed!
                </p>
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
               <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                 <Icon name="video" className="text-zinc-500" />
                 Submit Your Video
               </h4>
               <form onSubmit={handleVideoSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                      Video URL (TikTok/YouTube/Facebook)
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="e.g. https://tiktok.com/@profile/video/123"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 block text-sm font-medium outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
                    />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 h-12 rounded-xl mt-2 relative overflow-hidden group">
                    <span className="relative z-10 flex items-center justify-center font-bold">
                      {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      {submitting ? "Submitting Request..." : "Send Request For Review"}
                    </span>
                  </Button>
               </form>
            </div>
          </div>

        </div>
      </div>

      {/* Generation Modal overlay */}
      {(generatingGif || generatedUrl) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl scale-in-center overflow-hidden relative">
            {generatingGif ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-16 h-16 mb-6 relative">
                  <div className="absolute inset-0 border-4 border-pink-100 dark:border-pink-900/30 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-pink-500 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Rendering Premium GIF...</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-[200px] mb-4">
                  Please wait, rendering frame by frame for max quality.
                </p>
                <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-pink-500 rounded-full transition-all duration-200" style={{ width: `${gifProgress}%` }}></div>
                </div>
                <p className="text-xs font-bold mt-2 text-zinc-400">{gifProgress}%</p>
              </div>
            ) : generatedUrl ? (
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-4">
                  <Icon name="check" className="text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Your GIF is Ready!</h3>
                <div className="w-48 h-48 bg-zinc-100 dark:bg-zinc-800 rounded-2xl overflow-hidden mb-4 relative drop-shadow-md select-auto">
                   <img src={generatedUrl} className="w-full h-full object-contain select-auto pointer-events-auto" style={{ WebkitTouchCallout: 'default' }} alt="Generated Sticker" />
                </div>
                
                <p className="text-[11px] text-orange-600 dark:text-orange-400 font-medium mb-6 bg-orange-50 dark:bg-orange-950/40 p-2 rounded-lg border border-orange-200 dark:border-orange-900/50 leading-relaxed">
                  If the download didn't start, <strong>Long press</strong> or <strong>Right click</strong> the image above and choose "Save Image".
                </p>
                
                <div className="flex flex-col gap-3 w-full">
                  <Button 
                    onClick={handleShareOrDownload}
                    className="w-full rounded-xl h-11 text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 inline-flex items-center justify-center font-medium shadow-sm transition-colors text-sm"
                  >
                    <Icon name="share" className="mr-2" /> Share GIF
                  </Button>
                  <div className="flex gap-3 w-full">
                    <Button 
                      onClick={() => {
                        setGeneratedUrl(null);
                        setGeneratedName("");
                      }}
                      variant="outline"
                      className="flex-1 rounded-xl h-11"
                    >
                      Close
                    </Button>
                    <a 
                      href={generatedUrl}
                      download={generatedName}
                      className="flex-1 rounded-xl h-11 text-zinc-900 border border-zinc-200 hover:bg-zinc-100 dark:text-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800 inline-flex items-center justify-center font-medium shadow-sm transition-colors text-sm bg-white dark:bg-zinc-900"
                    >
                      <Icon name="download" className="mr-2" /> Download
                    </a>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

const CreatorHub: React.FC<{ userData: UserProfile }> = ({ userData }) => {
  const notify = useNotify();
  const [platform, setPlatform] = useState("youtube");
  const [videoUrl, setVideoUrl] = useState("");
  const [channelUrl, setChannelUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "creator_videos"),
      where("userId", "==", userData.uid),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const v: any[] = [];
      snapshot.forEach((d) => v.push({ id: d.id, ...d.data() }));
      setHistory(v);
    }, (error) => {
      console.error("Error fetching creator_videos", error);
    });
    return () => unsub();
  }, [userData]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelUrl) return notify("Please enter your channel link", "error");

    setSubmitting(true);
    try {
      await updateDoc(doc(db, "users", userData.uid), {
        creatorStatus: "pending",
        creatorApplyDate: Date.now(),
      });
      await addDoc(collection(db, "creator_requests"), {
        userId: userData.uid,
        userName: userData.displayName || "Unknown",
        email: userData.email,
        channelUrl,
        platform,
        status: "pending",
        createdAt: Date.now(),
      });
      notify("Application submitted for review!", "success");
      setChannelUrl("");
    } catch (err) {
      console.error(err);
      notify("Failed to submit application", "error");
    }
    setSubmitting(false);
  };

  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl) return notify("Please enter the video URL", "error");

    setSubmitting(true);
    let reward = 0;
    if (platform === "youtube") reward = 100;
    if (platform === "facebook") reward = 150;
    if (platform === "tiktok") reward = 200;

    try {
      const data = {
        userId: userData.uid,
        userName: userData.displayName || "Unknown",
        userCode: userData.affiliateCode || "",
        platform,
        videoUrl,
        rewardAmount: reward,
        status: "pending",
        createdAt: Date.now(),
      };
      await addDoc(collection(db, "creator_videos"), data);

      // Send to Telegram
      await sendCreatorVideoToTelegram(data);

      notify("Video submitted for review successfully!", "success");
      setVideoUrl("");
    } catch (err) {
      console.error(err);
      notify("Failed to submit video", "error");
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8">
        <h2 className="text-xl font-semibold tracking-tight mb-4 flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
          <Icon name="video" className="text-zinc-500" /> Content Creator Hub
        </h2>
        <div className="bg-zinc-50 dark:bg-[#121212] p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 mb-6">
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-3">
            Rules & Guidelines
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-zinc-600 dark:text-zinc-400 text-sm">
            <li>
              <strong>Eligibility:</strong> YouTube (1k+ subscribers), Facebook (5k+ followers), TikTok (10k+ followers).
            </li>
            <li>
              <strong>YouTube:</strong> Minimum 1000 views to get ৳100.
            </li>
            <li>
              <strong>Facebook:</strong> Minimum 1000 views to get ৳150.
            </li>
            <li>
              <strong>TikTok:</strong> Minimum 5000 views to get ৳200.
            </li>
            <li>
              Video must explicitly mention that{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                Vibe Gadget
              </span>{" "}
              is sponsoring the video.
            </li>
            <li>
              Description must include our website link:{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                https://www.vibegadgets.shop
              </span>
            </li>
            <li>
              You must talk about Vibe Gadget products & features for at least{" "}
              <strong>1 minute</strong>.
            </li>
            <li>
              No limit! You can submit an unlimited number of videos as long as
              they meet the target.
            </li>
          </ul>
        </div>

        {userData.creatorStatus === 'approved' ? (
          <form onSubmit={handleVideoSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                Social Media Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-[#121212] px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 block text-sm font-medium outline-none"
              >
                <option className="bg-white dark:bg-black" value="youtube">YouTube (Min 1000 views - ৳100)</option>
                <option className="bg-white dark:bg-black" value="facebook">Facebook (Min 1000 views - ৳150)</option>
                <option className="bg-white dark:bg-black" value="tiktok">TikTok (Min 5000 views - ৳200)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                Video URL
              </label>
              <input
                type="url"
                required
                placeholder={
                  platform === 'youtube' ? "https://youtube.com/watch?v=..." :
                  platform === 'facebook' ? "https://facebook.com/.../videos/..." :
                  platform === 'tiktok' ? "https://tiktok.com/@profile/video/..." :
                  "https://..."
                }
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-[#121212] px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 block text-sm font-medium outline-none"
              />
            </div>
            <div>
              <Button type="submit" disabled={submitting} className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200">
                {submitting ? "Submitting..." : "Submit Video For Review"}
              </Button>
            </div>
          </form>
        ) : userData.creatorStatus === 'pending' ? (
           <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-2xl text-center">
             <Icon name="clock" className="text-4xl text-zinc-400 mb-2" />
             <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Application Under Review</h3>
             <p className="text-sm text-zinc-500 mt-2">We are reviewing your channel/page to ensure it meets our guidelines. Please check back later.</p>
           </div>
        ) : userData.creatorStatus === 'rejected' ? (
           <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl text-center border border-red-200 dark:border-red-800/30">
             <Icon name="times-circle" className="text-4xl text-red-500 mb-2" />
             <h3 className="font-semibold text-red-700 dark:text-red-400">Application Not Approved</h3>
             <p className="text-sm text-red-600 dark:text-red-400 mt-2">Unfortunately, your application was not approved. <br/><strong>Reason:</strong> {userData.creatorRejectReason || "Did not meet follower/subscriber criteria."}</p>
             {userData.creatorApplyDate && Date.now() - userData.creatorApplyDate > 24 * 60 * 60 * 1000 ? (
               <Button onClick={async () => await updateDoc(doc(db, "users", userData.uid), { creatorStatus: "none" })} variant="outline" className="mt-4">
                 Re-apply Now
               </Button>
             ) : (
               <p className="text-xs text-zinc-500 mt-4">You can re-apply after 24 hours.</p>
             )}
           </div>
        ) : (
          <form onSubmit={handleApply} className="space-y-4">
             <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                Channel / Page Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-[#121212] px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 block text-sm font-medium outline-none"
              >
                <option className="bg-white dark:bg-black" value="youtube">YouTube Channel (1k+ Subs)</option>
                <option className="bg-white dark:bg-black" value="facebook">Facebook Page/Profile (5k+ Followers)</option>
                <option className="bg-white dark:bg-black" value="tiktok">TikTok ID (10k+ Followers)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                Channel/Page/Profile URL
              </label>
              <input
                type="url"
                required
                placeholder={
                  platform === 'youtube' ? "https://youtube.com/@channel" :
                  platform === 'facebook' ? "https://facebook.com/page" :
                  platform === 'tiktok' ? "https://tiktok.com/@profile" :
                  "https://..."
                }
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-[#121212] px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 block text-sm font-medium outline-none"
              />
            </div>
            <div>
              <Button type="submit" disabled={submitting} className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 block h-12 rounded-xl">
                {submitting ? "Applying..." : "Apply for Creator Hub"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ... existing imports ...
const AffiliatePage: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [userData, setUserData] = useState<UserProfile | any>({});
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any>({});
  const [formData, setFormData] = useState({ fullName: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("menu");
  const [tempCode, setTempCode] = useState("");
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [savingCode, setSavingCode] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [showTour, setShowTour] = useState(true);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const unsubUser = onSnapshot(doc(db, "users", user.uid), (snap) => {
          if (snap.exists()) {
            setUserData({ uid: snap.id, ...snap.data() });
          } else {
            setUserData({ uid: user.uid, email: user.email, isAffiliate: false });
          }
          setLoading(false);
        });

        const qLogs = query(
          collection(db, "affiliate_logs"),
          where("affiliateId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const unsubLogs = onSnapshot(qLogs, (snap) => {
          setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }, (error) => {
          console.error("Error fetching affiliate_logs", error);
        });

        return () => {
          unsubUser();
          unsubLogs();
        };
      } else {
        setLoading(false);
        navigate("/auth-selector");
      }
    });

    const unsubConfig = onSnapshot(doc(db, "settings", "global"), (snap) => {
      if (snap.exists()) {
        setConfigs(snap.data());
      }
    });

    return () => {
      unsubAuth();
      unsubConfig();
    };
  }, [navigate]);

  const handleApplyAffiliate = async (data: any) => {
    if (!userData.uid) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, "users", userData.uid), {
        isAffiliateReview: true,
        affiliateStatus: "pending",
        fullName: data.fullName,
        phone: data.phone,
      });
      await addDoc(collection(db, "affiliate_requests"), {
        userId: userData.uid,
        email: userData.email,
        fullName: data.fullName,
        phone: data.phone,
        socialUrl: data.socialUrl,
        platform: data.platform,
        followerCount: data.followerCount,
        promotionMethod: data.promotionMethod,
        additionalInfo: data.additionalInfo,
        status: "pending",
        createdAt: Date.now(),
      });
      await sendAffiliateRequestToTelegram({
        userId: userData.uid,
        userName: data.fullName,
        fullName: data.fullName,
        phone: data.phone,
        email: userData.email || "",
        socialUrl: data.socialUrl,
        platform: data.platform,
        followerCount: data.followerCount,
        promotionMethod: data.promotionMethod,
        additionalInfo: data.additionalInfo,
        createdAt: Date.now(),
      });
      notify("Request submitted successfully", "success");
    } catch (err) {
      console.error(err);
      notify("Failed to submit request", "error");
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="flex bg-background items-center justify-center min-h-screen text-foreground">Loading...</div>;
  }

  if (!userData?.uid) {
    return (
      <div className="flex bg-background items-center justify-center min-h-screen text-foreground">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (userData.affiliateStatus === "pending") {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 min-h-screen bg-background text-foreground text-center relative">
        <div className="flex items-center space-x-6 mb-10 text-left">
          <button
            onClick={() => navigate("/profile")}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition"
          >
            <Icon name="arrow-left" />
          </button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Partner Program
            </h1>
            <p className="text-[9px] font-bold text-zinc-800 dark:text-zinc-200/70  tracking-normal mt-1 pl-1">
              Application Status
            </p>
          </div>
        </div>
        <div className="pt-20">
          <h2 className="text-xl font-semibold mb-4">Your request is under review</h2>
          <p className="text-zinc-500">We will notify you once your application has been processed.</p>
        </div>
      </div>
    );
  }

  if (!userData.isAffiliate) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 min-h-screen bg-background text-foreground font-sans relative overflow-hidden">
        <div className="flex items-center space-x-6 mb-10">
          <button
            onClick={() => navigate("/profile")}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition"
          >
            <Icon name="arrow-left" />
          </button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Partner Program
            </h1>
            <p className="text-[9px] font-bold text-zinc-800 dark:text-zinc-200/70  tracking-normal mt-1 pl-1">
              Apply Now
            </p>
          </div>
        </div>

        <div className="mb-10 text-center md:text-left">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mb-3">
              Partner & Earn
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-relaxed max-w-xl">
              Join our exclusive network. Share your custom promo code to give
              your audience 5% OFF, and earn up to{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                ৳200 commission
              </span>{" "}
              for every successful sale directly to your wallet based on your
              tier!
            </p>
          </div>

          <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-zinc-900 p-6 flex flex-col items-start gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <div>
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-2 tracking-tight">
                  5% Flat Discount
                </h3>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                  Your audience gets a flat discount on every purchase using
                  your code.
                </p>
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-6 flex flex-col items-start gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <div>
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-2 tracking-tight">
                  Tiered Commission
                </h3>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                  The more you sell, the more you earn. Reach higher tiers for
                  up to ৳200 per sale.
                </p>
              </div>
            </div>
          </div>

          <AffiliateOnboardingForm
            initialData={{
              fullName: formData.fullName,
              phone: formData.phone,
              email: userData.email || "",
            }}
            onSubmit={handleApplyAffiliate}
            isSubmitting={submitting}
          />
        </div>
    );
  }

  const getConfigVal = (key: string, fallback: number) =>
    configs?.[key] ?? fallback;

  const minWithdrawal = getConfigVal("affiliateMinWithdrawal", 50);
  const t1Limit = getConfigVal("affiliateTier1Threshold", 3);
  const t1Comm = getConfigVal("affiliateTier1Commission", 50);
  const t2Limit = getConfigVal("affiliateTier2Threshold", 10);
  const t2Comm = getConfigVal("affiliateTier2Commission", 100);
  const t3Limit = getConfigVal("affiliateTier3Threshold", 20);
  const t3Comm = getConfigVal("affiliateTier3Commission", 150);
  const t4Limit = getConfigVal("affiliateTier4Threshold", 30);
  const t4Comm = getConfigVal("affiliateTier4Commission", 200);

  const salesCount = logs.length;

  let currentTier = 1;
  let currentTarget = t1Limit;
  let prevTarget = 0;
  let currentCommission = t1Comm;
  let nextCommission = t2Comm;

  if (salesCount >= t3Limit) {
    currentTier = 4;
    prevTarget = t3Limit;
    currentTarget = t4Limit;
    currentCommission = t4Comm;
    nextCommission = t4Comm;
  } else if (salesCount >= t2Limit) {
    currentTier = 3;
    prevTarget = t2Limit;
    currentTarget = t3Limit;
    currentCommission = t3Comm;
    nextCommission = t4Comm;
  } else if (salesCount >= t1Limit) {
    currentTier = 2;
    prevTarget = t1Limit;
    currentTarget = t2Limit;
    currentCommission = t2Comm;
    nextCommission = t3Comm;
  }

  let progressPercent = 0;
  if (currentTier === 4 && salesCount >= t4Limit) {
    progressPercent = 100;
  } else {
    progressPercent = Math.min(
      100,
      Math.max(
        0,
        ((salesCount - prevTarget) / (currentTarget - prevTarget)) * 100,
      ),
    );
  }

  const affiliateCode =
    userData.affiliateCode ||
    `AFF-${userData.uid.substring(0, 6).toUpperCase()}`;
  const shareLink = `${window.location.origin}/?ref=${affiliateCode}`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopying(true);
      notify("Copied!", "success");
      setTimeout(() => setIsCopying(false), 2000);
    } catch (err) {
      notify("Failed to copy", "error");
    }
  };

  const handleSaveCode = async () => {
    let userCode = tempCode.trim().toUpperCase();
    if (!userCode || userCode.length < 3)
      return notify("Code must be at least 3 characters", "error");
    if (!/^[A-Z0-9_-]+$/.test(userCode))
      return notify(
        "Only letters, numbers, hyphens and underscores allowed",
        "error",
      );

    const code = userCode;

    const reservedWords = [
      "TEST",
      "USER",
      "ADMIN",
      "SYSTEM",
      "DEFAULT",
      "PROMO",
      "DISCOUNT",
    ];
    if (reservedWords.includes(userCode) && userData.role !== "admin") {
      return notify(
        "This promo code name is reserved. Choose another name.",
        "error",
      );
    }

    if (code === userData.affiliateCode) {
      setIsEditingCode(false);
      return;
    }

    setSavingCode(true);
    try {
      // Check if coupon exists
      const couponQ = query(
        collection(db, "coupons"),
        where("code", "==", code),
      );
      const snap = await getDocs(couponQ);
      if (!snap.empty) {
        notify("This promo code is already taken!", "error");
        setSavingCode(false);
        return;
      }

      // Update user document
      await updateDoc(doc(db, "users", userData.uid), { affiliateCode: code });

      // Add new coupon
      await addDoc(collection(db, "coupons"), {
        code: code,
        discount: 5,
        type: "percent",
        maxUses: 999999,
        usedCount: 0,
        isActive: true,
        isAffiliate: true,
        affiliateId: userData.uid,
        createdAt: Date.now(),
      });

      notify("Custom promo code saved!", "success");
      setIsEditingCode(false);
    } catch (e) {
      notify("Failed to save code", "error");
    }
    setSavingCode(false);
  };

  // Compute chart data
  const getChartData = () => {
    const last12Months = Array.from({ length: 6 })
      .map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return {
          month: d.toLocaleString("default", { month: "short" }),
          year: d.getFullYear(),
          earned: 0,
          sales: 0,
        };
      })
      .reverse();

    logs.forEach((log: any) => {
      let d = new Date();
      if (log.createdAt) {
        d = log.createdAt.toDate ? log.createdAt.toDate() : new Date(log.createdAt);
      }
      
      if (isNaN(d.getTime())) {
          return; // skip invalid dates
      }

      const month = d.toLocaleString("default", { month: "short" });
      const year = d.getFullYear();
      const match = last12Months.find(
        (m) => m.month === month && m.year === year,
      );
      if (match) {
        match.earned += log.commission || 0;
        match.sales += 1;
      }
    });
    return last12Months;
  };

  const chartData = getChartData();

  return (
    <TourProvider tourId="affiliate">
    <div className="max-w-4xl mx-auto px-6 py-10 min-h-screen bg-background text-foreground font-sans relative overflow-hidden">
        <AffiliateTourSteps />
        <TourAlertDialog isOpen={showTour} setIsOpen={setShowTour} />
        <div aria-hidden className="fixed inset-0 isolate contain-strict -z-10 opacity-30 dark:opacity-60 pointer-events-none">
            <div className="bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,rgba(0,0,0,0.06)_0,rgba(0,0,0,0.02)_50%,rgba(0,0,0,0.01)_80%)] dark:bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,rgba(255,255,255,0.06)_0,rgba(255,255,255,0.02)_50%,rgba(255,255,255,0.01)_80%)] absolute top-0 right-0 h-[800px] w-[560px] -translate-y-[350px] rounded-full" />
            <div className="bg-[radial-gradient(50%_50%_at_50%_50%,rgba(0,0,0,0.04)_0,rgba(0,0,0,0.01)_80%,transparent_100%)] dark:bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,255,255,0.04)_0,rgba(255,255,255,0.01)_80%,transparent_100%)] absolute top-0 right-0 h-[800px] w-[240px] -translate-y-[350px] rounded-full" />
        </div>
      <div className="flex items-center justify-between mb-10 relative z-10">
        <div className="flex items-center space-x-6">
          <button
            onClick={() => {
              if (activeTab === "menu") navigate("/profile");
              else setActiveTab("menu");
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition"
          >
            <Icon name="arrow-left" />
          </button>
          
          <div className="flex flex-col">
            <h1 className="text-lg md:text-xl lg:text-base xl:text-sm font-semibold tracking-tight  text-shine">
              {activeTab === "menu" ? "Partners." : 
               activeTab === "dashboard" ? "Dashboard" : 
               activeTab === "creator_hub" ? "Creator Hub" : 
               "Small Creators"}
            </h1>
            <p className="text-[9px] font-bold text-zinc-800 dark:text-zinc-200/70  tracking-normal mt-1 pl-1">
              {activeTab === "menu" ? "Select an option" : "Affiliate Portal"}
            </p>
          </div>
        </div>
      </div>

      {activeTab === "menu" ? (
        <div className="max-w-5xl mx-auto space-y-4">
          {tabsData.map(tab => {
            const IconCmp = tab.icon;
            return (
              <div 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as string)}
                className="bg-white dark:bg-zinc-900 rounded-[28px] p-5 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform shadow-sm border border-zinc-100 dark:border-zinc-800"
              >
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <IconCmp className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{tab.title}</h3>
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">View {tab.title.toLowerCase()}</p>
                    </div>
                </div>
                <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                    <Icon name="chevron-right" className="text-zinc-900 dark:text-zinc-100" />
                </div>
              </div>
            );
          })}
        </div>
      ) : activeTab === "dashboard" ? (
        <>
          <div className="flex flex-col lg:flex-row gap-6 mb-8 w-full max-w-5xl mx-auto">
            {/* Wallet style card */}
            <Card id="affiliate-wallet" className="flex-1 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-3xl">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Card className="p-4 bg-gradient-to-r from-pink-200 to-rose-200 dark:from-pink-900/40 dark:to-rose-900/40 border border-pink-300/50 dark:border-pink-800/50 shadow-sm rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-black/10 dark:bg-white/10 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                        </div>
                        <span className="font-medium text-gray-800 dark:text-gray-200">Total Lifetime Earnings</span>
                      </div>
                      <span className="font-semibold text-gray-800 dark:text-gray-100">
                        ৳{((userData.walletBalance || 0) + logs.reduce((acc: any, log: any) => acc + (log.commission || 0), 0)).toLocaleString()}
                      </span>
                    </div>
                  </Card>

                  <Card className="p-4 bg-gradient-to-r from-purple-200 to-indigo-200 dark:from-purple-900/40 dark:to-indigo-900/40 border border-purple-300/50 dark:border-purple-800/50 shadow-sm rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-black/10 dark:bg-white/10 rounded-lg flex items-center justify-center">
                          <Gift className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                        </div>
                        <span className="font-medium text-gray-800 dark:text-gray-200">Total Sales</span>
                      </div>
                      <span className="font-semibold text-gray-800 dark:text-gray-100">{salesCount} Sales</span>
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
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                      <span className="font-medium">Active</span>
                    </div>
                  </div>
                </div>

                <div id="affiliate-link" className="flex gap-3">
                  <Button onClick={() => navigate("/withdraw")} className="flex-1 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl h-12 gap-2 border border-pink-600">
                    <ArrowDown className="w-4 h-4" />
                    Withdraw
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => copyToClipboard(shareLink)}
                    className="flex-1 bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 rounded-2xl h-12 gap-2 border border-gray-300 dark:border-zinc-700"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Copy Link
                  </Button>
                </div>

                <div className="space-y-1 pt-2">
                  <div className="flex items-center gap-4 p-3 border border-gray-100 dark:border-zinc-800 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center border border-pink-200 dark:border-pink-800/50">
                      <TrendingUp className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Level {currentTier} Partner</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{currentCommission}৳ per sale</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3 border border-gray-100 dark:border-zinc-800 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center border border-purple-200 dark:border-purple-800/50">
                      <Wallet className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Next Goal</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{currentTier === 4 && salesCount >= t4Limit ? "MAX TIER ACTIVE" : `${currentTarget - salesCount} sales to Level ${currentTier + 1}`}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Goal Progress Card  */}
            <div className="flex-1 flex flex-col gap-6">
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col h-full relative overflow-hidden group">
                <div className="z-10 relative flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                        Level up to Level {currentTier < 4 ? currentTier + 1 : 4}
                      </h2>
                      <span className="bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 px-3 py-1.5 rounded-full text-xs font-semibold">
                        {currentTier < 4 ? `+ ${nextCommission}৳ / Sale` : "Max Level"}
                      </span>
                    </div>

                    <div className="flex items-end gap-2 mb-6">
                      <h3 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        {salesCount}
                      </h3>
                      <p className="text-sm font-bold text-zinc-500 mb-1">
                        / {currentTarget} Sales
                      </p>
                    </div>

                    <div className="h-6 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden relative mb-4">
                      <div
                        className="absolute h-full left-0 top-0 bg-pink-500 dark:bg-pink-600 rounded-full transition-all duration-1000"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {currentTier === 4 && salesCount >= t4Limit ? (
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-full w-max mt-4">
                      <Icon name="check-circle" className="mr-2 text-lg text-zinc-900 dark:text-zinc-100" /> MAX TIER ACHIEVED
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-zinc-500 leading-relaxed mt-4">
                      <span className="text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
                        {currentTarget - salesCount} more sales
                      </span>{" "}
                      needed. Keep pushing!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm mb-8 overflow-hidden relative hidden md:block">
            <div className="flex justify-between items-center mb-6 z-10 relative">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Performance Over Time
              </h2>
              <div className="flex items-center gap-4 text-[10px] font-bold  tracking-normal text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"></span>{" "}
                  Sales
                </div>
              </div>
            </div>
            <div className="h-56 w-full relative z-10 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#71717a" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#71717a" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{
                      stroke: "#ecfdf5",
                      strokeWidth: 2,
                      strokeDasharray: "4 4",
                    }}
                    contentStyle={{
                      backgroundColor: "white",
                      borderRadius: "1.5rem",
                      border: "1px solid #f4f4f5",
                      boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.1)",
                      padding: "12px 16px",
                    }}
                    itemStyle={{
                      fontSize: "14px",
                      fontWeight: "900",
                      color: "#10b981",
                    }}
                    labelStyle={{
                      fontSize: "10px",
                      color: "#a1a1aa",
                      textTransform: "",
                      letterSpacing: "0.1em",
                      fontWeight: "700",
                      marginBottom: "4px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="Total Sales"
                    stroke="#10b981"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm mb-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">
                  Your Promotion Hub
                </h2>
                <p className="text-xs text-zinc-500 font-medium max-w-md leading-relaxed">
                  Share your code everywhere. Customers get{" "}
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 dark:text-zinc-800 dark:text-zinc-200">
                    5% OFF
                  </span>{" "}
                  instantly, and you earn{" "}
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 dark:text-zinc-800 dark:text-zinc-200">
                    {currentCommission}৳
                  </span>{" "}
                  immediately upon delivery.
                </p>
              </div>

              <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-4 py-2 rounded-full flex items-center space-x-3 w-full md:w-auto">
                <div className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center text-zinc-800 dark:text-zinc-200">
                  <Icon name="tag" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-zinc-500 tracking-normal mb-0.5">
                    Your Rate
                  </p>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {currentCommission}৳ / Sale
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700/50">
                <label className="text-[10px] font-bold  tracking-normal text-zinc-400 mb-3 block">
                  Custom Promo Code
                </label>
                {isEditingCode ? (
                  <div className="flex bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-100 p-1.5 rounded-full transition-all h-14 shadow-sm">
                    <input
                      type="text"
                      value={tempCode}
                      onChange={(e) =>
                        setTempCode(e.target.value.toUpperCase())
                      }
                      className="flex-1 bg-transparent px-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200 outline-none  tracking-normal min-w-0"
                      placeholder="e.g. VIBEGADGET"
                    />
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={handleSaveCode}
                        disabled={savingCode}
                        className="h-full w-12 flex items-center justify-center bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black rounded-full shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors "
                      >
                        {savingCode ? (
                          <Icon
                            name="spinner-third"
                            className="animate-spin text-sm"
                          />
                        ) : (
                          <Icon name="check" className="text-sm" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingCode(false);
                          setTempCode(userData.affiliateCode || "");
                        }}
                        className="h-full w-12 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        <Icon name="times" className="text-sm" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-1.5 rounded-full transition-all h-14 shadow-sm group">
                    <input
                      type="text"
                      readOnly
                      value={affiliateCode}
                      className="flex-1 bg-transparent px-4 text-base font-semibold text-zinc-800 dark:text-zinc-200 dark:text-zinc-800 dark:text-zinc-200 outline-none  tracking-normal min-w-0"
                    />
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => setIsEditingCode(true)}
                        className="h-full px-4 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-[10px] font-bold  tracking-normal"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => copyToClipboard(affiliateCode)}
                        className="h-full px-5 flex items-center justify-center bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full hover:bg-zinc-900 transition-colors text-[10px] font-bold  tracking-normal shadow-md"
                      >
                        {isCopying ? "Copied!" : "Copy Code"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700/50">
                <label className="text-[10px] font-bold  tracking-normal text-zinc-400 mb-3 block transform-gpu">
                  Direct Referral Link
                </label>
                <div className="flex bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-1.5 rounded-full transition-all h-14 shadow-sm group">
                  <div className="flex items-center justify-center w-10 text-zinc-300 dark:text-zinc-600">
                    <Icon name="link" />
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={shareLink}
                    className="flex-1 bg-transparent pr-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 outline-none min-w-0 truncate"
                  />
                  <button
                    onClick={() => copyToClipboard(shareLink)}
                    className="h-full px-5 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-[10px] font-bold  tracking-normal"
                  >
                    {isCopying ? <Icon name="check" /> : "Copy"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div id="affiliate-history" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6 px-2">
                <h3 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Transaction History
                </h3>
                <span className="text-[10px] font-bold text-zinc-400  tracking-normal bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
                  {logs.length} Sales
                </span>
              </div>

              {logs.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-solid border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon
                      name="receipt"
                      className="text-xl text-zinc-300 dark:text-zinc-600"
                    />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    No transactions yet
                  </h4>
                  <p className="text-[11px] font-medium text-zinc-500 max-w-xs mx-auto leading-relaxed">
                    Your earnings will appear here once customers receive their
                    orders using your code.
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col gap-2">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between py-4 px-5 bg-zinc-50 dark:bg-zinc-800/30 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
                    >
                      <div className="flex items-center overflow-hidden pr-4">
                        <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 flex items-center justify-center shrink-0 mr-4 shadow-inner group-hover:scale-105 transition-transform">
                          <Icon name="arrow-down-left" className="text-sm" />
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate mb-1">
                            Sale Commission
                          </p>
                          <p className="text-[10px] font-bold text-zinc-500 flex items-center gap-2">
                            <span>
                              {log.createdAt ? (log.createdAt.toDate ? log.createdAt.toDate().toLocaleDateString() : (new Date(log.createdAt).getTime() ? new Date(log.createdAt).toLocaleDateString() : 'N/A')) : 'N/A'}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                            <span className="truncate max-w-[100px] sm:max-w-[150px]">
                              {log.customerName || "Customer"}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200 dark:text-zinc-800 dark:text-zinc-200 text-lg">
                          +৳{log.commission}
                        </p>
                        <p className="text-[9px] font-bold text-zinc-800 dark:text-zinc-200/50  tracking-normal mt-0.5">
                          Added to Wallet
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-zinc-900 dark:bg-zinc-50 p-8 rounded-2xl text-white dark:text-zinc-900 shadow-sm overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/10 dark:bg-zinc-900 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 backdrop-blur-md">
                    <Icon name="bullhorn" className="text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight mb-3">
                    Marketing Tips
                  </h3>
                  <ul className="space-y-5 mb-4">
                    <li className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900/10 dark:bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900/20 flex items-center justify-center shrink-0 border border-zinc-900 dark:border-zinc-100/20 mt-0.5 shadow-sm">
                        <Icon
                          name="check"
                          className="text-zinc-800 dark:text-zinc-200 dark:text-zinc-800 dark:text-zinc-200 text-[10px]"
                        />
                      </div>
                      <p className="text-xs font-bold text-zinc-400 dark:text-zinc-600 leading-relaxed">
                        Add your code to your Instagram & TikTok bios.
                      </p>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900/10 dark:bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900/20 flex items-center justify-center shrink-0 border border-zinc-900 dark:border-zinc-100/20 mt-0.5 shadow-sm">
                        <Icon
                          name="check"
                          className="text-zinc-800 dark:text-zinc-200 dark:text-zinc-800 dark:text-zinc-200 text-[10px]"
                        />
                      </div>
                      <p className="text-xs font-bold text-zinc-400 dark:text-zinc-600 leading-relaxed">
                        Share our daily offers and mention your code gives extra
                        5% off.
                      </p>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900/10 dark:bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900/20 flex items-center justify-center shrink-0 border border-zinc-900 dark:border-zinc-100/20 mt-0.5 shadow-sm">
                        <Icon
                          name="check"
                          className="text-zinc-800 dark:text-zinc-200 dark:text-zinc-800 dark:text-zinc-200 text-[10px]"
                        />
                      </div>
                      <p className="text-xs font-bold text-zinc-400 dark:text-zinc-600 leading-relaxed">
                        Unbox products and vocally remind viewers to use your
                        code.
                      </p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : activeTab === "creator_hub" ? (
        <CreatorHub userData={userData} />
      ) : (
        <SmallCreatorsHub userData={userData} />
      )}
      <div className="h-20" />
    </div>
    </TourProvider>
  );
};

export default AffiliatePage;
