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
      // Calculate origin point (click position or top-right corner)
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
    } catch (err: any) {
      setIsModelReady(false);
      setBackendError(err.message || 'Cannot reach detector backend.');
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
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-[#121316] transition-colors duration-200">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Top Floating Navbar */}
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

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 flex flex-col gap-4 sm:gap-5">
        {/* 2-Column Responsive Grid: 7 cols stage, 5 cols results on lg screens */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Stage & Controls */}
          <div className="lg:col-span-7 flex flex-col gap-3">
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
            />
          </div>

          {/* Right Column: Results Grid */}
          <div className="lg:col-span-5 bg-transparent lg:min-h-[520px] flex flex-col">
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
      </main>

      {/* Vocabulary Section & Modal (Show all 25 words) */}
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
