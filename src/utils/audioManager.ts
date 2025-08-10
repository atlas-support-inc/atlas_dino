export type SoundEffect = 
  | 'jump' 
  | 'doubleJump' 
  | 'powerupCustomer' 
  | 'powerupAutomation' 
  | 'powerupAI' 
  | 'powerupKnowledge' 
  | 'death' 
  | 'dodge';

export type MusicTrack = 
  | 'background' 
  | 'speedBoost' 
  | 'invincible' 
  | 'gameOver';

class AudioManager {
  private sounds: Map<SoundEffect, HTMLAudioElement> = new Map();
  private music: Map<MusicTrack, HTMLAudioElement> = new Map();
  private currentMusic: HTMLAudioElement | null = null;
  private musicVolume: number = 0.3;
  private soundVolume: number = 0.7;
  private musicEnabled: boolean = true;
  private soundsEnabled: boolean = true;
  private powerupTimeouts: Set<NodeJS.Timeout> = new Set();

  constructor() {
    this.loadAudio();
  }

  private loadAudio() {
    const soundFiles: Record<SoundEffect, string> = {
      jump: '/audio/jump.mp3',
      doubleJump: '/audio/double-jump.mp3',
      powerupCustomer: '/audio/powerup-customer.mp3',
      powerupAutomation: '/audio/powerup-automation.mp3',
      powerupAI: '/audio/powerup-ai.mp3',
      powerupKnowledge: '/audio/powerup-knowledge.mp3',
      death: '/audio/death.mp3',
      dodge: '/audio/dodge.mp3',
    };

    const musicFiles: Record<MusicTrack, string> = {
      background: '/audio/background.mp3',
      speedBoost: '/audio/speed-boost.mp3',
      invincible: '/audio/powerup-ai.mp3', // Use existing powerup-ai.mp3 for invincible music
      gameOver: '/audio/game-over.mp3',
    };

    Object.entries(soundFiles).forEach(([key, src]) => {
      const audio = new Audio();
      audio.src = src;
      audio.volume = this.soundVolume;
      audio.preload = 'auto';
      audio.onerror = () => {
        console.warn(`Failed to load sound: ${src}`);
      };
      this.sounds.set(key as SoundEffect, audio);
    });

    Object.entries(musicFiles).forEach(([key, src]) => {
      const audio = new Audio();
      audio.src = src;
      audio.volume = this.musicVolume;
      audio.preload = 'auto';
      audio.loop = key !== 'gameOver';
      audio.onerror = () => {
        console.warn(`Failed to load music: ${src}`);
      };
      this.music.set(key as MusicTrack, audio);
    });
  }

  playSound(effect: SoundEffect) {
    if (!this.soundsEnabled) return;
    
    const audio = this.sounds.get(effect);
    if (audio && audio.src) { // Check if audio file was loaded successfully
      audio.currentTime = 0;
      audio.play().catch(() => {
        console.warn(`Failed to play sound: ${effect}`);
      });
    } else {
      console.warn(`Sound effect not available: ${effect}`);
    }
  }

  playMusic(track: MusicTrack, fadeIn: boolean = false) {
    if (!this.musicEnabled) return;

    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
    }

    const audio = this.music.get(track);
    if (audio && audio.src) { // Check if audio file was loaded successfully
      if (fadeIn) {
        audio.volume = 0;
        audio.play().catch(() => {
          console.warn(`Failed to play music: ${track}`);
        });
        this.fadeInMusic(audio);
      } else {
        audio.volume = this.musicVolume;
        audio.play().catch(() => {
          console.warn(`Failed to play music: ${track}`);
        });
      }
      this.currentMusic = audio;
    } else {
      console.warn(`Music track not available: ${track}`);
    }
  }

  stopMusic(fadeOut: boolean = false) {
    if (this.currentMusic) {
      if (fadeOut) {
        this.fadeOutMusic(this.currentMusic);
      } else {
        this.currentMusic.pause();
        this.currentMusic.currentTime = 0;
        this.currentMusic = null;
      }
    }
  }

  stopSpecificMusic(track: MusicTrack) {
    const audio = this.music.get(track);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      if (this.currentMusic === audio) {
        this.currentMusic = null;
      }
    }
  }

  stopAllMusic() {
    this.music.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    this.currentMusic = null;
  }

  transitionToMusic(track: MusicTrack, delay: number = 0) {
    if (!this.musicEnabled) return;

    // Clear any existing powerup timeouts
    this.powerupTimeouts.forEach(timeout => clearTimeout(timeout));
    this.powerupTimeouts.clear();

    if (delay > 0) {
      const timeout = setTimeout(() => {
        this.stopMusic();
        this.playMusic(track);
        this.powerupTimeouts.delete(timeout);
      }, delay);
      this.powerupTimeouts.add(timeout);
    } else {
      this.stopMusic();
      this.playMusic(track);
    }
  }

  private fadeInMusic(audio: HTMLAudioElement, duration: number = 1000) {
    const targetVolume = this.musicVolume;
    const steps = 50;
    const volumeStep = targetVolume / steps;
    const timeStep = duration / steps;

    let currentStep = 0;
    const fadeInterval = setInterval(() => {
      currentStep++;
      audio.volume = Math.min(volumeStep * currentStep, targetVolume);
      
      if (currentStep >= steps) {
        clearInterval(fadeInterval);
      }
    }, timeStep);
  }

  private fadeOutMusic(audio: HTMLAudioElement, duration: number = 500) {
    const initialVolume = audio.volume;
    const steps = 25;
    const volumeStep = initialVolume / steps;
    const timeStep = duration / steps;

    let currentStep = 0;
    const fadeInterval = setInterval(() => {
      currentStep++;
      audio.volume = Math.max(initialVolume - (volumeStep * currentStep), 0);
      
      if (currentStep >= steps) {
        clearInterval(fadeInterval);
        audio.pause();
        audio.currentTime = 0;
        audio.volume = initialVolume;
        if (this.currentMusic === audio) {
          this.currentMusic = null;
        }
      }
    }, timeStep);
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.music.forEach(audio => {
      audio.volume = this.musicVolume;
    });
    if (this.currentMusic) {
      this.currentMusic.volume = this.musicVolume;
    }
  }

  setSoundVolume(volume: number) {
    this.soundVolume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(audio => {
      audio.volume = this.soundVolume;
    });
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopAllMusic();
      // Clear any pending powerup timeouts
      this.powerupTimeouts.forEach(timeout => clearTimeout(timeout));
      this.powerupTimeouts.clear();
    }
  }

  setSoundsEnabled(enabled: boolean) {
    this.soundsEnabled = enabled;
  }

  getMusicVolume(): number {
    return this.musicVolume;
  }

  getSoundVolume(): number {
    return this.soundVolume;
  }

  isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  areSoundsEnabled(): boolean {
    return this.soundsEnabled;
  }
}

export const audioManager = new AudioManager();