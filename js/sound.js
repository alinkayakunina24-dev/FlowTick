// Sounds made right in the browser (Web Audio), so no audio files are needed:
//   Sound.ambient(scene)  — endless nature sound: calm, ocean, rain, storm, fire, birds,
//                           or a recording "assets/sounds/<name>.m4a" (falls back to a synth sound)
//   Sound.stopAmbient(token) — stops it; with a token, only if that sound is still the one playing
//   Sound.chime()         — soft bell when a session ends
//   Sound.breathStart() / breath(phase, seconds) / breathStop() — sea waves that follow the breath
// Browsers only allow sound after a tap, so these are called from button handlers.

window.Sound = (function () {
  let ctx = null;
  let ambient = null;
  let counter = 0;

  function audio() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  // A few seconds of looping noise. Brown noise is deep (ocean), pink is softer, white is bright (rain).
  function noise(color) {
    const c = audio();
    const length = c.sampleRate * 4;
    const buffer = c.createBuffer(1, length, c.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      if (color === "brown") {
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      } else if (color === "pink") {
        b0 = 0.99765 * b0 + white * 0.099046;
        b1 = 0.963 * b1 + white * 0.2965164;
        b2 = 0.57 * b2 + white * 1.0526913;
        data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.11;
      } else {
        data[i] = white * 0.5;
      }
    }
    const src = c.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    return src;
  }

  function filter(type, frequency, q = 0.7) {
    const f = audio().createBiquadFilter();
    f.type = type;
    f.frequency.value = frequency;
    f.Q.value = q;
    return f;
  }

  // Slowly swing a value up and down (waves, wind)
  function lfo(target, rate, depth) {
    const c = audio();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.frequency.value = rate;
    gain.gain.value = depth;
    osc.connect(gain).connect(target);
    osc.start();
    return osc;
  }

  // Short sounds that happen now and then: drops, crackles, birds, crickets
  function sprinkle(out, every, make) {
    const timer = setInterval(() => {
      if (Math.random() < 0.7) make(out);
    }, every);
    return () => clearInterval(timer);
  }

  function blip(out, { freq, to = freq, length = 0.05, volume = 0.05, type = "sine" }) {
    const c = audio();
    const osc = c.createOscillator();
    const gain = c.createGain();
    const t = c.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + length);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.connect(gain).connect(out);
    osc.start(t);
    osc.stop(t + length + 0.02);
  }

  const SCENES = {
    rain(out) {
      const src = noise("white");
      src.connect(filter("highpass", 900)).connect(filter("lowpass", 7000)).connect(out);
      src.start();
      const stopDrops = sprinkle(out, 90, (o) => blip(o, { freq: 2200 + Math.random() * 2500, to: 900, length: 0.03, volume: 0.03 }));
      return () => { src.stop(); stopDrops(); };
    },
    ocean(out) {
      const src = noise("brown");
      const swell = audio().createGain();
      swell.gain.value = 0.6;
      const wave = lfo(swell.gain, 0.09, 0.45);
      src.connect(filter("lowpass", 700)).connect(swell).connect(out);
      src.start();
      return () => { src.stop(); wave.stop(); };
    },
    fire(out) {
      const src = noise("brown");
      src.connect(filter("lowpass", 1000)).connect(out);
      src.start();
      const stopCrackle = sprinkle(out, 120, (o) => blip(o, { freq: 3000 + Math.random() * 3000, to: 1200, length: 0.015, volume: 0.06, type: "square" }));
      return () => { src.stop(); stopCrackle(); };
    },
    // Gentle sea: soft, slow swells
    calm(out) {
      const src = noise("brown");
      const swell = audio().createGain();
      swell.gain.value = 0.45;
      const wave = lfo(swell.gain, 0.06, 0.25);
      src.connect(filter("lowpass", 450)).connect(swell).connect(out);
      src.start();
      return () => { src.stop(); wave.stop(); };
    },
    // Storm: heavy rain with distant thunder rolling in now and then
    storm(out) {
      const rain = noise("white");
      rain.connect(filter("highpass", 600)).connect(filter("lowpass", 5000)).connect(out);
      rain.start();
      const c = audio();
      const timer = setInterval(() => {
        if (Math.random() > 0.35) return;
        const rumble = noise("brown");
        const g = c.createGain();
        const t = c.currentTime;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(1.6, t + 0.4 + Math.random() * 0.6);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 4 + Math.random() * 3);
        rumble.connect(filter("lowpass", 160)).connect(g).connect(out);
        rumble.start(t);
        rumble.stop(t + 8);
      }, 4000);
      return () => { rain.stop(); clearInterval(timer); };
    },
    // Birds: a quiet breeze and birdsong
    birds(out) {
      const src = noise("pink");
      const soft = audio().createGain();
      soft.gain.value = 0.35;
      src.connect(filter("lowpass", 1800)).connect(soft).connect(out);
      src.start();
      const stopBirds = sprinkle(out, 900, (o) => {
        const base = 2400 + Math.random() * 1800;
        const notes = 2 + Math.floor(Math.random() * 4);
        for (let i = 0; i < notes; i++) {
          setTimeout(() => blip(o, { freq: base * (1 + (Math.random() - 0.5) * 0.3), to: base * (1.2 + Math.random() * 0.4), length: 0.08 + Math.random() * 0.08, volume: 0.02 }), i * 130);
        }
      });
      return () => { src.stop(); stopBirds(); };
    },
  };

  // Smoothly move a media element's volume (0…1) over some seconds
  function fadeMedia(el, to, seconds, then) {
    clearInterval(el._fade);
    const from = el.volume;
    const start = performance.now();
    el._fade = setInterval(() => {
      const k = Math.min(1, (performance.now() - start) / (seconds * 1000));
      el.volume = Math.max(0, Math.min(1, from + (to - from) * k));
      if (k === 1) {
        clearInterval(el._fade);
        if (then) then();
      }
    }, 40);
  }

  // A real recording (assets/sounds/*.m4a or .mp3) played by the browser's own audio player, looped.
  // It starts right inside the tap, which browsers always allow; a synth sound stands in if it fails.
  // Some browsers (e.g. the one built into VS Code) can't play AAC (.m4a); they get the .wav twin
  const canPlayAac = !!new Audio().canPlayType('audio/mp4; codecs="mp4a.40.2"');
  const wavOf = (url) => url.replace(/\.m4a(\?|$)/, ".wav$1");

  // keepToken: a fallback keeps the original sound's token, so it can still be stopped by it
  function recordingPlay(url, volume, fallback, triedWav = false, keepToken = 0) {
    if (!canPlayAac) url = wavOf(url);
    const el = new Audio(url);
    el.loop = true;
    el.volume = 0;
    const token = keepToken || ++counter;
    ambient = { media: el, scene: url, token, volume };
    const toSynth = () => {
      // Only the element that is playing right now may switch to a fallback (errors can fire twice)
      if (!ambient || ambient.token !== token || ambient.media !== el) return;
      ambient = null;
      // The .m4a didn't play: try its .wav twin before falling back to a synth sound
      if (!triedWav && /\.m4a(\?|$)/.test(url)) {
        recordingPlay(wavOf(url), volume, fallback, true, token);
        return;
      }
      ambientPlay(SCENES[fallback] ? fallback : "calm", volume);
      if (ambient) ambient.token = token;
    };
    el.addEventListener("error", toSynth);
    // Fade up to the current volume (it may have changed, e.g. muted, while the file was starting)
    el.play().then(() => {
      if (ambient && ambient.token === token) fadeMedia(el, ambient.volume, 1.5);
    }).catch(toSynth);
    return token;
  }

  // scene: a synth name (rain, ocean…) or a recording path ending in .m4a/.mp3 (synth "calm" if it fails)
  function ambientPlay(scene, volume = 0.6, fallback = "calm") {
    stopAmbient();
    if (/\.(mp3|m4a)(\?|$)/.test(scene)) return recordingPlay(scene, volume, fallback);
    const c = audio();
    const out = c.createGain();
    out.gain.setValueAtTime(0.0001, c.currentTime);
    out.gain.exponentialRampToValueAtTime(volume, c.currentTime + 1.5);
    out.connect(c.destination);
    const stop = SCENES[scene](out);
    ambient = { out, stop, scene, token: ++counter };
    return ambient.token;
  }

  // stopAmbient() stops whatever plays; stopAmbient(token) only that sound (an empty token stops nothing)
  function stopAmbient(...args) {
    const token = args[0];
    if (args.length && token == null) return;
    if (!ambient || (token && ambient.token !== token)) return;
    const { out, stop, media } = ambient;
    ambient = null;
    if (media) {
      fadeMedia(media, 0, 0.8, () => {
        media.pause();
        media.removeAttribute("src");
        media.load();
      });
      return;
    }
    const c = audio();
    out.gain.cancelScheduledValues(c.currentTime);
    out.gain.setValueAtTime(out.gain.value, c.currentTime);
    out.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.8);
    setTimeout(() => { stop(); out.disconnect(); }, 900);
  }

  function setVolume(volume) {
    if (!ambient) return;
    ambient.volume = volume;
    if (ambient.media) fadeMedia(ambient.media, Math.max(0, Math.min(1, volume)), 0.2);
    else ambient.out.gain.setTargetAtTime(Math.max(0.0001, volume), audio().currentTime, 0.2);
  }

  function chime() {
    const c = audio();
    [528, 792, 1056].forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      const t = c.currentTime + i * 0.18;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.12 / (i + 1), t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 3);
      osc.connect(gain).connect(c.destination);
      osc.start(t);
      osc.stop(t + 3.1);
    });
  }

  // Breathing with the sound of the sea: a wave rolls in while you breathe in,
  // stays while you hold, and washes out while you breathe out.
  let sea = null;

  function breathStart() {
    breathStop();
    const c = audio();
    const src = noise("brown");
    const tone = filter("lowpass", 300, 0.5);
    const gain = c.createGain();
    gain.gain.value = 0.0001;
    src.connect(tone).connect(gain).connect(c.destination);
    src.start();
    sea = { src, tone, gain };
  }

  function breath(phase, seconds) {
    if (!sea || !seconds) return;
    const t = audio().currentTime;
    const level = { in: 0.9, hold: 0.55, out: 0.08 }[phase];
    const bright = { in: 1400, hold: 800, out: 280 }[phase];
    sea.gain.gain.cancelScheduledValues(t);
    sea.gain.gain.setValueAtTime(Math.max(0.0001, sea.gain.gain.value), t);
    sea.gain.gain.exponentialRampToValueAtTime(level, t + seconds * 0.9);
    sea.tone.frequency.cancelScheduledValues(t);
    sea.tone.frequency.setValueAtTime(sea.tone.frequency.value, t);
    sea.tone.frequency.exponentialRampToValueAtTime(bright, t + seconds * 0.9);
  }

  function breathStop() {
    if (!sea) return;
    const { src, gain } = sea;
    const t = audio().currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1);
    setTimeout(() => src.stop(), 1100);
    sea = null;
  }

  return {
    ambient: ambientPlay,
    stopAmbient,
    setVolume,
    chime,
    breath,
    breathStart,
    breathStop,
    playing: () => (ambient ? ambient.scene : null),
  };
})();
