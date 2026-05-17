import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";
import { Product, Review } from "../types";
import { ChevronLeft } from "lucide-react";
import { Tr } from "../components/Tr";
import { ReviewCard } from "../components/ui/review-card";
import { ReviewFilterGroup, ReviewFilterItem } from "../components/ui/review-filter-bars";

const ProductReviews: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "products", id)).then(snap => {
      if (snap.exists()) setProduct({ id: snap.id, ...snap.data() } as Product);
    });

    const q = query(collection(db, "reviews"), where("productId", "==", id));
    const unsub = onSnapshot(q, (snapshot) => {
      const reviewList = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Review,
      );
      reviewList.sort((a, b) => b.createdAt - a.createdAt);
      setReviews(reviewList);
    });

    return () => unsub();
  }, [id]);

  if (!product) return <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900" />;

  return (
    <div className="max-w-3xl mx-auto min-h-screen bg-zinc-50 dark:bg-zinc-900 pb-12">
      <div className="sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 p-4 flex items-center z-50">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition mr-4">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold tracking-tight"><Tr>All Reviews</Tr></h1>
      </div>

      <div className="p-4 md:p-8 flex flex-col gap-8">
        {reviews.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
             <h2 className="text-xl font-bold tracking-tight mb-4">Rating Breakdown</h2>
             <ReviewFilterGroup defaultValue="all" className="w-full">
               <ReviewFilterItem value="5-stars" stars={5} count={reviews.filter((r) => Math.round(r.rating) === 5).length} total={reviews.length} />
               <ReviewFilterItem value="4-stars" stars={4} count={reviews.filter((r) => Math.round(r.rating) === 4).length} total={reviews.length} />
               <ReviewFilterItem value="3-stars" stars={3} count={reviews.filter((r) => Math.round(r.rating) === 3).length} total={reviews.length} />
               <ReviewFilterItem value="2-stars" stars={2} count={reviews.filter((r) => Math.round(r.rating) === 2).length} total={reviews.length} />
               <ReviewFilterItem value="1-star" stars={1} count={reviews.filter((r) => Math.round(r.rating) === 1).length} total={reviews.length} />
             </ReviewFilterGroup>
          </div>
        )}

        <div className="flex flex-col gap-4">
           {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                name={review.userName}
                handle={review.userId === auth.currentUser?.uid ? "You" : "Verified Buyer"}
                review={review.comment}
                rating={review.rating}
                imageUrl={review.userPhoto}
                createdAt={review.createdAt}
                images={(review as any).images}
              />
           ))}
        </div>
      </div>
    </div>
  );
};

export default ProductReviews;
