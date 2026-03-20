import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import crescentDecoration from "@/assets/crescent-decoration.png";
import { Share2, CheckCircle, ArrowLeft, Volume2, VolumeX, Copy } from "lucide-react";
import { playPop, playCashRegister, playEntryFanfare, playOikire, playAww } from "@/lib/sounds";
import { saveInteraction, addMessage } from "@/lib/adminService";

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

const BKASH_NUMBER = "01339539820";


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
  const [muted, setMuted] = useState(() => {
    return localStorage.getItem("salami_muted") === "true";
  });

  const toggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    localStorage.setItem("salami_muted", newMuted.toString());
  };
  const [q1Option, setQ1Option] = useState("");
  const [q2Option, setQ2Option] = useState("");
  const [showFixedInput, setShowFixedInput] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [trxId, setTrxId] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isFinalSuccess, setIsFinalSuccess] = useState(false);

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



  const handleIncomeSubmit = () => {
    const income = parseInt(incomeInput);
    if (isNaN(income) || income <= 0) return;

    let computedSalami = 0;
    if (income >= 79999) {
      computedSalami = 1000;
    } else {
      computedSalami = 500;
    }

    setSalamiAmount(computedSalami);
    setIncomeInput(computedSalami.toString());
    setShowFixedInput(true);
    playSound("pop");
  };

  const handleFinalSubmit = async () => {
    const amount = parseInt(incomeInput) || salamiAmount;
    if (isNaN(amount) || amount <= 0) return;

    setIsSending(true);
    try {
      const res = await saveInteraction({
        visitorName: name,
        relation: relation,
        q1Option,
        q2Option,
        incomeOption: showFixedInput ? "fixed" : "income",
        incomeAmount: amount,
        finalSalami: amount,
        trxId: trxId.trim(),
        messages: messageText.trim() ? [{ text: messageText.trim() }] : []
      });

      if (res && res._id) {
        setSubmissionId(res._id);
        setIsFinalSuccess(true);
        fireConfetti();
        playSound("cash");
      }
    } catch (error) {
      console.error("Error saving interaction:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handlePayment = () => {
    const amount = parseInt(incomeInput) || salamiAmount;
    if (isNaN(amount) || amount <= 0) {
      alert("অনুগ্রহ করে সঠিক টাকার পরিমাণ লিখুন।");
      return;
    }

    const ua = navigator.userAgent.toLowerCase();
    const isAndroid = ua.indexOf("android") > -1;
    const isIOS = /ipad|iphone|ipod/.test(ua);

    if (isAndroid) {
      window.location.href = "intent://#Intent;scheme=bkash;package=com.bKash.customerapp;end";
    } else if (isIOS) {
      window.location.href = `bKash://app/transfer?receiver=${BKASH_NUMBER}&amount=${amount}`;
    } else {
      alert(`বিকাশ নম্বর: ${BKASH_NUMBER}\nঅনুগ্রহ করে এই নম্বরে ${amount} টাকা সেন্ড মানি করুন।`);
      return;
    }

    // Fallback timer
    setTimeout(() => {
      if (document.hasFocus()) {
        alert(`বিকাশ অ্যাপ ওপেন না হলে এই নম্বরে (${BKASH_NUMBER}) সেন্ড মানি করুন।`);
      }
    }, 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(BKASH_NUMBER);
    playSound("pop");
    alert("নম্বরটি কপি হয়েছে! ✅");
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
      {/* Success Animation Notification */}
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50 transition-all duration-700 ease-in-out transform ${showSuccessToast ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="bg-emerald text-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-white/20 flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full">
            <CheckCircle className="w-6 h-6" />
          </div>
          <p className="font-medium text-sm md:text-base leading-tight">
            <span className="font-bold underline">{name}</span>, আপনার মেসেজটি সফলভাবে সিয়ামের কাছে পৌঁছেছে। ধন্যবাদ!
          </p>
        </div>
      </div>

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
          onClick={toggleMute}
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
              আপনি এখন কী করতে চাচ্ছেন?
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => { setQ2Option("Give respect to elders"); playSound("pop"); setStage("salami-choice"); }}
                className="w-full text-left px-5 py-4 rounded-xl border border-input bg-background hover:bg-muted transition-all text-foreground font-medium"
              >
                ক. আমি এখন সিয়ামকে সালামি দিতে চাচ্ছি 💸
              </button>
              <button
                onClick={() => { setQ2Option("Give salami only to Siam"); playSound("pop"); setStage("salami-choice"); }}
                className="w-full text-left px-5 py-4 rounded-xl border border-input bg-background hover:bg-muted transition-all text-foreground font-medium"
              >
                খ. এক নম্বর অপশনে যার নাম আছে তাকে আমি সালামি দিতে চাচ্ছি। 🤑
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
                <div className="space-y-5">
                  {!isFinalSuccess ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-base font-medium text-foreground">সালামি কত টাকা দিতে চাচ্ছেন?</h3>
                        <input
                          type="number"
                          value={incomeInput}
                          onChange={(e) => setIncomeInput(e.target.value)}
                          placeholder="যেমন- ৫০০০"
                          className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-base font-medium text-foreground">মেসেজ (ঐচ্ছিক)</h3>
                        <textarea
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          placeholder="মেসেজ দিন..."
                          className="w-full px-4 py-3 rounded-xl border border-emerald/20 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald/50 transition-all text-sm min-h-[80px] resize-none festive-textarea"
                        />
                      </div>

                      <div className="pt-2 space-y-4">
                        <button
                          onClick={handlePayment}
                          className="w-full py-4 rounded-xl bg-[#D12053] text-white hover:bg-[#B01B46] transition-all font-bold font-heading flex items-center justify-center gap-2 shadow-lg scale-100 active:scale-95 transform"
                        >
                          বিকাশ থেকে সালামি পাঠান 💖
                        </button>
                        
                        <div className="space-y-3 pt-2">
                          <p className="text-sm font-medium text-muted-foreground text-center">
                            অ্যাপ ওপেন না হলে নিচের নম্বরটি কপি করে সেন্ড মানি করুন
                          </p>
                          <div className="flex items-center justify-between p-4 bg-rose-50/50 rounded-2xl border border-rose-100 shadow-sm animate-fade-in">
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase tracking-widest text-rose-400 font-bold mb-0.5 whitespace-nowrap">BKASH NUMBER</span>
                              <span className="text-xl md:text-2xl font-bold text-[#D12053] tracking-wider">{BKASH_NUMBER}</span>
                            </div>
                            <button 
                              onClick={handleCopy}
                              className="p-3 bg-white text-[#D12053] rounded-xl shadow-sm border border-rose-100 hover:bg-rose-50 transition-all active:scale-90 transform group"
                              title="Copy Number"
                            >
                              <Copy className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Transaction ID (ঐচ্ছিক)</h3>
                        <input
                          type="text"
                          value={trxId}
                          onChange={(e) => setTrxId(e.target.value)}
                          placeholder="যেমন- BK123456"
                          className="w-full px-4 py-2 rounded-lg border border-input bg-muted/30 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring transition-all text-sm"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => { setShowFixedInput(false); setIncomeInput(""); }}
                          className="w-1/4 px-4 py-3 rounded-xl border border-input bg-background text-foreground hover:bg-muted transition-all font-medium text-sm"
                        >
                          বাতিল
                        </button>
                        <button
                          onClick={handleFinalSubmit}
                          disabled={!incomeInput || parseInt(incomeInput) <= 0 || isSending}
                          className="btn-festive flex-1 text-base py-3 font-heading"
                        >
                          {isSending ? "জমা হচ্ছে..." : "আমি সালামি পাঠিয়েছি ✅"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 animate-scale-in">
                      <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald" />
                      <h2 className="text-2xl font-bold emerald-text font-heading mb-2">
                        ধন্যবাদ {addressee} 😎
                      </h2>
                      <p className="text-muted-foreground">
                        আপনার সালামি এবং মেসেজ সফলভাবে রেকর্ড করা হয়েছে।
                      </p>
                      <div className="flex flex-col gap-3 mt-6">
                        <button
                          onClick={handleShare}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-input bg-background text-foreground hover:bg-muted transition-all font-medium"
                        >
                          <Share2 className="w-4 h-4" />
                          অন্যদের সাথে শেয়ার করুন
                        </button>
                        <button
                          onClick={() => navigate("/")}
                          className="w-full py-3 rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 transition-all font-medium"
                        >
                          মূল পাতায় ফিরে যান
                        </button>
                      </div>
                    </div>
                  )}
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




      </div>

      <p className="text-xs text-muted-foreground mt-8 text-center">
        © সালামি সিস্টেম ২০২৬
      </p>
    </div>
  );
};

export default GamePage;