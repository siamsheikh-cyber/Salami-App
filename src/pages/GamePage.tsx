import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import crescentDecoration from "@/assets/crescent-decoration.png";
import { Share2, CheckCircle, ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { playPop, playCashRegister, playEntryFanfare, playOikire, playAww } from "@/lib/sounds";
import { saveInteraction } from "@/lib/adminService";

type Stage = "loading" | "q1" | "q2" | "salami-choice" | "income-input" | "result";

const relationToRole: Record<string, string> = {
  "ভাই": "ছোট ভাই",
  "আপু": "ছোট ভাই",
  "মামা": "ভাগিনা",
  "মামি": "ভাগিনা",
  "কাকা": "ভাতিজা",
  "কাকি": "ভাতিজা",
  "ফুফু": "ভাতিজা",
  "খালা": "ভাগিনা",
  "বন্ধু": "বন্ধু",
};

const GamePage = () => {
  const navigate = useNavigate();
  const name = localStorage.getItem("salami_name") || "অতিথি";
  const relation = localStorage.getItem("salami_relation") || "ভাই";
  const addressee = `${name} ${relation}`;
  const role = relationToRole[relation] || "ছোট ভাই";

  const [stage, setStage] = useState<Stage>("loading");
  const [confirmed, setConfirmed] = useState(false);
  const [salamiAmount, setSalamiAmount] = useState(500);
  const [incomeInput, setIncomeInput] = useState("");
  const [muted, setMuted] = useState(false);
  const [q1Option, setQ1Option] = useState("");
  const [q2Option, setQ2Option] = useState("");
  const [showFixedInput, setShowFixedInput] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("salami_name")) {
      navigate("/");
      return;
    }
    const timer = setTimeout(() => {
      setStage("q1");
    }, 3000);

    const sfxTimer = setTimeout(() => {
      if (!muted) playEntryFanfare();
    }, 500);
    return () => { clearTimeout(timer); clearTimeout(sfxTimer); };
  }, [navigate, muted]);


  const playSound = useCallback((type: "pop" | "cash" | "oikire" | "aww") => {
    if (muted) return;
    if (type === "pop") playPop();
    else if (type === "cash") playCashRegister();
    else if (type === "oikire") playOikire();
    else if (type === "aww") playAww();
  }, [muted]);

  const fireConfetti = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#d4a017", "#1a5c38", "#ffffff"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#d4a017", "#1a5c38", "#ffffff"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  const handleSalamiChoice = (choice: "income" | "fixed") => {
    if (choice === "fixed") {
      playSound("pop");
      setShowFixedInput(true);
    } else {
      playSound("oikire");
      setStage("income-input");
    }
  };

  const handleFixedInputSubmit = () => {
    const fixedAmount = parseInt(incomeInput);
    if (isNaN(fixedAmount) || fixedAmount <= 0) return;

    setSalamiAmount(fixedAmount);
    setStage("result");
    setTimeout(fireConfetti, 300);
    playSound("cash");

    saveInteraction({
      visitorName: name,
      relation: relation,
      q1Option,
      q2Option,
      incomeOption: "fixed",
      incomeAmount: fixedAmount,
      finalSalami: fixedAmount
    });
  };

  const handleIncomeSubmit = () => {
    const income = parseInt(incomeInput);
    if (isNaN(income) || income <= 0) return;

    let computedSalami = 0;

    if (income >= 79999) {
      setSalamiAmount(1000);
      computedSalami = 1000;
    } else {
      setSalamiAmount(500);
      computedSalami = 500;
    }

    setStage("result");
    setTimeout(fireConfetti, 300);
    playSound("cash");

    saveInteraction({
      visitorName: name,
      relation: relation,
      q1Option,
      q2Option,
      incomeOption: "income",
      incomeAmount: income,
      finalSalami: computedSalami
    });
  };

  const handleShare = () => {
    const text = `🌙 ঈদ মোবারক! সালামি সিস্টেমে আপনার সালামি পেন্ডিং আছে! 😄\n\n👉 ${window.location.origin}`;
    if (navigator.share) {
      navigator.share({ title: "সালামি সিস্টেম", text });
    } else {
      navigator.clipboard.writeText(text);
      alert("লিংক কপি হয়ে গেছে! 📋");
    }
  };

  const handleConfirm = () => {
    setConfirmed(true);
    fireConfetti();
  };

  const handleBack = () => {
    if (stage === "q2") setStage("q1");
    else if (stage === "salami-choice") setStage("q2");
    else if (stage === "income-input") setStage("salami-choice");
    else navigate("/");
  };

  if (stage === "loading") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <img src={crescentDecoration} alt="" className="w-20 animate-spin-slow mb-6 opacity-60" />
        <h2 className="text-xl md:text-2xl font-bold emerald-text text-center font-heading">
          সালামি ক্যালকুলেশন চলছে...
        </h2>
        <p className="text-muted-foreground mt-2 text-center">
          অনুগ্রহ করে অপেক্ষা করুন 😎
        </p>
        <div className="mt-6 w-48 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full animate-shimmer"
            style={{
              background: "linear-gradient(90deg, hsl(var(--gold)), hsl(var(--emerald)), hsl(var(--gold)))",
              backgroundSize: "200% auto",
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-6 relative overflow-hidden">
      <img
        src={crescentDecoration}
        alt=""
        className="absolute top-0 left-0 w-20 opacity-20 animate-float pointer-events-none"
      />

      <div className="w-full max-w-lg flex items-center justify-between mb-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          পিছনে যান
        </button>
        <button
          onClick={() => setMuted(!muted)}
          className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold gold-text font-heading">
            আহলান ওয়া সাহলান, {addressee}! 🌙
          </h1>
          <p className="text-muted-foreground mt-1">🌙 ঈদ মোবারক 🌙</p>
        </div>

        {stage === "q1" && (
          <div className="card-festive p-6 animate-fade-in">
            <h2 className="text-lg font-bold emerald-text font-heading mb-4">
              {addressee}, সিয়াম আপনার কাছে কেমন {role}?
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => { setQ1Option("Siam"); playSound("pop"); setStage("q2"); }}
                className="w-full text-left px-5 py-4 rounded-xl border border-input bg-background hover:bg-muted transition-all text-foreground font-medium"
              >
                ১. ভালো মানুষ 😇
              </button>
              <button
                onClick={() => { setQ1Option("Option 1"); playSound("pop"); setStage("q2"); }}
                className="w-full text-left px-5 py-4 rounded-xl border border-input bg-background hover:bg-muted transition-all text-foreground font-medium"
              >
                ২. ১ নম্বর অপশনটি। 😏
              </button>
            </div>
          </div>
        )}

        {stage === "q2" && (
          <div className="card-festive p-6 animate-fade-in">
            <h2 className="text-lg font-bold emerald-text font-heading mb-4">
              এবার সত্যি করে বলুন তো, ঈদ উপলক্ষে বড়দের প্রধান দায়িত্ব কী?
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => { setQ2Option("Give respect to elders"); playSound("pop"); setStage("salami-choice"); }}
                className="w-full text-left px-5 py-4 rounded-xl border border-input bg-background hover:bg-muted transition-all text-foreground font-medium"
              >
                ক. ছোটদের সালামি দেওয়া 💸
              </button>
              <button
                onClick={() => { setQ2Option("Give salami only to Siam"); playSound("pop"); setStage("salami-choice"); }}
                className="w-full text-left px-5 py-4 rounded-xl border border-input bg-background hover:bg-muted transition-all text-foreground font-medium"
              >
                খ.শুধু সিয়ামকে সালামি দেওয়া। 🤑
              </button>
            </div>
          </div>
        )}

        {stage === "salami-choice" && (
          <div className="card-festive p-6 animate-fade-in">

            <div className="space-y-4">
              {!showFixedInput ? (
                <>
                  <button
                    onClick={() => handleSalamiChoice("income")}
                    className="btn-festive w-full text-base py-4 font-heading"
                  >
                    হ্যাঁ, ইনকামের ভিত্তিতে 📊
                  </button>
                  <button
                    onClick={() => handleSalamiChoice("fixed")}
                    className="w-full text-left px-5 py-4 rounded-xl border border-input bg-background hover:bg-muted transition-all text-foreground font-medium text-center"
                  >
                    না, টাকার পরিমাণ আমি নিজেই নির্ধারণ করতে চাই 🤷
                  </button>
                </>
              ) : (
                <div className="animate-fade-in space-y-4">
                  <h3 className="text-base font-medium text-foreground">সালামি কত টাকা দিতে চাচ্ছেন? 💰</h3>
                  <input
                    type="number"
                    value={incomeInput}
                    onChange={(e) => setIncomeInput(e.target.value)}
                    placeholder="যেমন- ৫০০০"
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all text-base"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowFixedInput(false); setIncomeInput(""); }}
                      className="w-1/3 px-4 py-3 rounded-xl border border-input bg-background text-foreground hover:bg-muted transition-all font-medium text-sm"
                    >
                      বাতিল
                    </button>
                    <button
                      onClick={handleFixedInputSubmit}
                      disabled={!incomeInput || parseInt(incomeInput) <= 0}
                      className="btn-festive w-2/3 text-base py-3 font-heading"
                    >
                      নিশ্চিত করুন ✅
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {stage === "income-input" && (
          <div className="card-festive p-6 animate-fade-in">
            <h2 className="text-lg font-bold emerald-text font-heading mb-4">
              আপনার মাসিক ইনকাম কত? 💰
            </h2>
            <input
              type="number"
              value={incomeInput}
              onChange={(e) => setIncomeInput(e.target.value)}
              placeholder="যেমন- ৮০০০০"
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all text-base mb-4"
            />
            <button
              onClick={handleIncomeSubmit}
              disabled={!incomeInput || parseInt(incomeInput) <= 0}
              className="btn-festive w-full text-base py-4 font-heading"
            >
              সালামি ক্যালকুলেট করুন 🧮
            </button>
          </div>
        )}



        {stage === "result" && (
          <div className="space-y-5 animate-fade-in">
            <div className="card-festive p-6 text-center">
              <h2 className="text-xl md:text-2xl font-bold gold-text font-heading mb-3">
                🎉 অভিনন্দন! সালামি ক্যালকুলেশন সম্পন্ন!
              </h2>
              <p className="text-foreground leading-relaxed mb-3">
                {addressee}, আপনার জন্য সালামি <span className="font-bold text-accent text-xl">{salamiAmount} টাকা</span> নির্ধারিত হয়েছে 😎
              </p>
              <p className="text-foreground leading-relaxed">
                আপনার সালামি এখনো <span className="font-bold text-destructive">পেন্ডিংয়ে</span> আছে।
                আপনার {role}-এর পকেটটা কিন্তু এখনো খালি পড়ে আছে!
                ঈদের আনন্দটা একটু বাড়িয়ে দিতে অতি দ্রুত নিচের নম্বরে সালামি পাঠিয়ে দিন। 💸
              </p>
            </div>

            <div className="card-festive p-6 text-center animate-pulse-glow">
              <p className="text-sm text-muted-foreground mb-1">বিকাশ (Personal)</p>
              <p className="text-2xl md:text-3xl font-bold emerald-text font-heading tracking-wider">
                01339539820
              </p>
              <div className="mt-4 inline-block bg-muted rounded-xl p-3">
                <p className="text-xs text-muted-foreground">📱 বিকাশ অ্যাপে Send Money করুন</p>
              </div>
            </div>

            <div className="space-y-3">
              {!confirmed ? (
                <button onClick={handleConfirm} className="btn-festive w-full text-base py-4 font-heading">
                  আমি সালামি পাঠিয়েছি ✅
                </button>
              ) : (
                <div className="card-festive p-6 text-center animate-fade-in">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald" />
                  <p className="text-lg font-bold emerald-text font-heading">
                    ধন্যবাদ {addressee} 😎
                  </p>
                  <p className="text-muted-foreground mt-1">
                    আপনার সালামি সিস্টেমে রেকর্ড করা হয়েছে।
                  </p>
                </div>
              )}

              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-input bg-background text-foreground hover:bg-muted transition-all font-medium"
              >
                <Share2 className="w-4 h-4" />
                অন্যদের সাথে শেয়ার করুন
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-8 text-center">
        © সালামি সিস্টেম ২০২৬
      </p>
    </div>
  );
};

export default GamePage;