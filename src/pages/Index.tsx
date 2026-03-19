import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import eidBanner from "@/assets/eid-banner.png";
import crescentDecoration from "@/assets/crescent-decoration.png";
import { playSalam } from "@/lib/sounds";
import { Volume2, VolumeX, ListRestart, ListOrdered } from "lucide-react";

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

  const [muted, setMuted] = useState(() => {
    return typeof window !== 'undefined' && localStorage.getItem("salami_muted") === "true";
  });

  const toggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    if (typeof window !== 'undefined') {
      localStorage.setItem("salami_muted", newMuted.toString());
    }
  };

  useEffect(() => {
    const handleInitialInteraction = () => {
      playSalam()
        .then(() => {
          window.removeEventListener("click", handleInitialInteraction);
          window.removeEventListener("touchstart", handleInitialInteraction);
        })
        .catch((err) => console.log("Autoplay blocked, waiting for user click."));
    };

    const timer = setTimeout(handleInitialInteraction, 500);

    window.addEventListener("click", handleInitialInteraction);
    window.addEventListener("touchstart", handleInitialInteraction);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", handleInitialInteraction);
      window.removeEventListener("touchstart", handleInitialInteraction);
    };
  }, []);

  const isValid = name.trim().length > 0 && relation.length > 0;

  const handleStart = () => {
    if (!isValid) return;
    localStorage.setItem("salami_name", name.trim());
    localStorage.setItem("salami_relation", relation);
    navigate("/game");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-6 relative overflow-hidden">
      <div className="w-full max-w-lg flex justify-end mb-2 relative z-20">
        <button
          onClick={toggleMute}
          className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground bg-background/50 backdrop-blur-sm"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

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

        <p className="text-sm text-center text-muted-foreground font-medium mb-4 italic">
          "সালামি দেয়া নিয়ে আর নেই কোনো ঝামেলা, স্বল্প সময়ে সালামি দিয়ে অ্যাপের লিস্টে অ্যাড করে নিন নিজেকে।"
        </p>

        <p className="text-center text-muted-foreground mt-3 text-sm md:text-base leading-relaxed">
          <span className="block">আমি সিয়াম শেখ!</span> নিচে আপনার নাম লিখুন এবং আমার সাথে আপনার সম্পর্কের ধরন নির্বাচন করুন।
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

          <button
            onClick={() => navigate("/public-list")}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-emerald/20 text-emerald hover:bg-emerald/5 transition-all font-heading text-base font-bold"
          >
            <ListOrdered className="w-5 h-5" />
            সালামির লিস্ট দেখুন
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-6 text-center">
        © সালামি সিস্টেম ২০২৬
      </p>
    </div>
  );
};

export default Index;