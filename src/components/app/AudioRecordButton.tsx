import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onRecorded: (blob: Blob) => void;
  disabled?: boolean;
}

/**
 * Hold-to-record audio button (WhatsApp-style).
 * - Press and hold: starts recording
 * - Release: stops and sends the blob
 * - Drag up/away while holding: cancels
 */
export default function AudioRecordButton({ onRecorded, disabled }: Props) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [cancelling, setCancelling] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const startYRef = useRef<number>(0);
  const cancelRef = useRef(false);

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setRecording(false);
    setSeconds(0);
    setCancelling(false);
    cancelRef.current = false;
  };

  const start = async (clientY: number) => {
    if (disabled || recording) return;
    cancelRef.current = false;
    startYRef.current = clientY;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const wasCancelled = cancelRef.current;
        const blobType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: blobType });
        cleanup();
        if (wasCancelled) return;
        if (blob.size < 1000) {
          toast.error('Áudio muito curto');
          return;
        }
        onRecorded(blob);
      };

      recorder.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = window.setInterval(() => {
        setSeconds((s) => {
          if (s >= 60) {
            // auto-stop @60s
            stop(false);
            return 60;
          }
          return s + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('mic permission error', err);
      toast.error('Permita acesso ao microfone');
      cleanup();
    }
  };

  const stop = (cancel: boolean) => {
    if (!mediaRecorderRef.current) return;
    cancelRef.current = cancel;
    if (mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleMove = (clientY: number) => {
    if (!recording) return;
    const dy = startYRef.current - clientY;
    setCancelling(dy > 60);
  };

  const handleEnd = () => {
    if (!recording) return;
    stop(cancelling);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(1, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <>
      <motion.button
        type="button"
        disabled={disabled}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          start(e.clientY);
        }}
        onPointerMove={(e) => handleMove(e.clientY)}
        onPointerUp={handleEnd}
        onPointerCancel={() => stop(true)}
        onContextMenu={(e) => e.preventDefault()}
        whileTap={{ scale: 0.92 }}
        className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center flex-shrink-0 transition-colors select-none"
        style={{
          background: recording ? 'var(--color-green-600)' : 'transparent',
          cursor: disabled ? 'default' : 'pointer',
          border: 'none',
          touchAction: 'none',
        }}
        title="Segure para gravar áudio"
        aria-label="Gravar áudio"
      >
        <Mic
          size={16}
          style={{
            color: recording ? '#FFFFFF' : 'var(--color-text-muted)',
          }}
        />
      </motion.button>

      <AnimatePresence>
        {recording && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed left-1/2 -translate-x-1/2 z-[600] flex items-center gap-3 px-4 py-3 rounded-full shadow-lg pointer-events-none"
            style={{
              bottom: 'calc(80px + env(safe-area-inset-bottom))',
              background: cancelling ? 'var(--color-danger-bg)' : 'var(--color-bg-elevated)',
              border: `1px solid ${cancelling ? 'var(--color-danger-border)' : 'var(--color-border-base)'}`,
              minWidth: 220,
            }}
          >
            {cancelling ? (
              <>
                <Trash2 size={16} style={{ color: 'var(--color-danger-text)' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-danger-text)' }}>
                  Solte para cancelar
                </span>
              </>
            ) : (
              <>
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: '#EF4444' }}
                />
                <span
                  className="font-mono"
                  style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-strong)' }}
                >
                  {fmt(seconds)}
                </span>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Arraste ↑ para cancelar
                </span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
