import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { StatusBanner } from './components/StatusBanner';
import { StagePanel } from './components/StagePanel';
import { Controls } from './components/Controls';
import { ResultsGrid } from './components/ResultsGrid';
import { VocabModal } from './components/VocabModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { useDetector } from './hooks/useDetector';
import { getHealth, getVocab } from './api/client';
import { stopSpeech } from './speech';
import { VocabItem } from './types';

export function App() {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cov_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('cov_theme', theme);
  }, [theme]);

  const toggleTheme = (e?: React.MouseEvent) => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';

    // Use View Transitions API if supported and user has not requested reduced motion
    const doc = document as Document & {
      startViewTransition?: (callback: () => void) => {
        ready: Promise<void>;
      };
    };

    const isReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (doc.startViewTransition && !isReducedMotion) {
      const x = e ? e.clientX : window.innerWidth - 30;
      const y = e ? e.clientY : 30;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const transition = doc.startViewTransition(() => {
        setTheme(nextTheme);
        if (nextTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      });

      transition.ready
        .then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 550,
              easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
              pseudoElement: '::view-transition-new(root)',
            }
          );
        })
        .catch(() => {
          // Fallback if animation is cancelled
        });
    } else {
      setTheme(nextTheme);
    }
  };

  // Toast notification state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (type: 'error' | 'success' | 'info', message: string, title?: string) => {
      const id = Date.now().toString() + Math.random().toString();
      setToasts((prev) => [...prev, { id, type, message, title }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Detector hook
  const {
    isCameraActive,
    imageSrc,
    imageDimensions,
    videoRef,
    cameraError,
    startCamera,
    stopCamera,
    flipCamera,
    handleFileUpload,
    captureAndDetect,
    clearAll,
    status,
    isDetecting,
    detections,
    uniqueDetections,
    selectedVocabId,
    setSelectedVocabId,
    threshold,
    setThreshold,
    isLiveActive,
    toggleLive,
    statusMessage,
  } = useDetector(addToast);

  // Backend Health & Vocab Cache
  const [isModelReady, setIsModelReady] = useState<boolean>(true);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isRetryingHealth, setIsRetryingHealth] = useState<boolean>(false);
  const [cachedVocab, setCachedVocab] = useState<VocabItem[]>([]);
  const [isVocabModalOpen, setIsVocabModalOpen] = useState<boolean>(false);

  // Reset all media, speech, and detections
  const handleReset = useCallback(() => {
    stopSpeech();
    clearAll();
    addToast('info', 'Detection stage and camera have been reset.', 'Reset');
  }, [clearAll, addToast]);

  // Check health and preload vocabulary
  const checkHealth = useCallback(async () => {
    setIsRetryingHealth(true);
    try {
      const health = await getHealth();
      if (health.status === 'ok') {
        setIsModelReady(true);
        setBackendError(null);
      } else {
        setIsModelReady(false);
        setBackendError(
          health.error || 'Model is currently initializing or unavailable on the server.'
        );
      }
    } catch (err: unknown) {
      setIsModelReady(false);
      setBackendError(
        err instanceof Error ? err.message : 'Cannot reach detector backend.'
      );
    } finally {
      setIsRetryingHealth(false);
    }
  }, []);

  const [isVocabLoading, setIsVocabLoading] = useState<boolean>(false);
  const [vocabLoadError, setVocabLoadError] = useState<string | null>(null);

  const loadVocabulary = useCallback(async () => {
    setIsVocabLoading(true);
    setVocabLoadError(null);
    try {
      const items = await getVocab();
      setCachedVocab(items);
    } catch (err: unknown) {
      setVocabLoadError(
        err instanceof Error ? err.message : 'Failed to fetch vocabulary list'
      );
    } finally {
      setIsVocabLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    // Preload vocabulary quietly
    loadVocabulary();

    // Poll health periodically
    const timer = setInterval(checkHealth, 12000);
    return () => clearInterval(timer);
  }, [checkHealth, loadVocabulary]);

  return (
    <div className="min-h-screen flex flex-col relative z-10 transition-colors duration-200 pb-8 sm:pb-12">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* 1. Top Floating Navbar */}
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenVocabModal={() => setIsVocabModalOpen(true)}
      />

      {/* Backend Status Banner if Unavailable */}
      <StatusBanner
        isModelReady={isModelReady}
        backendError={backendError}
        onRetry={checkHealth}
        isRetrying={isRetryingHealth}
      />

      {/* Main Content Area */}
      <main className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 mt-5 flex flex-col gap-5">
        {/* 2. Main App Panel: Single centered white glass card */}
        <div className="w-full bg-white/85 dark:bg-[#1C1B19]/85 backdrop-blur-[12px] rounded-[24px] border border-white/60 dark:border-[#3A3934]/80 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),0_8px_16px_-6px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] p-5 sm:p-6 transition-colors">
          {/* Inside Panel: 2-column responsive grid on lg (60% stage, 40% results, 20px gap) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Camera Stage */}
            <div className="lg:col-span-7 flex flex-col">
              <StagePanel
                imageSrc={imageSrc}
                videoRef={videoRef}
                isCameraActive={isCameraActive}
                isDetecting={isDetecting}
                detections={detections}
                imageDimensions={imageDimensions}
                selectedVocabId={selectedVocabId}
                onSelectDetection={setSelectedVocabId}
                onStartCamera={startCamera}
                onUploadClick={() => document.getElementById('photo-file-input')?.click()}
                cameraError={cameraError}
              />
            </div>

            {/* Right: Results Column */}
            <div className="lg:col-span-5 flex flex-col min-h-[380px] lg:min-h-[480px]">
              <ResultsGrid
                detections={uniqueDetections}
                selectedVocabId={selectedVocabId}
                onSelectDetection={setSelectedVocabId}
                status={status}
                threshold={threshold}
                onError={(msg) => addToast('error', msg)}
              />
            </div>
          </div>
        </div>

        {/* 6. Controls Bar: A separate white glass bar directly below panel, aligned to stage column width on desktop */}
        <div className="w-full lg:w-[calc((100%-20px)*7/12)]">
          <Controls
            isCameraActive={isCameraActive}
            onToggleCamera={isCameraActive ? stopCamera : startCamera}
            onFlipCamera={flipCamera}
            onCaptureAndDetect={captureAndDetect}
            onFileUpload={handleFileUpload}
            isLiveActive={isLiveActive}
            onToggleLive={toggleLive}
            isDetecting={isDetecting}
            detectionCount={uniqueDetections.length}
            statusMessage={statusMessage}
            threshold={threshold}
            onThresholdChange={setThreshold}
            hasMedia={isCameraActive || !!imageSrc}
            isModelReady={isModelReady}
            onReset={handleReset}
          />
        </div>
      </main>

      {/* Vocabulary Modal Section */}
      <section id="vocab-section" aria-label="Vocabulary section">
        <VocabModal
          open={isVocabModalOpen}
          onClose={() => setIsVocabModalOpen(false)}
          vocab={cachedVocab}
          activeId={selectedVocabId}
          onError={(msg) => addToast('error', msg)}
          onRetry={loadVocabulary}
          isLoading={isVocabLoading && cachedVocab.length === 0}
          loadError={vocabLoadError}
        />
      </section>
    </div>
  );
}

export default App;
