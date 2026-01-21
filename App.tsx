import { useState, useEffect } from 'react';
import { ARCanvas } from './components/ARCanvas';
import { Controls } from './components/Controls';
import { GeminiModal } from './components/GeminiModal';
import { LightingMode, SignState } from './types';
import { Download, X, Maximize2, Minimize2 } from 'lucide-react';

// Placeholder or default image
const DEFAULT_SIGN = 'https://picsum.photos/400/200';

export default function App() {
  const [sign, setSign] = useState<SignState | null>({
    id: 'default',
    imageSrc: DEFAULT_SIGN,
    position: { x: 0, y: 0 },
    scaleX: 1,
    scaleY: 1,
    rotation: 0
  });

  const [lightingMode, setLightingMode] = useState<LightingMode>(LightingMode.DAY);
  const [cameraZoom, setCameraZoom] = useState(1);
  const [screenshotTrigger, setScreenshotTrigger] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync fullscreen state with document state (in case user exits via system gesture)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable fullscreen: ${e.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleUpdateSign = (updates: Partial<SignState>) => {
    if (sign) {
      setSign({ ...sign, ...updates });
    }
  };

  const handleToggleLighting = () => {
    setLightingMode(prev => prev === LightingMode.DAY ? LightingMode.NIGHT : LightingMode.DAY);
  };

  const handleCapture = () => {
    setScreenshotTrigger(prev => prev + 1);
  };

  const handleScreenshotTaken = (dataUrl: string) => {
    setCapturedImage(dataUrl);
  };

  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && sign) {
        setSign({
          ...sign,
          imageSrc: e.target.result as string,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
          position: { x: 0, y: 0 }
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGeneratedImageSelected = (imageUrl: string) => {
    if (sign) {
      setSign({
        ...sign,
        imageSrc: imageUrl,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        position: { x: 0, y: 0 }
      });
      setIsGeneratorOpen(false);
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col">
           <h1 className="text-2xl font-black text-white drop-shadow-md tracking-tighter">
            Sign<span className="text-indigo-400">Viz</span>
           </h1>
           <p className="text-white/60 text-xs font-medium backdrop-blur-sm bg-black/20 rounded-md px-2 py-1 inline-block mt-1">
            AR Visualization Tool
           </p>
        </div>
        
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          {/* Fullscreen Toggle */}
          <button 
            onClick={toggleFullscreen}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center active:scale-90 transition-transform shadow-lg"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          {/* Mode Info */}
          <div className="bg-black/40 backdrop-blur-md rounded-lg px-3 py-2 text-right border border-white/5">
               <p className="text-white/80 text-[10px] uppercase tracking-widest font-bold">Mode</p>
               <p className={`text-sm font-bold ${lightingMode === LightingMode.NIGHT ? 'text-blue-300' : 'text-yellow-300'}`}>
                  {lightingMode === LightingMode.NIGHT ? 'Neon Night' : 'Daylight'}
               </p>
          </div>
        </div>
      </div>

      {/* Main AR View - Always mounted to preserve camera connection */}
      <ARCanvas
        sign={sign}
        lightingMode={lightingMode}
        cameraZoom={cameraZoom}
        onUpdateSign={handleUpdateSign}
        screenshotTrigger={screenshotTrigger}
        onScreenshotTaken={handleScreenshotTaken}
      />

      {/* UI Controls */}
      <Controls
        lightingMode={lightingMode}
        cameraZoom={cameraZoom}
        sign={sign}
        onUpdateSign={handleUpdateSign}
        onCameraZoomChange={setCameraZoom}
        onToggleLighting={handleToggleLighting}
        onCapture={handleCapture}
        onUpload={handleUpload}
        onGenerateClick={() => setIsGeneratorOpen(true)}
      />

      {/* Gemini Modal */}
      <GeminiModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsFullscreen(false) || setIsGeneratorOpen(false)}
        onImageSelected={handleGeneratedImageSelected}
      />

      {/* Preview Overlay */}
      {capturedImage && (
        <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
          <h2 className="text-white text-xl font-bold mb-6 flex items-center gap-2">
            Preview Capture
          </h2>
          
          <div className="relative w-full max-w-md aspect-[9/16] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
            <img src={capturedImage} alt="Captured Proof" className="w-full h-full object-contain" />
          </div>
          
          <div className="flex gap-4 mt-8">
              <button 
                  onClick={() => setCapturedImage(null)}
                  className="px-6 py-3 rounded-full bg-gray-800 text-white font-medium hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                  <X size={18} />
                  Discard
              </button>
              <a 
                  href={capturedImage}
                  download={`signviz-proof-${Date.now()}.png`}
                  className="px-6 py-3 rounded-full bg-white text-black font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                  <Download size={18} />
                  Save Proof
              </a>
          </div>
        </div>
      )}
    </div>
  );
}
