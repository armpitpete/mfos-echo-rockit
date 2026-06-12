# MFOS Echo Rockit

Browser-based software version of the MFOS Echo Rockit sound producer / processor.

## Current status

**Current version: v0.8 Stable Prototype**

The v0.8 test gates have passed.

This repo is now in a feature freeze unless a specific bug is found.

Closed test-gate issues:

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

## v0.8 passed test checklist

### Audio stability

- [x] Power button starts audio.
- [x] Internal Oscillator on makes sound.
- [x] Cutoff at minimum is nearly silent.
- [x] Raising Cutoff opens smoothly.
- [x] RES high produces self-resonance.
- [x] VCF Mod moves the filter and resonance pitch.
- [x] Delay Time changes the echo timing.
- [x] Echo Volume changes the wet level.
- [x] Echo Repeat changes feedback without a dangerous volume blast.
- [x] Long delay is darker/rougher than short delay.
- [x] Delay grain does not hiss when Cutoff is closed.

### MIDI In / Out

- [x] Enable MIDI requests permission.
- [x] MIDI In selector populates.
- [x] MIDI Out selector populates when an output exists.
- [x] MIDI Note On plays the internal oscillator at the incoming note pitch.
- [x] MIDI Note Off stops the MIDI-triggered sound.
- [x] Velocity changes strength slightly.
- [x] CC 74 moves Cutoff.
- [x] CC 71 moves RES.
- [x] CC 12 moves Echo Volume.
- [x] CC 13 moves Echo Repeat.
- [x] CC 1 moves VCF Mod.
- [x] Incoming notes/CCs pass through to selected MIDI Out.

### MIDI Learn

- [x] Choose a Learn Target.
- [x] Press Learn Next CC.
- [x] Move a MIDI knob/fader.
- [x] That CC controls the chosen target.
- [x] Refreshing the page keeps the learned mapping.
- [x] Clear Learned CCs removes learned mappings.
- [x] Default CC behaviour works again after clearing.

## Known limits

- This is not exact PT2399 chip modelling.
- This is not circuit-accurate simulation.
- There is no preset saving yet.
- There is no MIDI clock sync yet.
- There is no MIDI learn import/export yet.
- There is no audio recording/export yet.
- MIDI support depends on browser Web MIDI support.

## Freeze rule

The current milestone is **v0.8 Stable Prototype**.

Do not add another feature version unless there is a clear new issue and a specific reason to break the freeze.

Allowed work during freeze:

- bug fixes
- small documentation corrections
- compatibility fixes
- safety fixes

Avoid during freeze:

- MIDI clock
- presets
- panel redesign
- more echo modelling
- sequencer sync
- framework conversion
