import React from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import { Button } from "@/components/ui/button";

const VerifyCode: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-8 animate-fade-in h-screen flex flex-col">
      

      <div className="text-center flex-1">
        <h1 className="text-lg font-bold mb-4">Verify Code</h1>
        <p className="text-zinc-500 text-sm mb-10">
          Please enter the code we just sent to email{" "}
          <span className="text-black dark:text-white font-bold">
            example@mail.com
          </span>
        </p>

        <div className="flex justify-center space-x-4 mb-10">
          {[2, 8, "-", "-"].map((v, i) => (
            <div
              key={i}
              className="w-14 h-16 bg-[#f4f4f5] dark:bg-zinc-800/80 rounded-full flex items-center justify-center font-bold text-xl border-zinc-200 border focus-within:border-black"
            >
              {typeof v === "number" ? v : ""}
            </div>
          ))}
        </div>

        <p className="text-xs text-zinc-500">
          Didn't receive OTP?{" "}
          <span className="font-bold text-black dark:text-white underline">
            Resend code
          </span>
        </p>
      </div>

      <Button
        variant="primary"
        onClick={() => navigate("/complete-profile")}
        className="w-full"
      >
        Verify
      </Button>
    </div>
  );
};

export default VerifyCode;
