# MFOS Echo Rockit

Browser-based software version of the MFOS Echo Rockit sound producer / processor.

## v0.1 goal

Build a first working prototype with:

- internal square oscillator
- input level and mic/line gain mode
- resonant low-pass filter
- echo delay with repeat/feedback
- LFO modulation of filter cutoff
- LFO modulation of echo delay time
- output level control

## v0.2 goal

Improve panel readability and proportions without changing audio behaviour.

## Scope rule

This is not a VCV Rack module.

This repo is for the standalone browser app only.

## Not included yet

- exact PT2399 modelling
- long-delay noise behaviour
- dirty clock artefacts
- preset saving
- circuit-accurate simulation

## Manual test

Open `index.html` in a browser.

Expected behaviour:

- Power button starts audio.
- Internal Oscillator on makes sound.
- Cutoff and Resonance affect the filter.
- Delay Time, Echo Volume, and Echo Repeat affect the echo.
- LFO controls can move filter cutoff and delay time.

