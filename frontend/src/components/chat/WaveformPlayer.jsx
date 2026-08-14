import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Download } from 'lucide-react';

const BAR_COUNT = 48;
const peaksCache = new Map();

function computePeaks(channelData) {
  const peaks = [];
  const chunk = Math.max(1, Math.floor(channelData.length / BAR_COUNT));
  for (let i = 0; i < BAR_COUNT; i++) {
    let max = 0;
    for (let j = i * chunk; j < (i + 1) * chunk && j < channelData.length; j++) {
      const v = Math.abs(channelData[j]);
      if (v > max) max = v;
    }
    peaks.push(Math.min(1, max * 1.8));
  }
  return peaks;
}

function formatTime(s) {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function WaveformPlayer({ url, isOwn }) {
  const [peaks, setPeaks] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const decode = async () => {
      if (peaksCache.has(url)) {
        setPeaks(peaksCache.get(url));
        return;
      }
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const res = await fetch(url);
        const buf = await res.arrayBuffer();
        const audio = await ctx.decodeAudioData(buf);
        ctx.close();
        if (cancelled) return;
        const peaks = computePeaks(audio.getChannelData(0));
        peaksCache.set(url, peaks);
        setPeaks(peaks);
      } catch (e) {
        console.error('Erro ao decodificar áudio:', e);
        if (!cancelled) setPeaks(Array(BAR_COUNT).fill(0.45));
      }
    };
    decode();
    return () => { cancelled = true; };
  }, [url]);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  }, []);

  const seek = useCallback((e) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    a.currentTime = ratio * duration;
  }, [duration]);

  const progressRatio = duration ? current / duration : 0;

  const barInactive = isOwn ? 'bg-white/40' : 'bg-gray-300 dark:bg-navy-600';
  const barActive = isOwn ? 'bg-white' : 'bg-primary-500';

  return (
    <div className="flex items-center gap-2.5 min-w-[220px] max-w-[270px] select-none">
      <button
        onClick={toggle}
        title={playing ? 'Pausar' : 'Reproduzir'}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
          isOwn
            ? 'bg-white/25 hover:bg-white/35 text-white'
            : 'bg-primary-500 hover:bg-primary-600 text-white'
        }`}
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <div
          className="flex items-end gap-[2px] h-10 cursor-pointer"
          onClick={seek}
          title="Clique para avançar/recuar"
        >
          {(peaks || Array(BAR_COUNT).fill(0.3)).map((p, i) => {
            const h = Math.max(3, Math.round(p * 34));
            const filled = i / BAR_COUNT <= progressRatio;
            return (
              <span
                key={i}
                className={`w-[3px] rounded-full transition-colors ${filled ? barActive : barInactive}`}
                style={{ height: `${h}px` }}
              />
            );
          })}
        </div>
        <div className={`flex justify-between mt-0.5 text-[10px] font-medium ${isOwn ? 'text-white/90' : 'text-gray-400 dark:text-gray-500'}`}>
          <span>{formatTime(current)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        download
        title="Transferir áudio"
        className={`flex-shrink-0 p-1 rounded-lg transition-colors ${
          isOwn ? 'text-white/80 hover:text-white hover:bg-white/20' : 'text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-navy-700'
        }`}
      >
        <Download className="w-4 h-4" />
      </a>

      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCurrent(0); }}
      />
    </div>
  );
}
