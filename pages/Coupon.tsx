import React from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";

const Coupon: React.FC = () => {
  const navigate = useNavigate();

  const coupons = [
    {
      title: "WELCOME200",
      desc: "Add items worth $2 more to unlock",
      promo: "Get 50% OFF",
    },
    {
      title: "CASHBACK12",
      desc: "Add items worth $2 more to unlock",
      promo: "Up to $12.00 cashback",
    },
    {
      title: "FEST200",
      desc: "Add items worth $28 more to unlock",
      promo: "Get 50% OFF for Combo",
    },
  ];

  return (
    <div className="p-6 animate-fade-in min-h-screen">
      

      <p className="text-sm font-bold mb-6">Best offers for you</p>

      <div className="space-y-6">
        {coupons.map((c, i) => (
          <div
            key={i}
            className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold mb-1">{c.title}</h3>
                <p className="text-xs text-zinc-500">{c.desc}</p>
              </div>
              <span className="text-xs font-bold text-red-500">{c.promo}</span>
            </div>
            <button className="w-full py-2 bg-[#f4f4f5] dark:bg-zinc-800/80 text-black dark:text-white rounded-full text-xs font-bold  tracking-wider">
              Copy Code
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Coupon;
