class Metronome {
  constructor() {
    this.audioContext = null;
    this.gainNode = null;
    this.filter = null;
    this.currentBeatIndex = 0;
    this.currentSubdivisionIndex = 0;
    this.isPlaying = false;
    this.tempo = 120;
    this.nextNoteTime = 0;
    this.numberOfBeats = 4;
    this.subdivisions = 3;
    this.beatPattern = this.createInitialPattern();
    this.currentSoundPack = soundPacks['woodblock'];

    this.setupTheme();
    this.setupEventListeners();
    this.createBeatGrid();
  }

  setupTheme() {

    const themeToggle = document.querySelector('.theme-toggle');
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');

    const getPreferredTheme = () => {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const setTheme = (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);

      if (theme === 'dark') {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
      } else {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
      }
    };

    setTheme(getPreferredTheme());

    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  createInitialPattern() {
    return Array(this.numberOfBeats).fill().map(() => {
      const high = Array(this.subdivisions).fill(false)
      const low = Array(this.subdivisions).fill(false)
      high[0] = true
      return {
        high,
        low,
      }
    });
  }

  setupEventListeners() {
    const bpmSlider = document.getElementById('bpm');
    const bpmValue = document.getElementById('bpm-value');
    bpmSlider.addEventListener('input', (e) => {
      this.tempo = parseInt(e.target.value);
      bpmValue.textContent = this.tempo;
    });

    const beatsSlider = document.getElementById('beats');
    const beatsValue = document.getElementById('beats-value');
    beatsSlider.addEventListener('input', (e) => {
      const newBeats = parseInt(e.target.value);
      this.updateBeatPattern(newBeats, this.subdivisions);
      beatsValue.textContent = newBeats;
    });

    const subdivSlider = document.getElementById('subdivisions');
    const subdivValue = document.getElementById('subdivisions-value');
    subdivSlider.addEventListener('input', (e) => {
      const newSubdivs = parseInt(e.target.value);
      this.updateBeatPattern(this.numberOfBeats, newSubdivs);
      subdivValue.textContent = newSubdivs;
    });

    const playButton = document.getElementById('playButton');
    playButton.addEventListener('click', async () => {
      if (this.isPlaying) {
        this.stop();
      } else {
        await this.start();
      }
    });

    const plusOneBpmButton = document.getElementById('plusOneBpm');
    plusOneBpmButton.addEventListener('click', () => {
      this.tempo += 1
      bpmValue.textContent = this.tempo;
      document.getElementById('bpm').value = this.tempo;
    });

    const minusOneBpmButton = document.getElementById('minusOneBpm');
    minusOneBpmButton.addEventListener('click', () => {
      this.tempo -= 1
      bpmValue.textContent = this.tempo;
      document.getElementById('bpm').value = this.tempo;
    });

    const plusFiveBpmButton = document.getElementById('plusFiveBpm');
    plusFiveBpmButton.addEventListener('click', () => {
      this.tempo += 5
      bpmValue.textContent = this.tempo;
      document.getElementById('bpm').value = this.tempo;
    });

    const minusFiveBpmButton = document.getElementById('minusFiveBpm');
    minusFiveBpmButton.addEventListener('click', () => {
      this.tempo -= 5
      bpmValue.textContent = this.tempo;
      document.getElementById('bpm').value = this.tempo;
    });


    document.getElementById('soundPacks').addEventListener('change', (e) => {
      this.currentSoundPack = soundPacks[e.target.value] || soundPacks['woodblock'];
    });

    document.getElementById('patternPresets').addEventListener('change', (e) => {
      const preset = presets[e.target.value];
      if (preset) {
        document.getElementById('beats').value = preset.beats;
        document.getElementById('subdivisions').value = preset.subdivisions;
        this.updateBeatPattern(preset.beats, preset.subdivisions);
        this.beatPattern = JSON.parse(JSON.stringify(preset.pattern));
        this.createBeatGrid();
      }
    });

  }

  updateBeatPattern(newBeats, newSubdivs) {
    const newPattern = Array(newBeats).fill().map((_, beatIndex) => ({
      high: Array(newSubdivs).fill(false),
      low: Array(newSubdivs).fill(false)
    }));

    // Copy existing patterns where possible
    for (let beat = 0; beat < Math.min(newBeats, this.numberOfBeats); beat++) {
      for (let sub = 0; sub < Math.min(newSubdivs, this.subdivisions); sub++) {
        if (beat < this.beatPattern.length) {
          newPattern[beat].high[sub] = this.beatPattern[beat].high[sub] || false;
          newPattern[beat].low[sub] = this.beatPattern[beat].low[sub] || false;
        }
      }
    }

    this.numberOfBeats = newBeats;
    this.subdivisions = newSubdivs;
    this.beatPattern = newPattern;
    this.createBeatGrid();
  }

  createBeatGrid() {
    const grid = document.getElementById('beatGrid');
    grid.innerHTML = '';

    for (let beat = 0; beat < this.numberOfBeats; beat++) {
      const beatContainer = document.createElement('div');
      beatContainer.className = 'beat-container';

      // High pitch row
      const highSubdivContainer = document.createElement('div');
      highSubdivContainer.className = 'subdivision-container';
      for (let sub = 0; sub < this.subdivisions; sub++) {
        const button = document.createElement('button');
        button.className = `beat-button high${this.beatPattern[beat].high[sub] ? ' active' : ''}`;
        button.addEventListener('click', () => {
          this.beatPattern[beat].high[sub] = !this.beatPattern[beat].high[sub];
          button.classList.toggle('active');
        });
        highSubdivContainer.appendChild(button);
      }

      // Low pitch row
      const lowSubdivContainer = document.createElement('div');
      lowSubdivContainer.className = 'subdivision-container';
      for (let sub = 0; sub < this.subdivisions; sub++) {
        const button = document.createElement('button');
        button.className = `beat-button low${this.beatPattern[beat].low[sub] ? ' active' : ''}`;
        button.addEventListener('click', () => {
          this.beatPattern[beat].low[sub] = !this.beatPattern[beat].low[sub];
          button.classList.toggle('active');
        });
        lowSubdivContainer.appendChild(button);
      }

      beatContainer.appendChild(highSubdivContainer);
      beatContainer.appendChild(lowSubdivContainer);
      grid.appendChild(beatContainer);
    }

    this.updateActiveBeatAndSubdivisionVisual(0, 0);
  }

  async start() {
    if (this.isPlaying) return;

    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      this.gainNode = this.audioContext.createGain();
      this.filter = this.audioContext.createBiquadFilter();
      this.filter.type = 'bandpass';

      this.filter.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);
    }

    this.isPlaying = true;
    this.currentBeatIndex = 0;
    this.currentSubdivisionIndex = 0;
    this.nextNoteTime = this.audioContext.currentTime + 0.1;
    document.getElementById('playButton').classList.add('playing');
    document.getElementById('playButton').textContent = 'Pause';
    await this.playLoop();
  }

  stop() {
    this.isPlaying = false;
    document.getElementById('playButton').classList.remove('playing');
    document.getElementById('playButton').textContent = 'Play'
    this.clearCurrentBeatVisual();
  }


  async playLoop() {
    while (this.isPlaying) {
      if (this.beatPattern[this.currentBeatIndex].high[this.currentSubdivisionIndex]) {
        this.playClick(this.nextNoteTime, 'high');
      }
      if (this.beatPattern[this.currentBeatIndex].low[this.currentSubdivisionIndex]) {
        this.playClick(this.nextNoteTime, 'low');
      }

      this.nextNoteTime += this.getSubdivisionDuration();
      this.incrementBeatAndSubdivisionIndex();
      this.scheduleVisualUpdateAtNotePlayTime(this.currentBeatIndex, this.currentSubdivisionIndex);

      const nextMidBeatTime = this.nextNoteTime - this.getSubdivisionDuration() / 2
      const timeUntilNextMidBeat = nextMidBeatTime - this.audioContext.currentTime

      await new Promise(r => setTimeout(r, timeUntilNextMidBeat * 1000));
    }
  }

  scheduleVisualUpdateAtNotePlayTime(beatIndex, subdivisionIndex) {
    setTimeout(
        () => this.updateActiveBeatAndSubdivisionVisual(beatIndex, subdivisionIndex),
        (this.nextNoteTime - this.audioContext.currentTime) * 1000
    );

  }

  getSubdivisionDuration() {
    const secondsPerBeat = 60.0 / this.tempo;
    return secondsPerBeat / this.subdivisions;
  }

  incrementBeatAndSubdivisionIndex() {
    this.currentSubdivisionIndex++;
    if (this.currentSubdivisionIndex >= this.subdivisions) {
      this.currentSubdivisionIndex = 0;
      this.currentBeatIndex = (this.currentBeatIndex + 1) % this.numberOfBeats;
    }
  }

  playClick(time, type) {
    const soundPack = this.currentSoundPack;
    const clickParams = type === 'high' ? soundPack.high : soundPack.low;

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

  clearCurrentBeatVisual() {
    const buttons = document.querySelectorAll('.beat-button');
    buttons.forEach(button => button.classList.remove('current'));
  }

  updateActiveBeatAndSubdivisionVisual(beatIndex, subdivisionIndex) {
    if (!this.isPlaying) return;

    this.clearCurrentBeatVisual();
    const currentHighButton = document.querySelector(`.beat-container:nth-child(${beatIndex + 1}) .subdivision-container:first-child .beat-button:nth-child(${subdivisionIndex + 1})`);
    const currentLowButton = document.querySelector(`.beat-container:nth-child(${beatIndex + 1}) .subdivision-container:last-child .beat-button:nth-child(${subdivisionIndex + 1})`);

    if (currentHighButton) currentHighButton.classList.add('current');
    if (currentLowButton) currentLowButton.classList.add('current');
  }
}


const soundPacks = {
  woodblock: {
    high: {
      frequency: 2500,
      waveform: 'sine',
      filterFrequency: 2500,
      filterQ: 1.0,
      gain: 1.0,
      attack: 0.001,
      decay: 0.03
    },
    low: {
      frequency: 1500,
      waveform: 'sine',
      filterFrequency: 1500,
      filterQ: 0.7,
      gain: 0.8,
      attack: 0.001,
      decay: 0.03
    }
  },
  electronic: {
    high: {
      frequency: 800,
      waveform: 'square',
      filterFrequency: 1200,
      filterQ: 2.0,
      gain: 1.0,
      attack: 0.002,
      decay: 0.05
    },
    low: {
      frequency: 400,
      waveform: 'square',
      filterFrequency: 600,
      filterQ: 1.5,
      gain: 0.5,
      attack: 0.002,
      decay: 0.05
    }
  },
  dry: {
    high: {
      frequency: 2500,
      waveform: 'triangle',
      filterFrequency: 4000,
      filterQ: 0.5,
      gain: 1.0,
      attack: 0.0005,
      decay: 0.02
    },
    low: {
      frequency: 1500,
      waveform: 'triangle',
      filterFrequency: 2500,
      filterQ: 0.5,
      gain: 0.6,
      attack: 0.0005,
      decay: 0.02
    }
  },
  cowbell: {
    high: {
      frequency: 1047,
      waveform: 'square',
      filterFrequency: 3000,
      filterQ: 3.5,
      gain: 1.0,
      attack: 0.003,
      decay: 0.05
    },
    low: {
      frequency: 587,
      waveform: 'square',
      filterFrequency: 1800,
      filterQ: 3.0,
      gain: 0.75,
      attack: 0.003,
      decay: 0.05
    }
  },
  dropplets: {
    high: {
      frequency: 4000,
      waveform: 'square',
      filterFrequency: 5000,
      filterQ: 8.0,
      gain: 1.0,
      attack: 0.0001,
      decay: 0.015
    },
    low: {
      frequency: 2800,
      waveform: 'square',
      filterFrequency: 3500,
      filterQ: 6.0,
      gain: 0.8,
      attack: 0.0001,
      decay: 0.012
    }
  },
  beep: {
    high: {
      frequency: 1000,
      waveform: 'sine',
      filterFrequency: 1000,
      filterQ: 0.3,
      gain: 1.0,
      attack: 0.005,
      decay: 0.08
    },
    low: {
      frequency: 600,
      waveform: 'sine',
      filterFrequency: 600,
      filterQ: 0.3,
      gain: 0.5,
      attack: 0.005,
      decay: 0.08
    }
  },
  xylo: {
    high: {
      frequency: 5000,
      waveform: 'sawtooth',
      filterFrequency: 8000,
      filterQ: 1.5,
      gain: 1.0,
      attack: 0.001,
      decay: 0.04
    },
    low: {
      frequency: 3000,
      waveform: 'sawtooth',
      filterFrequency: 5000,
      filterQ: 1.2,
      gain: 0.8,
      attack: 0.001,
      decay: 0.04
    }
  },
  deep: {
    high: {
      frequency: 220,
      waveform: 'sine',
      filterFrequency: 440,
      filterQ: 2.0,
      gain: 1.0,
      attack: 0.005,
      decay: 0.05
    },
    low: {
      frequency: 110,
      waveform: 'sine',
      filterFrequency: 220,
      filterQ: 1.5,
      gain: 0.8,
      attack: 0.005,
      decay: 0.05
    }
  }
};

const presets = {
  standard: {
    beats: 4,
    subdivisions: 3,
    pattern: [
      {high: [true, false, false], low: [false, false, false]},
      {high: [true, false, false], low: [false, false, false]},
      {high: [true, false, false], low: [false, false, false]},
      {high: [true, false, false], low: [false, false, false]}
    ]
  },
  waltz: {
    beats: 3,
    subdivisions: 3,
    pattern: [
      {high: [true, false, false], low: [false, false, false]},
      {high: [false, false, false], low: [true, false, false]},
      {high: [false, false, false], low: [true, false, false]}
    ]
  },
  practice: {
    beats: 4,
    subdivisions: 3,
    pattern: [
      {high: [true, false, false], low: [false, false, true]},
      {high: [false, false, false], low: [false, true, true]},
      {high: [false, false, false], low: [false, true, false]},
      {high: [false, false, false], low: [true, false, false]}
    ]
  },
  bossa: {
    beats: 8,
    subdivisions: 2,
    pattern: [
      {high: [true, false], low: [false, false]},
      {high: [false, false], low: [false, true]},
      {high: [false, false], low: [false, false]},
      {high: [false, false], low: [true, false]},
      {high: [false, false], low: [false, false]},
      {high: [false, false], low: [true, false]},
      {high: [false, false], low: [false, true]},
      {high: [false, false], low: [false, false]},
    ]
  }
};

new Metronome();
