class Metro {
  isPlaying = false;

  async start() {
    console.log('starting...')
    if (this.isPlaying) return;

    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      this.gainNode = this.audioContext.createGain();
      this.filter = this.audioContext.createBiquadFilter();
      this.filter.type = 'bandpass';

      this.filter.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.isPlaying = true;
    console.log('audio context start time: ' + this.audioContext.currentTime)
    this.nextNoteTime = this.audioContext.currentTime + 0.1;
    this.beatDurationSeconds = .1;
    await this.playLoop();
  }

  async playLoop() {
    console.log(this.nextNoteTime)

    while (this.isPlaying) {
      // -- mid beat
      // play next beat (by scheduling at exact time)
      this.playClickAtTime(this.nextNoteTime)
      this.nextNoteTime += this.beatDurationSeconds;

      const nextMidBeatTime = this.nextNoteTime - this.beatDurationSeconds / 2
      console.log(`nextNote time: ${this.nextNoteTime}`)
      const timeUntilNextMidBeat = nextMidBeatTime - this.audioContext.currentTime
      console.log(`time until next midbeat ${timeUntilNextMidBeat}`)
      console.log(`audio context current time ${this.audioContext.currentTime}`)

      // sleep until next mid-beat
      await new Promise(r => setTimeout(r, timeUntilNextMidBeat * 1000));
    }
  }

  playClickAtTime(time) {
    console.log(`playing click at time ${time}`)
    const clickParams = {
      frequency: 2500,
      waveform: 'sine',
      filterFrequency: 2500,
      filterQ: 1.0,
      gain: 1.0,
      attack: 0.001,
      decay: 0.03
    }

    const osc = this.audioContext.createOscillator();
    osc.type = clickParams.waveform;
    osc.frequency.value = clickParams.frequency;

    osc.connect(this.filter);

    this.filter.frequency.value = clickParams.filterFrequency;
    this.filter.Q.value = clickParams.filterQ;

    this.gainNode.gain.setValueAtTime(0, time);
    this.gainNode.gain.linearRampToValueAtTime(clickParams.gain, time + clickParams.attack);
    this.gainNode.gain.exponentialRampToValueAtTime(0.001, time + clickParams.decay);

    osc.start(time);
    osc.stop(time + clickParams.decay);
  }


  stop() {
    this.isPlaying = false;
  }
}
