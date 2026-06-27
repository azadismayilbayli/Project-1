let audioCtx = null;
let masterGain = null;
let musicGain = null;
let sfxGain = null;
let currentMelody = null;
let isPlaying = false;

export function initAudio() {
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.3;
        masterGain.connect(audioCtx.destination);

        musicGain = audioCtx.createGain();
        musicGain.gain.value = 0.4;
        musicGain.connect(masterGain);

        sfxGain = audioCtx.createGain();
        sfxGain.gain.value = 0.6;
        sfxGain.connect(masterGain);
    } catch (e) {}
}

export function resumeAudio() {
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playNote(freq, duration, startTime, gain, type = 'sine') {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const env = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0, startTime);
    env.gain.linearRampToValueAtTime(gain, startTime + 0.05);
    env.gain.exponentialRampToValueAtTime(0.001, startTime + duration - 0.05);
    osc.connect(env);
    env.connect(musicGain);
    osc.start(startTime);
    osc.stop(startTime + duration);
    return osc;
}

const SCALE = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];

export function playBGM() {
    if (!audioCtx || isPlaying) return;
    isPlaying = true;

    function playSequence() {
        if (!isPlaying) return;
        const now = audioCtx.currentTime;
        const melody = [
            [0, 0.8], [2, 0.8], [4, 0.8], [5, 0.8],
            [4, 0.8], [2, 0.8], [0, 1.6],
            [5, 0.8], [4, 0.8], [2, 0.8], [0, 0.8],
            [2, 0.8], [4, 0.8], [2, 1.6],
            [0, 0.8], [4, 0.8], [5, 0.8], [7, 0.8],
            [5, 0.8], [4, 0.8], [2, 1.6],
            [4, 0.8], [2, 0.8], [0, 0.8], [2, 0.8],
            [4, 0.8], [5, 0.8], [0, 1.6]
        ];

        let t = now;
        for (const [note, dur] of melody) {
            playNote(SCALE[note] * 0.5, dur * 0.9, t, 0.15, 'triangle');
            playNote(SCALE[note], dur * 0.9, t, 0.08, 'sine');
            t += dur;
        }

        let bt = now;
        for (let i = 0; i < melody.length; i += 2) {
            const bassNote = SCALE[melody[i][0]] * 0.25;
            playNote(bassNote, 1.5, bt, 0.12, 'sine');
            bt += melody[i][1] + (melody[i + 1] ? melody[i + 1][1] : 0);
        }

        const totalDuration = melody.reduce((s, [, d]) => s + d, 0);
        currentMelody = setTimeout(() => playSequence(), totalDuration * 1000);
    }

    playSequence();
}

export function stopBGM() {
    isPlaying = false;
    if (currentMelody) clearTimeout(currentMelody);
}

export function playSFX(type) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    switch (type) {
        case 'click':
            playNote(800, 0.1, now, 0.2, 'square');
            break;
        case 'move':
            playNote(400, 0.15, now, 0.15, 'triangle');
            playNote(500, 0.15, now + 0.08, 0.15, 'triangle');
            break;
        case 'attack':
            playNote(200, 0.3, now, 0.3, 'sawtooth');
            playNote(150, 0.2, now + 0.1, 0.25, 'square');
            playNote(100, 0.3, now + 0.2, 0.2, 'sawtooth');
            break;
        case 'build':
            playNote(523, 0.15, now, 0.15, 'triangle');
            playNote(659, 0.15, now + 0.15, 0.15, 'triangle');
            playNote(784, 0.2, now + 0.3, 0.15, 'triangle');
            break;
        case 'research':
            playNote(440, 0.2, now, 0.1, 'sine');
            playNote(554, 0.2, now + 0.2, 0.1, 'sine');
            playNote(659, 0.3, now + 0.4, 0.12, 'sine');
            break;
        case 'victory':
            [523, 659, 784, 1047].forEach((f, i) => playNote(f, 0.4, now + i * 0.2, 0.15, 'triangle'));
            break;
        case 'defeat':
            [400, 350, 300, 200].forEach((f, i) => playNote(f, 0.5, now + i * 0.3, 0.15, 'sine'));
            break;
        case 'turn':
            playNote(600, 0.15, now, 0.12, 'triangle');
            playNote(800, 0.2, now + 0.15, 0.12, 'triangle');
            break;
        case 'capture':
            [400, 500, 600, 800].forEach((f, i) => playNote(f, 0.2, now + i * 0.12, 0.15, 'triangle'));
            break;
    }
}

export function setVolume(v) {
    if (masterGain) masterGain.gain.value = v;
}
