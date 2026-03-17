// Web Audio API-based sound effects — no external files needed

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

const isMuted = () => typeof window !== 'undefined' && localStorage.getItem("salami_muted") === "true";

export function playPop() {
  if (isMuted()) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.12);
  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}

export function playCashRegister() {
  if (isMuted()) return;
  const ctx = getCtx();
  const now = ctx.currentTime;

  // "Ka-ching" bell hit
  const osc1 = ctx.createOscillator();
  const g1 = ctx.createGain();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(1800, now);
  osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
  g1.gain.setValueAtTime(0.3, now);
  g1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  osc1.connect(g1).connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.35);

  // Second bell ping
  const osc2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(2400, now + 0.08);
  g2.gain.setValueAtTime(0.2, now + 0.08);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  osc2.connect(g2).connect(ctx.destination);
  osc2.start(now + 0.08);
  osc2.stop(now + 0.5);

  // Noise burst for the "drawer" sound
  const bufferSize = ctx.sampleRate * 0.15;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.15;
  }
  const noise = ctx.createBufferSource();
  const ng = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 3000;
  noise.buffer = noiseBuffer;
  ng.gain.setValueAtTime(0.15, now + 0.05);
  ng.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  noise.connect(filter).connect(ng).connect(ctx.destination);
  noise.start(now + 0.05);
}

export function playEntryFanfare() {
  if (isMuted()) return;
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Fun ascending melody — 4 quick notes
  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    const t = now + i * 0.12;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  });

  const shimmer = ctx.createOscillator();
  const sg = ctx.createGain();
  shimmer.type = "sine";
  const st = now + 0.48;
  shimmer.frequency.setValueAtTime(1047, st);
  shimmer.frequency.exponentialRampToValueAtTime(1400, st + 0.4);
  sg.gain.setValueAtTime(0.12, st);
  sg.gain.exponentialRampToValueAtTime(0.001, st + 0.6);
  shimmer.connect(sg).connect(ctx.destination);
  shimmer.start(st);
  shimmer.stop(st + 0.6);
}

// এক্সটার্নাল ফাইল প্লে করার জন্য ফাংশনগুলো আপডেট করা হলো
export function playSalam() {
  if (isMuted()) return Promise.resolve();
  const audio = new Audio("/salam.mp3");
  return audio.play(); // Return promise to handle in components
}

export function playOikire() {
  if (isMuted()) return Promise.resolve();
  const audio = new Audio("/oikire.mp3");
  return audio.play();
}

export function playAww() {
  if (isMuted()) return Promise.resolve();
  const audio = new Audio("/Aww.mp3");
  return audio.play();
}