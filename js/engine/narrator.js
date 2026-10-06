// Narration: plays a recorded clip if one is provided, otherwise falls back
// to the browser's built-in text-to-speech. Captions are handled elsewhere.

export class Narrator {
  constructor() {
    this.enabled = true;
    this.synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.token = 0;
    this.done = true;
    this.voice = null;
    if (this.synth) {
      const pick = () => { this.voice = this.pickVoice(); };
      pick();
      this.synth.addEventListener?.('voiceschanged', pick);
    }
  }

  pickVoice() {
    const voices = this.synth.getVoices().filter(v => /^en(-|_|$)/i.test(v.lang));
    const prefer = [/natural/i, /google us english/i, /samantha/i, /aria/i, /jenny/i, /guy/i, /google uk english female/i, /daniel/i];
    for (const re of prefer) { const v = voices.find(v => re.test(v.name)); if (v) return v; }
    return voices.find(v => /en-US/i.test(v.lang)) || voices[0] || null;
  }

  /** Must be called from a tap/click so iOS allows speech and audio later. */
  unlock() {
    if (this.synth) {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      this.synth.speak(u);
    }
    this.audio.muted = true;
    this.audio.play().catch(() => {}).finally(() => { this.audio.pause(); this.audio.muted = false; });
  }

  say(text, audioSrc) {
    this.stop();
    const tok = ++this.token;
    this.done = false;
    if (!this.enabled || !text) { this.done = true; return; }
    const finish = () => { if (tok === this.token) this.done = true; };
    if (audioSrc) {
      this.audio.src = audioSrc;
      this.audio.onended = finish;
      this.audio.onerror = () => { if (tok === this.token) this.speak(text, tok, finish); };
      this.audio.play().catch(() => { if (tok === this.token) this.speak(text, tok, finish); });
    } else {
      this.speak(text, tok, finish);
    }
  }

  speak(text, tok, finish) {
    if (!this.synth) { finish(); return; }
    // Chrome cuts off long utterances, so speak one sentence at a time.
    const parts = text.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) || [text];
    let i = 0;
    const next = () => {
      if (tok !== this.token) return;
      if (i >= parts.length) { finish(); return; }
      const u = new SpeechSynthesisUtterance(parts[i++].trim());
      if (this.voice) u.voice = this.voice;
      u.lang = this.voice?.lang || 'en-US';
      u.rate = 0.98;
      u.onend = next;
      u.onerror = next;
      this.synth.speak(u);
    };
    next();
  }

  stop() {
    this.token++;
    if (this.synth) this.synth.cancel();
    this.audio.onended = this.audio.onerror = null;
    if (!this.audio.paused) this.audio.pause();
    this.done = true;
  }

  setEnabled(on) {
    this.enabled = on;
    if (!on) this.stop();
  }

  /** Rough reading time in seconds, used when speech is off or silent. */
  static estimate(text) {
    const words = String(text || '').split(/\s+/).filter(Boolean).length;
    return words / 2.6 + 1.2;
  }
}
