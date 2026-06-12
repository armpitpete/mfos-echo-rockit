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
  vcfCloseGain: null,
  dryGain: null,
  delay: null,
  delayTone: null,
  feedback: null,
  wetGain: null,
  outputGain: null,
  midiAccess: null,
  midiInput: null,
  midiOutput: null,
  midiEnabled: false,
  midiNote: null,
  midiVelocity: 0,
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
  midiEnableButton: $("midiEnableButton"),
  midiInSelect: $("midiInSelect"),
  midiOutSelect: $("midiOutSelect"),
  midiStatus: $("midiStatus"),
};

function number(control) {
  return Number(control.value);
}

function smoothstep(value) {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}

function midiNoteToFrequency(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function setMidiStatus(message) {
  if (controls.midiStatus) {
    controls.midiStatus.textContent = message;
  }
}

function setControlFromMidi(control, value) {
  const min = Number(control.min ?? 0);
  const max = Number(control.max ?? 1);
  const scaled = min + (value / 127) * (max - min);
  control.value = String(scaled);
  control.dispatchEvent(new Event("input", { bubbles: true }));
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

  const vcfCloseGain = ctx.createGain();
  vcfCloseGain.gain.value = 1;

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

  filter.connect(vcfCloseGain);

  vcfCloseGain.connect(dryGain);
  dryGain.connect(outputGain);

  vcfCloseGain.connect(delay);
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
  state.vcfCloseGain = vcfCloseGain;
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
  const manualOscEnabled = controls.oscOn.value === "on" ? 1 : 0;
  const midiActive = state.midiEnabled && state.midiNote !== null;
  const oscGate = state.midiEnabled ? (midiActive ? 1 : 0) : manualOscEnabled;
  const velocityGain = state.midiEnabled ? Math.max(0.2, state.midiVelocity) : 1;
  const oscFrequency = midiActive ? midiNoteToFrequency(state.midiNote) : number(controls.oscRate);

  const vcfLfo = lfoValue(controls.vcfModShape.value, state.lfoPhase) * number(controls.vcfMod);
  const delayLfo = lfoValue(controls.delayModShape.value, state.lfoPhase) * number(controls.delayMod);

  const baseCutoff = number(controls.cutoff);
  const moddedCutoff = Math.max(20, Math.min(12000, baseCutoff + vcfLfo * 4200));
  const vcfOpen = smoothstep((moddedCutoff - 35) / 260);
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
  const noiseGrainGain = grainAmount * vcfOpen * (0.0015 + safeRepeat * 0.0025);
  const noiseToneHz = 950 + darkness * 1700;

  state.osc.frequency.setTargetAtTime(oscFrequency, now, 0.015);
  state.resOsc.frequency.setTargetAtTime(moddedCutoff, now, 0.02);
  state.resGain.gain.setTargetAtTime(selfResGain, now, 0.025);
  state.noiseFilter.frequency.setTargetAtTime(noiseToneHz, now, 0.05);
  state.noiseGain.gain.setTargetAtTime(noiseGrainGain, now, 0.05);
  state.inputGain.gain.setTargetAtTime(number(controls.inputLevel) * micBoost * oscGate * velocityGain * 0.18, now, 0.015);
  state.filter.frequency.setTargetAtTime(moddedCutoff, now, 0.02);
  state.filter.Q.setTargetAtTime(resAmount, now, 0.02);
  state.vcfCloseGain.gain.setTargetAtTime(vcfOpen, now, 0.025);
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

function populateMidiDevices() {
  if (!state.midiAccess) return;

  const currentInputId = controls.midiInSelect.value;
  const currentOutputId = controls.midiOutSelect.value;

  controls.midiInSelect.innerHTML = '<option value="">No MIDI input</option>';
  controls.midiOutSelect.innerHTML = '<option value="">No MIDI output</option>';

  state.midiAccess.inputs.forEach((input) => {
    const option = document.createElement("option");
    option.value = input.id;
    option.textContent = input.name || `Input ${input.id}`;
    controls.midiInSelect.appendChild(option);
  });

  state.midiAccess.outputs.forEach((output) => {
    const option = document.createElement("option");
    option.value = output.id;
    option.textContent = output.name || `Output ${output.id}`;
    controls.midiOutSelect.appendChild(option);
  });

  if (currentInputId && state.midiAccess.inputs.has(currentInputId)) {
    controls.midiInSelect.value = currentInputId;
  }

  if (currentOutputId && state.midiAccess.outputs.has(currentOutputId)) {
    controls.midiOutSelect.value = currentOutputId;
  }

  selectMidiInput();
  selectMidiOutput();
}

function selectMidiInput() {
  if (state.midiInput) {
    state.midiInput.onmidimessage = null;
  }

  const inputId = controls.midiInSelect.value;
  state.midiInput = inputId && state.midiAccess ? state.midiAccess.inputs.get(inputId) : null;

  if (state.midiInput) {
    state.midiInput.onmidimessage = handleMidiMessage;
    setMidiStatus(`MIDI in: ${state.midiInput.name || "selected"}`);
  }
}

function selectMidiOutput() {
  const outputId = controls.midiOutSelect.value;
  state.midiOutput = outputId && state.midiAccess ? state.midiAccess.outputs.get(outputId) : null;

  if (state.midiOutput) {
    setMidiStatus(`MIDI out: ${state.midiOutput.name || "selected"}`);
  }
}

function handleMidiMessage(message) {
  const data = Array.from(message.data);
  const [status, data1, data2 = 0] = data;
  const command = status & 0xf0;

  if (state.midiOutput && (command === 0x90 || command === 0x80 || command === 0xb0)) {
    state.midiOutput.send(data);
  }

  if (command === 0x90 && data2 > 0) {
    state.midiNote = data1;
    state.midiVelocity = data2 / 127;
    setMidiStatus(`Note on ${data1} | velocity ${data2}`);
    applyControls();
    return;
  }

  if (command === 0x80 || (command === 0x90 && data2 === 0)) {
    if (state.midiNote === data1) {
      state.midiNote = null;
      state.midiVelocity = 0;
    }
    setMidiStatus(`Note off ${data1}`);
    applyControls();
    return;
  }

  if (command === 0xb0) {
    handleMidiCc(data1, data2);
  }
}

function handleMidiCc(controller, value) {
  const ccMap = {
    1: controls.vcfMod,
    12: controls.echoVolume,
    13: controls.echoRepeat,
    71: controls.resonance,
    74: controls.cutoff,
  };

  const control = ccMap[controller];

  if (!control) {
    setMidiStatus(`CC ${controller} received`);
    return;
  }

  setControlFromMidi(control, value);
  setMidiStatus(`CC ${controller} -> ${control.id}`);
}

async function enableMidi() {
  if (!navigator.requestMIDIAccess) {
    setMidiStatus("Web MIDI not supported in this browser");
    return;
  }

  try {
    state.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
    state.midiEnabled = true;
    controls.midiEnableButton.setAttribute("aria-pressed", "true");
    controls.midiInSelect.disabled = false;
    controls.midiOutSelect.disabled = false;
    state.midiAccess.onstatechange = populateMidiDevices;
    populateMidiDevices();
    setMidiStatus("MIDI enabled. Select input/output.");
    applyControls();
  } catch (error) {
    setMidiStatus(`MIDI blocked: ${error.message}`);
  }
}

controls.powerButton.addEventListener("click", () => {
  if (state.powered) {
    powerOff();
  } else {
    powerOn();
  }
});

if (controls.midiEnableButton) {
  controls.midiEnableButton.addEventListener("click", enableMidi);
}

if (controls.midiInSelect) {
  controls.midiInSelect.addEventListener("change", selectMidiInput);
}

if (controls.midiOutSelect) {
  controls.midiOutSelect.addEventListener("change", selectMidiOutput);
}

Object.values(controls).forEach((control) => {
  if (!control || control === controls.powerButton || control === controls.statusBox || control === controls.midiEnableButton || control === controls.midiStatus) return;
  control.addEventListener("input", applyControls);
  control.addEventListener("change", applyControls);
});
