# MFOS Echo Rockit

Browser-based software version of the MFOS Echo Rockit sound producer / processor.

## Current status

**Current version: v0.8 Stable Prototype candidate**

This repo is now in a stabilisation phase.

Do not add new features until the v0.8 test gates are complete.

Open test-gate issues:

- #8 — VCF Cutoff closes properly at minimum
- #9 — Basic MIDI input/output
- #10 — MIDI Learn for CC mapping
- #11 — v0.8 Stable Prototype test, document, and freeze

## Scope rule

This is not a VCV Rack module.

This repo is for the standalone browser app only.

Do not convert this into a framework project unless there is a specific later reason.

## Implemented features

### Sound engine

- Internal square oscillator
- Input Level control
- Mic / Line gain mode
- Resonant low-pass VCF
- High-RES self-resonance helper
- Cutoff close gain so the filter can shut down more convincingly
- Dry signal path
- Echo delay path
- Echo feedback / repeat control
- Echo volume control
- Darker repeats at longer delay times
- Subtle long-delay movement
- Very subtle delay noise/grain behind the wet path
- Output Level control

### Modulation

- Shared LFO
- LFO Rate control
- Low / High LFO range
- Triangle / Square VCF modulation shape
- VCF Mod amount
- Triangle / Square echo-delay modulation shape
- Echo Delay Mod amount

### MIDI

- Web MIDI enable button
- MIDI In selector
- MIDI Out selector
- MIDI Note On controls internal oscillator pitch/gate
- MIDI Note Off closes the MIDI-triggered gate
- MIDI velocity affects oscillator/input strength modestly
- MIDI output pass-through for incoming Note On, Note Off, and CC messages
- Default MIDI CC mappings
- MIDI Learn target selector
- Learn Next CC button
- Clear Learned CCs button
- Learned CC mappings saved in browser local storage

## Default MIDI CC mappings

- CC 74 → Cutoff
- CC 71 → RES
- CC 12 → Echo Volume
- CC 13 → Echo Repeat
- CC 1 → VCF Mod amount

Learned mappings override these defaults until cleared.

## Browser notes

Open `index.html` in a browser.

For audio-only testing, most modern browsers should work.

For MIDI testing, use a browser with Web MIDI support, such as Chrome or Edge. Browser support is not equal across all browsers.

## v0.8 test checklist

### Audio stability

- [ ] Power button starts audio.
- [ ] Internal Oscillator on makes sound.
- [ ] Cutoff at minimum is nearly silent.
- [ ] Raising Cutoff opens smoothly.
- [ ] RES high produces self-resonance.
- [ ] VCF Mod moves the filter and resonance pitch.
- [ ] Delay Time changes the echo timing.
- [ ] Echo Volume changes the wet level.
- [ ] Echo Repeat changes feedback without a dangerous volume blast.
- [ ] Long delay is darker/rougher than short delay.
- [ ] Delay grain does not hiss when Cutoff is closed.

### MIDI In / Out

- [ ] Enable MIDI requests permission.
- [ ] MIDI In selector populates.
- [ ] MIDI Out selector populates when an output exists.
- [ ] MIDI Note On plays the internal oscillator at the incoming note pitch.
- [ ] MIDI Note Off stops the MIDI-triggered sound.
- [ ] Velocity changes strength slightly.
- [ ] CC 74 moves Cutoff.
- [ ] CC 71 moves RES.
- [ ] CC 12 moves Echo Volume.
- [ ] CC 13 moves Echo Repeat.
- [ ] CC 1 moves VCF Mod.
- [ ] Incoming notes/CCs pass through to selected MIDI Out.

### MIDI Learn

- [ ] Choose a Learn Target.
- [ ] Press Learn Next CC.
- [ ] Move a MIDI knob/fader.
- [ ] That CC controls the chosen target.
- [ ] Refreshing the page keeps the learned mapping.
- [ ] Clear Learned CCs removes learned mappings.
- [ ] Default CC behaviour works again after clearing.

## Known limits

- This is not exact PT2399 chip modelling.
- This is not circuit-accurate simulation.
- There is no preset saving yet.
- There is no MIDI clock sync yet.
- There is no MIDI learn import/export yet.
- There is no audio recording/export yet.
- MIDI support depends on browser Web MIDI support.

## Freeze rule

The next milestone is **v0.8 Stable Prototype**, not another feature version.

Only do bug fixes, tests, and documentation until:

- #8 is tested and closed
- #9 is tested and closed
- #10 is tested and closed
- #11 is closed as the v0.8 freeze record
