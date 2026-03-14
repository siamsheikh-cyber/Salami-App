import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import eidBanner from "@/assets/eid-banner.png";
import crescentDecoration from "@/assets/crescent-decoration.png";
import { playSalam } from "@/lib/sounds";

const relations = [
  { value: "ভাই", label: "বড় ভাই" },
  { value: "আপু", label: "বড় বোন" },
  { value: "মামা", label: "মামা" },
  { value: "মামি", label: "মামি" },
  { value: "কাকা", label: "কাকা" },
  { value: "কাকি", label: "কাকি" },
  { value: "ফুফু", label: "ফুফু" },
  { value: "খালা", label: "খালা" },
  { value: "বন্ধু", label: "বন্ধু" },
];

const Index = () => {
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const navigate = useNavigate();

  // শুধুমাত্র এই পেজে প্রথমবার আসার সময় সাউন্ড প্লে হবে
  useEffect(() => {
    const timer = setTimeout(() => {
      playSalam();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const isValid = name.trim().length > 0 && relation.length > 0;

  const handleStart = () => {
    if (!isValid) return;
    localStorage.setItem("salami_name", name.trim());
    localStorage.setItem("salami_relation", relation);

    // এখান থেকে playSalam() সরিয়ে দেওয়া হয়েছে, তাই বাটনে ক্লিক করলে আর বাজবে না।
    navigate("/game");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-6 relative overflow-hidden">
      <img
        src={crescentDecoration}
        alt=""
        className="absolute top-[80px] right-0 w-24 md:w-36 opacity-30 animate-float pointer-events-none"
      />

      <div className="w-full max-w-lg mb-6 max-h-[150px] md:max-h-screen">
        <img
          src={eidBanner}
          alt="ঈদ মোবারক"
          className="w-full rounded-2xl shadow-lg -mt-24"
        />
      </div>

      <div className="card-festive w-full max-w-lg p-6 md:p-8 animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold emerald-text text-center font-heading leading-relaxed">
          আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ
        </h1>

        <p className="text-center text-muted-foreground mt-3 text-sm md:text-base leading-relaxed">
          আমি সিয়াম! দয়া করে নিচে আপনার নাম লিখুন এবং আমার সাথে আপনার সম্পর্কটি সিলেক্ট করুন।
        </p>

        <div className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              আপনার নাম লিখুন
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="নাম লিখুন"
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              আমাদের সম্পর্ক বেছে নিন
            </label>
            <select
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all text-base appearance-none cursor-pointer"
            >
              <option value="" disabled>
                সম্পর্ক সিলেক্ট করুন
              </option>
              {relations.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleStart}
            disabled={!isValid}
            className="btn-festive w-full text-lg py-4 rounded-xl mt-4 font-heading text-center"
          >
            সালামি মিশন শুরু হোক!💸
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-6 text-center">
        © সিয়ামের সালামি সিস্টেম ২০২৬
      </p>
    </div>
  );
};

export default Index;