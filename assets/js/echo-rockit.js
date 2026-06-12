const state = {
  ctx: null,
  osc: null,
  resOsc: null,
  noise: null,
  noiseFilter: null,
  noiseGain: null,
  inputGain: null,
  resGain: null,
  filter: null,
  dryGain: null,
  delay: null,
  delayTone: null,
  feedback: null,
  wetGain: null,
  outputGain: null,
  lfoPhase: 0,
  wobblePhase: 0,
  lfoTimer: null,
  powered: false,
};

const $ = (id) => document.getElementById(id);

const controls = {
  powerButton: $("powerButton"),
  statusBox: $("statusBox"),
  inputLevel: $("inputLevel"),
  micLine: $("micLine"),
  cutoff: $("cutoff"),
  resonance: $("resonance"),
  echoVolume: $("echoVolume"),
  delayTime: $("delayTime"),
  echoRepeat: $("echoRepeat"),
  lfoRate: $("lfoRate"),
  lfoRange: $("lfoRange"),
  vcfModShape: $("vcfModShape"),
  vcfMod: $("vcfMod"),
  delayModShape: $("delayModShape"),
  delayMod: $("delayMod"),
  oscOn: $("oscOn"),
  oscRate: $("oscRate"),
  outputLevel: $("outputLevel"),
};

function number(control) {
  return Number(control.value);
}

function createNoiseSource(ctx) {
  const seconds = 2;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

function createAudioGraph() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioContextClass();

  const osc = ctx.createOscillator();
  osc.type = "square";

  const resOsc = ctx.createOscillator();
  resOsc.type = "sine";

  const noise = createNoiseSource(ctx);
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.value = 1800;
  noiseFilter.Q.value = 0.55;

  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0;

  const inputGain = ctx.createGain();
  const resGain = ctx.createGain();
  resGain.gain.value = 0;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";

  const dryGain = ctx.createGain();
  const delay = ctx.createDelay(1.2);
  const delayTone = ctx.createBiquadFilter();
  delayTone.type = "lowpass";
  delayTone.frequency.value = 3600;
  delayTone.Q.value = 0.65;

  const feedback = ctx.createGain();
  const wetGain = ctx.createGain();
  const outputGain = ctx.createGain();

  osc.connect(inputGain);
  inputGain.connect(filter);

  resOsc.connect(resGain);
  resGain.connect(filter);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(wetGain);

  filter.connect(dryGain);
  dryGain.connect(outputGain);

  filter.connect(delay);
  delay.connect(delayTone);
  delayTone.connect(feedback);
  feedback.connect(delay);
  delayTone.connect(wetGain);
  wetGain.connect(outputGain);

  outputGain.connect(ctx.destination);

  osc.start();
  resOsc.start();
  noise.start();

  state.ctx = ctx;
  state.osc = osc;
  state.resOsc = resOsc;
  state.noise = noise;
  state.noiseFilter = noiseFilter;
  state.noiseGain = noiseGain;
  state.inputGain = inputGain;
  state.resGain = resGain;
  state.filter = filter;
  state.dryGain = dryGain;
  state.delay = delay;
  state.delayTone = delayTone;
  state.feedback = feedback;
  state.wetGain = wetGain;
  state.outputGain = outputGain;
}

function triangle(phase) {
  return 2 * Math.abs(2 * (phase - Math.floor(phase + 0.5))) - 1;
}

function square(phase) {
  return phase % 1 < 0.5 ? 1 : -1;
}

function lfoValue(shape, phase) {
  return shape === "square" ? square(phase) : triangle(phase);
}

function applyControls() {
  if (!state.ctx) return;

  const now = state.ctx.currentTime;
  const micBoost = controls.micLine.value === "mic" ? 4 : 1;
  const oscEnabled = controls.oscOn.value === "on" ? 1 : 0;

  const vcfLfo = lfoValue(controls.vcfModShape.value, state.lfoPhase) * number(controls.vcfMod);
  const delayLfo = lfoValue(controls.delayModShape.value, state.lfoPhase) * number(controls.delayMod);

  const baseCutoff = number(controls.cutoff);
  const moddedCutoff = Math.max(60, Math.min(12000, baseCutoff + vcfLfo * 4200));
  const resAmount = number(controls.resonance);
  const selfResAmount = Math.max(0, Math.min(1, (resAmount - 13) / 5));
  const selfResGain = selfResAmount * selfResAmount * 0.055;

  const baseDelay = number(controls.delayTime);
  const cleanDelay = Math.max(0.02, Math.min(1.0, baseDelay + delayLfo * 0.12));
  const wobbleDepth = Math.max(0, Math.min(1, (cleanDelay - 0.12) / 0.56));
  const wobble = Math.sin(state.wobblePhase * Math.PI * 2) * 0.006 * wobbleDepth;
  const moddedDelay = Math.max(0.02, Math.min(1.0, cleanDelay + wobble));
  const darkness = Math.max(0, Math.min(1, moddedDelay / 0.68));
  const delayToneHz = Math.max(850, 5200 - darkness * 3600);
  const safeRepeat = Math.min(number(controls.echoRepeat), 0.78);
  const grainAmount = darkness * darkness;
  const noiseGrainGain = grainAmount * (0.0015 + safeRepeat * 0.0025);
  const noiseToneHz = 950 + darkness * 1700;

  state.osc.frequency.setTargetAtTime(number(controls.oscRate), now, 0.015);
  state.resOsc.frequency.setTargetAtTime(moddedCutoff, now, 0.02);
  state.resGain.gain.setTargetAtTime(selfResGain, now, 0.025);
  state.noiseFilter.frequency.setTargetAtTime(noiseToneHz, now, 0.05);
  state.noiseGain.gain.setTargetAtTime(noiseGrainGain, now, 0.05);
  state.inputGain.gain.setTargetAtTime(number(controls.inputLevel) * micBoost * oscEnabled * 0.18, now, 0.015);
  state.filter.frequency.setTargetAtTime(moddedCutoff, now, 0.02);
  state.filter.Q.setTargetAtTime(resAmount, now, 0.02);
  state.delay.delayTime.setTargetAtTime(moddedDelay, now, 0.04);
  state.delayTone.frequency.setTargetAtTime(delayToneHz, now, 0.04);
  state.feedback.gain.setTargetAtTime(safeRepeat, now, 0.02);
  state.wetGain.gain.setTargetAtTime(number(controls.echoVolume), now, 0.02);
  state.dryGain.gain.setTargetAtTime(0.65, now, 0.02);
  state.outputGain.gain.setTargetAtTime(number(controls.outputLevel), now, 0.02);

  controls.statusBox.textContent = `Power on | cutoff ${Math.round(moddedCutoff)} Hz | delay ${moddedDelay.toFixed(3)} s`;
}

function startLfo() {
  stopLfo();

  let last = performance.now();

  state.lfoTimer = window.setInterval(() => {
    if (!state.powered) return;

    const current = performance.now();
    const elapsedSeconds = (current - last) / 1000;
    last = current;

    const rateBase = number(controls.lfoRate);
    const rangeFactor = controls.lfoRange.value === "high" ? 1 : 0.12;
    const rate = rateBase * rangeFactor;

    state.lfoPhase = (state.lfoPhase + elapsedSeconds * rate) % 1;
    state.wobblePhase = (state.wobblePhase + elapsedSeconds * 0.23) % 1;
    applyControls();
  }, 24);
}

function stopLfo() {
  if (state.lfoTimer) {
    window.clearInterval(state.lfoTimer);
    state.lfoTimer = null;
  }
}

async function powerOn() {
  if (!state.ctx) {
    createAudioGraph();
  }

  await state.ctx.resume();
  state.powered = true;
  controls.powerButton.setAttribute("aria-pressed", "true");
  startLfo();
  applyControls();
}

function powerOff() {
  state.powered = false;
  controls.powerButton.setAttribute("aria-pressed", "false");
  stopLfo();

  if (state.outputGain && state.ctx) {
    state.outputGain.gain.setTargetAtTime(0, state.ctx.currentTime, 0.03);
  }

  controls.statusBox.textContent = "Power off";
}

controls.powerButton.addEventListener("click", () => {
  if (state.powered) {
    powerOff();
  } else {
    powerOn();
  }
});

Object.values(controls).forEach((control) => {
  if (!control || control === controls.powerButton || control === controls.statusBox) return;
  control.addEventListener("input", applyControls);
  control.addEventListener("change", applyControls);
});
