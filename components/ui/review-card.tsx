import * as React from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ReviewCardProps {
  name: string;
  handle?: string;
  review: string;
  rating: number;
  imageUrl?: string;
  createdAt?: number;
  images?: string[];
  className?: string;
}

const ReviewCard = React.forwardRef<HTMLDivElement, ReviewCardProps>(
  ({ name, handle, review, rating, imageUrl, createdAt, images, className }, ref) => {
    const cardVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.4,
          ease: "easeOut",
        },
      },
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm w-full",
          className
        )}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        role="article"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={imageUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${name}&backgroundColor=f4f4f5`}
              alt={`Avatar of ${name}`}
              className="w-12 h-12 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
            />
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {name}
              </h3>
              <p className="text-sm text-zinc-500">{handle || new Date(createdAt || Date.now()).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-lg font-bold">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span className="text-zinc-900 dark:text-zinc-100">{rating.toFixed(1)}</span>
          </div>
        </div>

        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          {review}
        </p>

        {images && images.length > 0 && (
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt="Review Attachment"
                className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700 shrink-0"
              />
            ))}
          </div>
        )}
      </motion.div>
    );
  }
);

ReviewCard.displayName = "ReviewCard";

export { ReviewCard };
