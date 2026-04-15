/**
 * Beethoven Audio Tool — Web Audio API for Music Note Analysis
 * ──────────────────────────────────────────────────────────────
 * Real-time audio analysis, frequency visualization, and note detection
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Music, Mic, Play, Pause, Square, Volume2,
  BarChart3, AudioWaveform, Radio, Download,
} from 'lucide-react';

interface Note {
  name: string;
  frequency: number;
  octave: number;
}

const NOTE_FREQUENCIES: Note[] = [
  { name: 'C', frequency: 261.63, octave: 4 },
  { name: 'C#', frequency: 277.18, octave: 4 },
  { name: 'D', frequency: 293.66, octave: 4 },
  { name: 'D#', frequency: 311.13, octave: 4 },
  { name: 'E', frequency: 329.63, octave: 4 },
  { name: 'F', frequency: 349.23, octave: 4 },
  { name: 'F#', frequency: 369.99, octave: 4 },
  { name: 'G', frequency: 392.00, octave: 4 },
  { name: 'G#', frequency: 415.30, octave: 4 },
  { name: 'A', frequency: 440.00, octave: 4 },
  { name: 'A#', frequency: 466.16, octave: 4 },
  { name: 'B', frequency: 493.88, octave: 4 },
];

function findClosestNote(frequency: number): Note | null {
  if (frequency < 50 || frequency > 2000) return null;
  
  let closest = NOTE_FREQUENCIES[0];
  let minDiff = Math.abs(Math.log2(frequency / closest.frequency));
  
  for (const note of NOTE_FREQUENCIES) {
    const diff = Math.abs(Math.log2(frequency / note.frequency));
    if (diff < minDiff) {
      minDiff = diff;
      closest = note;
    }
  }
  
  return minDiff < 0.05 ? closest : null;
}

export default function BeethovenAudioTool() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [volume, setVolume] = useState(0);
  const [frequencies, setFrequencies] = useState<number[]>(new Array(64).fill(0));
  const [waveform, setWaveform] = useState<number[]>(new Array(128).fill(0));
  const [activeTab, setActiveTab] = useState('visualizer');
  const [synthFreq, setSynthFreq] = useState(440);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Initialize Audio Context
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextCtor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return;
      audioContextRef.current = new AudioContextCtor();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;
    }
  }, []);

  // Start microphone recording
  const startRecording = useCallback(async () => {
    try {
      initAudioContext();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      
      const source = audioContextRef.current!.createMediaStreamSource(stream);
      source.connect(analyserRef.current!);
      
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone access denied:', error);
    }
  }, [initAudioContext]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    setIsRecording(false);
    setCurrentNote(null);
    setVolume(0);
  }, []);

  // Play synthesizer tone
  const playSynthTone = useCallback(() => {
    if (isPlaying) {
      oscillatorRef.current?.stop();
      oscillatorRef.current = null;
      gainNodeRef.current = null;
      setIsPlaying(false);
      return;
    }

    initAudioContext();
    
    oscillatorRef.current = audioContextRef.current!.createOscillator();
    gainNodeRef.current = audioContextRef.current!.createGain();
    
    oscillatorRef.current.connect(gainNodeRef.current);
    gainNodeRef.current.connect(analyserRef.current!);
    analyserRef.current!.connect(audioContextRef.current!.destination);
    
    oscillatorRef.current.type = 'sine';
    oscillatorRef.current.frequency.setValueAtTime(synthFreq, audioContextRef.current!.currentTime);
    gainNodeRef.current.gain.setValueAtTime(0.3, audioContextRef.current!.currentTime);
    
    oscillatorRef.current.start();
    setIsPlaying(true);
  }, [isPlaying, synthFreq, initAudioContext]);

  // Analyze audio
  useEffect(() => {
    if (!isRecording && !isPlaying) return;

    const analyze = () => {
      if (!analyserRef.current) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const timeData = new Uint8Array(bufferLength);
      
      analyserRef.current.getByteFrequencyData(dataArray);
      analyserRef.current.getByteTimeDomainData(timeData);

      // Update frequency visualization (64 bars)
      const step = Math.floor(bufferLength / 64);
      const freqData = Array.from({ length: 64 }, (_, i) => {
        const sum = dataArray.slice(i * step, (i + 1) * step).reduce((a, b) => a + b, 0);
        return sum / step / 255;
      });
      setFrequencies(freqData);

      // Update waveform (128 samples)
      const waveStep = Math.floor(bufferLength / 128);
      const waveData = Array.from({ length: 128 }, (_, i) => {
        return (timeData[i * waveStep] - 128) / 128;
      });
      setWaveform(waveData);

      // Detect dominant frequency and note
      let maxIndex = 0;
      let maxValue = 0;
      for (let i = 0; i < bufferLength; i++) {
        if (dataArray[i] > maxValue) {
          maxValue = dataArray[i];
          maxIndex = i;
        }
      }

      const nyquist = audioContextRef.current!.sampleRate / 2;
      const dominantFreq = (maxIndex / bufferLength) * nyquist;
      
      if (maxValue > 50) {
        const note = findClosestNote(dominantFreq);
        setCurrentNote(note);
        setVolume(maxValue / 255);
      } else {
        setCurrentNote(null);
        setVolume(0);
      }

      animationFrameRef.current = requestAnimationFrame(analyze);
    };

    analyze();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording, isPlaying]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopRecording();
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopRecording]);

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-orange-950/20 via-background to-amber-950/20">
      {/* Header */}
      <div className="p-4 border-b border-border/20 backdrop-blur-sm bg-card/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-orange-500" />
            <h2 className="text-foreground font-bold text-sm">Beethoven Audio Lab</h2>
            {currentNote && (
              <Badge variant="default" className="text-xs animate-pulse">
                {currentNote.name}{currentNote.octave}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={isRecording ? 'destructive' : 'outline'}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </Button>
            <Button
              size="sm"
              variant={isPlaying ? 'default' : 'outline'}
              onClick={playSynthTone}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="visualizer" className="text-xs">Visualizer</TabsTrigger>
            <TabsTrigger value="synthesizer" className="text-xs">Synthesizer</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="visualizer" className="space-y-4">
            {/* Frequency Spectrum */}
            <Card className="p-4 bg-card/40 backdrop-blur-sm border-border/20">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-semibold">Frequency Spectrum</h3>
              </div>
              <div className="flex items-end justify-between gap-0.5 h-32">
                {frequencies.map((value, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-orange-500 to-amber-400 rounded-t transition-all duration-100"
                    style={{ height: `${value * 100}%`, minHeight: '2px' }}
                  />
                ))}
              </div>
            </Card>

            {/* Waveform */}
            <Card className="p-4 bg-card/40 backdrop-blur-sm border-border/20">
              <div className="flex items-center gap-2 mb-3">
                <AudioWaveform className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-semibold">Waveform</h3>
              </div>
              <div className="relative h-24 bg-secondary/20 rounded">
                <svg className="w-full h-full">
                  <polyline
                    points={waveform
                      .map((value, i) => `${(i / waveform.length) * 100}%,${50 + value * 50}%`)
                      .join(' ')}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-primary"
                  />
                </svg>
              </div>
            </Card>

            {/* Volume Meter */}
            <Card className="p-4 bg-card/40 backdrop-blur-sm border-border/20">
              <div className="flex items-center gap-2 mb-3">
                <Volume2 className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-semibold">Volume</h3>
              </div>
              <div className="h-4 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${volume * 100}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="synthesizer" className="space-y-4">
            <Card className="p-4 bg-card/40 backdrop-blur-sm border-border/20">
              <h3 className="text-xs font-semibold mb-3">Frequency Control</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[10px] mb-2">
                    <span>Frequency</span>
                    <span>{synthFreq.toFixed(2)} Hz</span>
                  </div>
                  <Slider
                    value={[synthFreq]}
                    onValueChange={([v]) => {
                      setSynthFreq(v);
                      if (oscillatorRef.current && audioContextRef.current) {
                        oscillatorRef.current.frequency.setValueAtTime(
                          v,
                          audioContextRef.current.currentTime
                        );
                      }
                    }}
                    min={220}
                    max={880}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Note Buttons */}
                <div className="grid grid-cols-7 gap-1">
                  {NOTE_FREQUENCIES.map((note) => (
                    <Button
                      key={note.name}
                      size="sm"
                      variant={Math.abs(synthFreq - note.frequency) < 5 ? 'default' : 'outline'}
                      className="text-[10px] h-8"
                      onClick={() => {
                        setSynthFreq(note.frequency);
                        if (oscillatorRef.current && audioContextRef.current) {
                          oscillatorRef.current.frequency.setValueAtTime(
                            note.frequency,
                            audioContextRef.current.currentTime
                          );
                        }
                      }}
                    >
                      {note.name}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <Card className="p-4 bg-card/40 backdrop-blur-sm border-border/20">
              <h3 className="text-xs font-semibold mb-3">Detected Notes</h3>
              {currentNote ? (
                <div className="space-y-2">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary">
                      {currentNote.name}
                      <sub className="text-xl">{currentNote.octave}</sub>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {currentNote.frequency.toFixed(2)} Hz
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div>
                      <div className="text-muted-foreground">Volume</div>
                      <div className="font-semibold">{(volume * 100).toFixed(0)}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Note</div>
                      <div className="font-semibold">{currentNote.name}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Octave</div>
                      <div className="font-semibold">{currentNote.octave}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  <Radio className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No note detected</p>
                  <p className="text-[10px] mt-1">Start recording or playing to see notes</p>
                </div>
              )}
            </Card>

            {/* Note Reference */}
            <Card className="p-4 bg-card/40 backdrop-blur-sm border-border/20">
              <h3 className="text-xs font-semibold mb-3">Reference Notes</h3>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {NOTE_FREQUENCIES.map((note) => (
                  <div
                    key={note.name}
                    className="flex justify-between p-2 rounded bg-secondary/20"
                  >
                    <span className="font-semibold">{note.name}{note.octave}</span>
                    <span className="text-muted-foreground">{note.frequency.toFixed(2)} Hz</span>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
