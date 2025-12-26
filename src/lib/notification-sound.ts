/**
 * NotificationSound - Web Audio API based notification system
 * P3 Fix: Добавление звуковых уведомлений для чата
 */

export class NotificationSound {
    private audioContext: AudioContext | null = null;
    private enabled: boolean = true;
    private sound: AudioBuffer | null = null;
    private initialized: boolean = false;

    constructor() {
        this.loadFromStorage();
    }

    private init(): void {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.loadSound();
            this.initialized = true;
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }
    }

    private loadSound(): void {
        if (!this.audioContext) return;

        // Create a pleasant notification beep
        const duration = 0.15;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        // Generate a pleasant two-tone notification sound
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            // Smooth envelope to avoid clicks
            const envelope = Math.sin(Math.PI * i / buffer.length);
            // Two frequencies for a pleasant sound
            const freq1 = 880; // A5
            const freq2 = 1100; // C#6
            const wave = 0.5 * Math.sin(2 * Math.PI * freq1 * t) +
                        0.3 * Math.sin(2 * Math.PI * freq2 * t);
            data[i] = envelope * 0.25 * wave;
        }

        this.sound = buffer;
    }

    async play(): Promise<void> {
        if (!this.enabled) return;

        // Initialize on first play (requires user interaction)
        if (!this.initialized) {
            this.init();
        }

        if (!this.audioContext || !this.sound) return;

        // Resume context if suspended (browser autoplay policy)
        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch {
                return;
            }
        }

        try {
            const source = this.audioContext.createBufferSource();
            source.buffer = this.sound;

            // Add gain node for volume control
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = 0.5;

            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            source.start();
        } catch (error) {
            console.warn('Failed to play notification sound:', error);
        }
    }

    setEnabled(value: boolean): void {
        this.enabled = value;
        try {
            localStorage.setItem('chatus-sound-notifications', String(value));
        } catch {
            // localStorage might not be available
        }
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    private loadFromStorage(): void {
        try {
            const saved = localStorage.getItem('chatus-sound-notifications');
            if (saved !== null) {
                this.enabled = saved === 'true';
            }
        } catch {
            // localStorage might not be available
        }
    }

    // Test sound for settings panel
    async testSound(): Promise<void> {
        const wasEnabled = this.enabled;
        this.enabled = true;
        await this.play();
        this.enabled = wasEnabled;
    }
}

// Singleton instance
let notificationSoundInstance: NotificationSound | null = null;

export function getNotificationSound(): NotificationSound {
    if (!notificationSoundInstance) {
        notificationSoundInstance = new NotificationSound();
    }
    return notificationSoundInstance;
}
