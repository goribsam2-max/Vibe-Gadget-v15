import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { Product } from "../types";
import Icon from "../components/Icon";
import { ProductCard } from "../components/ui/ProductCard";

const Search: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [recent, setRecent] = useState<string[]>(
    JSON.parse(localStorage.getItem("vibe_recent_searches") || "[]"),
  );
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    const q = collection(db, "products");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAllProducts(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Product),
      );
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setResults([]);
      return;
    }
    const filtered = allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setResults(filtered);
  }, [searchTerm, allProducts]);

  const saveSearch = (term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...recent.filter((r) => r !== term)].slice(0, 5);
    setRecent(updated);
    localStorage.setItem("vibe_recent_searches", JSON.stringify(updated));
  };

  const removeRecent = (term: string) => {
    const updated = recent.filter((r) => r !== term);
    setRecent(updated);
    localStorage.setItem("vibe_recent_searches", JSON.stringify(updated));
  };

  const clearAll = () => {
    setRecent([]);
    localStorage.removeItem("vibe_recent_searches");
  };

  return (
    <div className="p-6 animate-fade-in min-h-screen bg-zinc-50 dark:bg-zinc-800 max-w-md mx-auto">
      

      {searchTerm.trim() === "" ? (
        <>
          <div className="mb-10">
            <h3 className="text-xs font-bold text-gray-400  tracking-normal mb-4">
              Trending Tech
            </h3>
            <div className="flex flex-wrap gap-2">
              {["iPhone", "Magsafe", "Pods", "Smart Watch", "Anker"].map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSearchTerm(cat);
                      saveSearch(cat);
                    }}
                    className="px-5 py-2.5 bg-[#f4f4f5] dark:bg-zinc-800/80 rounded-full text-xs font-bold hover:bg-zinc-900 hover:text-white transition-all"
                  >
                    {cat}
                  </button>
                ),
              )}
            </div>
          </div>

          {recent.length > 0 && (
            <div className="mb-10 animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold text-gray-400  tracking-normal">
                  Recent Searches
                </h3>
                <button
                  onClick={clearAll}
                  className="text-[10px] font-bold text-black dark:text-white underline  tracking-normal opacity-40 hover:opacity-100"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-4">
                {recent.map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center group cursor-pointer"
                  >
                    <div
                      className="flex items-center space-x-3"
                      onClick={() => setSearchTerm(item)}
                    >
                      <Icon name="history" className="text-gray-300 text-xs" />
                      <span className="text-sm font-bold text-zinc-500 group-hover:text-black dark:text-white transition-colors">
                        {item}
                      </span>
                    </div>
                    <button
                      onClick={() => removeRecent(item)}
                      className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Icon name="times" className="text-gray-300" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-xs font-bold text-gray-400  tracking-normal mb-2">
            Search Results ({results.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 pb-2">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {results.length === 0 && (
            <div className="py-20 text-center opacity-40">
              <Icon name="box-open" className="text-lg mb-4" />
              <p className="text-sm font-bold  tracking-normal">
                No products matched
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
