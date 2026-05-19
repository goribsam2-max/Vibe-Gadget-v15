import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Product } from "../../types";
import { Heart, ShoppingBag } from "lucide-react";
import { auth, db } from "../../firebase";
import { doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { PixelImage } from "./PixelImage";
import { getProductCoinReward } from "../../lib/coinRewards";

export const ProductCard = ({ product }: { product: Product }) => {
  const navigate = useNavigate();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const hasDiscount =
    product.isOffer && product.offerPrice && product.offerPrice < product.price;

  const displayPrice =
    product.isOffer && product.offerPrice ? product.offerPrice : product.price;
  const productSlug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  useEffect(() => {
    let unsubscribe = () => {};
    if (auth.currentUser && product.id) {
      const wishlistRef = doc(
        db,
        "users",
        auth.currentUser.uid,
        "wishlist",
        product.id,
      );
      unsubscribe = onSnapshot(
        wishlistRef,
        (snap) => {
          setIsWishlisted(snap.exists());
        },
        (err) => {
          // silently ignore snapshot errors
        },
      );
    }
    return () => unsubscribe();
  }, [product.id]);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/product/${productSlug}/${product.id}`);
  };

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!auth.currentUser) return;
    if (!product.id) return;

    const wishlistRef = doc(
      db,
      "users",
      auth.currentUser.uid,
      "wishlist",
      product.id,
    );
    try {
      if (isWishlisted) {
        await deleteDoc(wishlistRef);
      } else {
        await setDoc(wishlistRef, {
          productId: product.id,
          addedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
    }
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className="group relative w-full"
    >
      <Link
        to={`/product/${productSlug}/${product.id}`}
        className="flex flex-col h-full bg-white dark:bg-zinc-900 overflow-hidden block group relative rounded-[15px] shadow-sm border border-zinc-100 dark:border-zinc-800"
      >
        {/* Image Container */}
        <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-[#f9f9f9] dark:bg-zinc-800">
          <PixelImage
            src={product.image}
            alt={product.name}
            imgClassName="mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-500"
          />

          {/* Top Right Heart Outline */}
          <button
            onClick={toggleWishlist}
            className="absolute top-2.5 right-2.5 bg-white/70 backdrop-blur-sm dark:bg-zinc-900/70 rounded-full p-2 flex items-center justify-center transition-colors hover:bg-orange-50 dark:hover:bg-zinc-800 z-10 cursor-pointer shadow-sm"
          >
            <Heart
              className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${isWishlisted ? "text-[#ea580c] fill-[#ea580c]" : "text-[#ea580c] fill-none"}`}
            />
          </button>

          {/* Dynamic Price Cutout at Bottom Right */}
          <div className="absolute bottom-0 right-0 bg-white dark:bg-zinc-900 rounded-tl-[15px] pl-3 pt-2.5 pb-0 pr-0 flex items-center justify-center z-10">
            {/* VG Coin Badge */}
            {getProductCoinReward(product.id) > 0 && (
                <div className="absolute bottom-full right-2 mb-1 flex items-center bg-zinc-900/80 backdrop-blur-md rounded-full px-1.5 py-0.5">
                    <div className="h-3 w-3 flex items-center justify-center font-black text-[7px] text-amber-500 border border-amber-500 rounded-full mr-1 bg-white">V</div>
                    <span className="text-[9px] font-bold text-amber-400">+{getProductCoinReward(product.id)}</span>
                </div>
            )}
            {/* Inverted curves using SVG */}
            <svg
              className="absolute right-0 bottom-full w-4 h-4 text-white dark:text-zinc-900 translate-y-[0.5px]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M24 24H0C13.2548 24 24 13.2548 24 0V24Z" />
            </svg>
            <svg
              className="absolute right-full bottom-0 w-4 h-4 text-white dark:text-zinc-900 translate-x-[0.5px]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M24 24H0C13.2548 24 24 13.2548 24 0V24Z" />
            </svg>

            {/* Price Inner */}
            <div className="flex items-end justify-center gap-1 min-w-[65px] px-2.5 pb-1">
              {hasDiscount && (
                <span className="text-[10px] sm:text-[11px] text-zinc-400 font-bold line-through translate-y-[1px]">
                  ৳{product.price}
                </span>
              )}
              <span className="text-[15px] sm:text-[17px] font-black text-[#ea580c] tracking-tight leading-none">
                ৳{displayPrice}
              </span>
            </div>
          </div>
        </div>

        {/* Product Details right below the image */}
        <div className="px-3 pt-3 pb-4">
          <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2">
            {product.name}
          </h3>
        </div>
      </Link>
    </motion.div>
  );
};
