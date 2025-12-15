export class GameSoundService {
  private sounds: { [key: string]: HTMLAudioElement } = {};

  constructor() {
    // Preload sounds if available in /public/sounds
    try {
      this.sounds.move = new Audio('/sounds/move.mp3');
      this.sounds.win = new Audio('/sounds/victory.mp3');
      this.sounds.lose = new Audio('/sounds/defeat.mp3');
      this.sounds.draw = new Audio('/sounds/draw.mp3');
      this.sounds.tick = new Audio('/sounds/tick.mp3');
      this.sounds.error = new Audio('/sounds/error.mp3');
    } catch {
      // Silently ignore during SSR or missing files
    }
  }

  play(sound: keyof GameSoundService['sounds']) {
    const audio = this.sounds[sound];
    if (audio) {
      try {
        audio.currentTime = 0;
        void audio.play();
      } catch {
        // Silently ignore play failures (user interaction required)
      }
    }

    // Vibration feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      switch (sound) {
        case 'move':
          navigator.vibrate(50);
          break;
        case 'win':
          navigator.vibrate([100, 50, 100, 50, 200]);
          break;
        case 'lose':
          navigator.vibrate([200, 100, 200]);
          break;
        case 'error':
          navigator.vibrate([50, 50, 50]);
          break;
      }
    }
  }

  setVolume(volume: number) {
    Object.values(this.sounds).forEach((audio) => {
      if (audio) audio.volume = volume;
    });
  }
}

export const soundService = new GameSoundService();


