import { useEffect, useState } from "react";
import { fetchPublicInteractions, SalamiInteraction } from "@/lib/adminService";
import { ArrowLeft, Trophy, Clock, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import crescentDecoration from "@/assets/crescent-decoration.png";

type Tab = "done" | "pending";

const PublicList = () => {
  const [data, setData] = useState<SalamiInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("done");
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchPublicInteractions();
        setData(result);
      } catch (err) {
        console.error("Failed to fetch public list", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getFilteredData = () => {
    const statusFilter = activeTab === "done" ? "Done" : "Progress";
    return data
      .filter((item) => item.status === statusFilter)
      .slice(0, 3); // Top 3 people
  };

  const filteredData = getFilteredData();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-8 relative overflow-hidden">
      <img
        src={crescentDecoration}
        alt=""
        className="absolute top-0 right-0 w-24 md:w-36 opacity-20 animate-float pointer-events-none"
      />

      <div className="w-full max-w-md flex items-center justify-between mb-8 relative z-10">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background border border-input text-foreground hover:bg-muted transition-colors font-medium text-sm shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          হোমে ফিরুন
        </button>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-emerald/10 text-emerald rounded-full mb-4 ring-4 ring-emerald/5">
            <Trophy className="w-8 h-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading emerald-text mb-2">
            সালামির লিস্ট
          </h1>
          <p className="text-muted-foreground text-sm">
            সেরা ৩ জনের তালিকা (টাকার পরিমাণ গোপন রাখা হয়েছে)
          </p>
        </div>

        <div className="flex p-1 bg-muted/50 rounded-2xl mb-8 border border-border">
          <button
            onClick={() => setActiveTab("done")}
            className={`flex-1 py-3 text-sm font-bold font-heading rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === "done"
                ? "bg-emerald text-white shadow-md"
                : "text-muted-foreground hover:bg-background/50"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            সালামি দেওয়া শেষ
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex-1 py-3 text-sm font-bold font-heading rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === "pending"
                ? "bg-gold text-gold-foreground shadow-md"
                : "text-muted-foreground hover:bg-background/50"
            }`}
          >
            <Clock className="w-4 h-4" />
            সালামি বাকি আছে
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground animate-pulse">
              লিস্ট আপডেট হচ্ছে...
            </div>
          ) : filteredData.length === 0 ? (
            <div className="card-festive p-8 text-center border border-dashed border-border/50">
              <p className="text-muted-foreground font-medium">কোনো রেকর্ড পাওয়া যায়নি</p>
            </div>
          ) : (
            filteredData.map((item, index) => (
              <div 
                key={index} 
                className="card-festive p-5 flex items-center justify-between border border-border/50 group hover:border-emerald/30 transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg font-heading shadow-inner ${
                    index === 0 ? "bg-amber-100 text-amber-600 border border-amber-200" :
                    index === 1 ? "bg-slate-100 text-slate-500 border border-slate-200" :
                    "bg-orange-50 text-orange-600 border border-orange-100"
                  }`}>
                    #{index + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">{item.visitorName}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.timestamp ? new Date(item.timestamp).toLocaleDateString("bn-BD") : "সাম্প্রতিক"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="px-3 py-1 bg-muted rounded-full border border-border/50 inline-block">
                    <span className="font-bold text-muted-foreground tracking-wider">*** ৳</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 text-center font-medium">
                    গোপন
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicList;
