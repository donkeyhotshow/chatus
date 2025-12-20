"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    motion, AnimatePresence
} from 'framer-motion';
import { Mic, MicOff, Play, Pause, Send, Trash2, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
    onSend: (audioBlob: Blob, duration: number) => void;
    onCancel?: () => void;
    maxDuration?: number; // в секундах
    className?: string;
}

interface AudioVisualizerProps {
    isRecording: boolean;
    audioData?: number[];
    className?: string;
}

// Компонент визуализации аудио
function AudioVisualizer({ isRecording, audioData, className }: AudioVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = () => {
            const width = canvas.width;
            const height = canvas.height;

            ctx.clearRect(0, 0, width, height);

            if (isRecording) {
                // Рисуем анимированные волны во время записи
                const time = Date.now() * 0.005;
                const barCount = 20;
                const barWidth = width / barCount;

                ctx.fillStyle = '#06b6d4';

                for (let i = 0; i < barCount; i++) {
                    const barHeight = Math.sin(time + i * 0.5) * 20 + 30;
                    const x = i * barWidth;
                    const y = (height - barHeight) / 2;

                    ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
                }
            } else if (audioData) {
                // Рисуем статичную волну для записанного аудио
                const barCount = Math.min(audioData.length, 50);
                const barWidth = width / barCount;

                ctx.fillStyle = '#4ade80';

                for (let i = 0; i < barCount; i++) {
                    const barHeight = (audioData[i] || 0) * height * 0.8;
                    const x = i * barWidth;
                    const y = (height - barHeight) / 2;

                    ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
                }
            }

            if (isRecording) {
                animationRef.current = requestAnimationFrame(draw);
            }
        };

        if (isRecording) {
            draw();
        } else {
            draw();
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isRecording, audioData]);

    return (
        <canvas
            ref={canvasRef}
            width={300}
            height={60}
            className={cn("w-full h-15 rounded-lg bg-neutral-800", className)}
        />
    );
}

export function VoiceRecorder({
    onSend,
    onCancel,
    maxDuration = 300, // 5 минут по умолчанию
    className
}: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [audioData, setAudioData] = useState<number[]>([]);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // Проверка разрешений на микрофон
    useEffect(() => {
        checkMicrophonePermission();
    }, []);

    const checkMicrophonePermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setHasPermission(true);
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            console.error('Microphone permission denied:', error);
            setHasPermission(false);
        }
    };

    // Форматирование времени
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Начало записи
    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100
                }
            });

            // Создаем MediaRecorder
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            // Создаем AudioContext для визуализации
            const audioContext = new AudioContext();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);

            analyser.fftSize = 256;
            source.connect(analyser);

            audioContextRef.current = audioContext;
            analyserRef.current = analyser;

            chunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));

                // Анализируем аудио для визуализации
                analyzeAudio(blob);

                // Останавливаем все треки
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start(100); // Записываем чанки каждые 100мс

            setIsRecording(true);
            setDuration(0);

            // Запускаем таймер
            timerRef.current = setInterval(() => {
                setDuration(prev => {
                    const newDuration = prev + 1;
                    if (newDuration >= maxDuration) {
                        stopRecording();
                    }
                    return newDuration;
                });
            }, 1000);

            // Вибрация при начале записи
            if ('vibrate' in navigator) {
                navigator.vibrate([50, 30, 50]);
            }

        } catch (error) {
            console.error('Failed to start recording:', error);
            setHasPermission(false);
        }
    }, [maxDuration]);

    // Остановка записи
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }

            // Вибрация при остановке записи
            if ('vibrate' in navigator) {
                navigator.vibrate(30);
            }
        }
    }, [isRecording]);

    // Анализ аудио для визуализации
    const analyzeAudio = async (blob: Blob) => {
        try {
            const audioContext = new AudioContext();
            const arrayBuffer = await blob.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            const channelData = audioBuffer.getChannelData(0);
            const samples = 50;
            const blockSize = Math.floor(channelData.length / samples);
            const data: number[] = [];

            for (let i = 0; i < samples; i++) {
                const start = i * blockSize;
                let sum = 0;

                for (let j = 0; j < blockSize; j++) {
                    sum += Math.abs(channelData[start + j]);
                }

                data.push(sum / blockSize);
            }

            setAudioData(data);
        } catch (error) {
            console.error('Failed to analyze audio:', error);
        }
    };

    // Воспроизведение записи
    const playRecording = useCallback(() => {
        if (audioUrl && audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play();
                setIsPlaying(true);
            }
        }
    }, [audioUrl, isPlaying]);

    // Отправка записи
    const sendRecording = useCallback(() => {
        if (audioBlob && duration > 0) {
            onSend(audioBlob, duration);

            // Очищаем состояние
            setAudioBlob(null);
            setAudioUrl(null);
            setAudioData([]);
            setDuration(0);

            // Вибрация при отправке
            if ('vibrate' in navigator) {
                navigator.vibrate([30, 10, 30]);
            }
        }
    }, [audioBlob, duration, onSend]);

    // Отмена записи
    const cancelRecording = useCallback(() => {
        if (isRecording) {
            stopRecording();
        }

        // Очищаем состояние
        setAudioBlob(null);
        setAudioUrl(null);
        setAudioData([]);
        setDuration(0);

        onCancel?.();
    }, [isRecording, stopRecording, onCancel]);

    // Очистка при размонтировании
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [audioUrl]);

    // Если нет разрешения на микрофон
    if (hasPermission === false) {
        return (
            <div className={cn("p-4 bg-neutral-800 rounded-xl border border-neutral-600", className)}>
                <div className="text-center">
                    <MicOff className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <h3 className="text-white font-medium mb-2">Нет доступа к микрофону</h3>
                    <p className="text-neutral-400 text-sm mb-4">
                        Разрешите доступ к микрофону для записи голосовых сообщений
                    </p>
                    <button
                        onClick={checkMicrophonePermission}
                        className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                    >
                        Проверить снова
                    </button>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={cn("p-4 bg-neutral-800 rounded-xl border border-neutral-600", className)}
        >
            {/* Визуализатор аудио */}
            <div className="mb-4">
                <AudioVisualizer
                    isRecording={isRecording}
                    audioData={audioData}
                />
            </div>

            {/* Информация о записи */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    {isRecording && (
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="w-3 h-3 bg-red-500 rounded-full"
                        />
                    )}
                    <span className="text-white font-mono text-lg">
                        {formatTime(duration)}
                    </span>
                    {maxDuration && (
                        <span className="text-neutral-400 text-sm">
                            / {formatTime(maxDuration)}
                        </span>
                    )}
                </div>

                {audioBlob && (
                    <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-neutral-400" />
                        <span className="text-neutral-400 text-sm">
                            {Math.round((audioBlob.size / 1024))} KB
                        </span>
                    </div>
                )}
            </div>

            {/* Элементы управления */}
            <div className="flex items-center justify-center gap-3">
                {!isRecording && !audioBlob && (
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={startRecording}
                        disabled={hasPermission === null}
                        className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full flex items-center justify-center shadow-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50"
                    >
                        <Mic className="w-8 h-8" />
                    </motion.button>
                )}

                {isRecording && (
                    <>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={stopRecording}
                            className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                        >
                            <div className="w-4 h-4 bg-white rounded-sm" />
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={cancelRecording}
                            className="w-12 h-12 bg-neutral-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-neutral-700 transition-colors"
                        >
                            <Trash2 className="w-5 h-5" />
                        </motion.button>
                    </>
                )}

                {audioBlob && (
                    <>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={playRecording}
                            className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors"
                        >
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={sendRecording}
                            className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full flex items-center justify-center shadow-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-200"
                        >
                            <Send className="w-5 h-5" />
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={cancelRecording}
                            className="w-12 h-12 bg-neutral-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-neutral-700 transition-colors"
                        >
                            <Trash2 className="w-5 h-5" />
                        </motion.button>
                    </>
                )}
            </div>

            {/* Скрытый аудио элемент для воспроизведения */}
            {audioUrl && (
                <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    onPause={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    style={{ display: 'none' }}
                />
            )}

            {/* Подсказки */}
            <AnimatePresence>
                {!isRecording && !audioBlob && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mt-3 text-center"
                    >
                        <p className="text-neutral-400 text-sm">
                            Нажмите и удерживайте для записи
                        </p>
                    </motion.div>
                )}

                {isRecording && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mt-3 text-center"
                    >
                        <p className="text-red-400 text-sm">
                            Запись... Отпустите для остановки
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
