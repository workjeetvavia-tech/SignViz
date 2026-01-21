import React, { useRef } from 'react';
import { LightingMode, SignState } from '../types';
import { Sun, Moon, Upload, Sparkles, ZoomIn, ZoomOut, Maximize, RotateCw } from 'lucide-react';

interface ControlsProps {
  lightingMode: LightingMode;
  cameraZoom: number;
  sign: SignState | null;
  onUpdateSign: (updates: Partial<SignState>) => void;
  onCameraZoomChange: (zoom: number) => void;
  onToggleLighting: () => void;
  onCapture: () => void;
  onUpload: (file: File) => void;
  onGenerateClick: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  lightingMode,
  cameraZoom,
  sign,
  onUpdateSign,
  onCameraZoomChange,
  onToggleLighting,
  onCapture,
  onUpload,
  onGenerateClick
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <>
      {/* Hardware Camera Zoom Control (Right Side) */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-30 group">
        <button 
          onClick={() => onCameraZoomChange(Math.min(5, cameraZoom + 0.5))}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center active:scale-90 transition-transform"
        >
          <ZoomIn size={18} />
        </button>
        
        <div className="h-32 w-10 flex flex-col items-center py-2 bg-black/40 backdrop-blur-md border border-white/20 rounded-full">
          <input
            type="range"
            min="1"
            max="5"
            step="0.1"
            value={cameraZoom}
            onChange={(e) => onCameraZoomChange(parseFloat(e.target.value))}
            className="h-24 w-1 -rotate-180 appearance-none bg-white/20 rounded-full cursor-pointer accent-indigo-400"
            style={{ writingMode: 'bt-lr' as any, WebkitAppearance: 'slider-vertical' } as any}
          />
        </div>

        <button 
          onClick={() => onCameraZoomChange(Math.max(1, cameraZoom - 0.5))}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center active:scale-90 transition-transform"
        >
          <ZoomOut size={18} />
        </button>
        
        <div className="text-[10px] font-bold text-white/50 uppercase tracking-tighter">Cam</div>
      </div>

      {/* Sign Scale Control (Left Side) */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-30 group">
        <button 
          onClick={() => sign && onUpdateSign({ scale: Math.min(5, sign.scale + 0.1) })}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center active:scale-90 transition-transform"
        >
          <Maximize size={18} />
        </button>
        
        <div className="h-32 w-10 flex flex-col items-center py-2 bg-black/40 backdrop-blur-md border border-white/20 rounded-full">
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.05"
            value={sign?.scale || 1}
            onChange={(e) => onUpdateSign({ scale: parseFloat(e.target.value) })}
            className="h-24 w-1 -rotate-180 appearance-none bg-white/20 rounded-full cursor-pointer accent-green-400"
            style={{ writingMode: 'bt-lr' as any, WebkitAppearance: 'slider-vertical' } as any}
          />
        </div>

        <button 
          onClick={() => sign && onUpdateSign({ scale: Math.max(0.1, sign.scale - 0.1) })}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center active:scale-90 transition-transform"
        >
          <div className="w-3 h-0.5 bg-white rounded-full" />
        </button>
        
        <div className="text-[10px] font-bold text-white/50 uppercase tracking-tighter">Sign</div>
      </div>

      {/* Rotation Control (Floating above bottom bar) */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-64 flex flex-col items-center gap-2 z-30">
        <div className="flex items-center gap-3 w-full px-4 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full">
            <RotateCw size={14} className="text-white/60" />
            <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={sign?.rotation || 0}
                onChange={(e) => onUpdateSign({ rotation: parseInt(e.target.value) })}
                className="flex-1 h-1.5 appearance-none bg-white/20 rounded-full cursor-pointer accent-indigo-400"
            />
            <span className="text-[10px] font-mono text-white/80 w-8 text-right">
                {Math.round(sign?.rotation || 0)}°
            </span>
        </div>
      </div>

      {/* Main Bottom Controls */}
      <div className="absolute bottom-0 left-0 w-full p-6 pb-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20">
        <div className="flex items-center justify-between max-w-md mx-auto">
          
          {/* Generate / Upload Group */}
          <div className="flex flex-col gap-2">
              <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-colors"
              title="Upload Sign"
              >
              <Upload size={20} />
              </button>
              <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileChange}
              />

              <button
              onClick={onGenerateClick}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/80 backdrop-blur-md border border-indigo-400/30 text-white hover:bg-indigo-500 transition-colors"
              title="Generate AI Sign"
              >
              <Sparkles size={20} />
              </button>
          </div>

          {/* Shutter Button */}
          <button
            onClick={onCapture}
            className="relative w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group active:scale-95 transition-transform"
          >
            <div className="w-16 h-16 bg-white rounded-full group-hover:bg-gray-200 transition-colors shadow-inner" />
          </button>

          {/* Lighting Toggle */}
          <button
            onClick={onToggleLighting}
            className={`flex items-center justify-center w-12 h-12 rounded-full backdrop-blur-md border transition-all duration-300 ${
              lightingMode === LightingMode.NIGHT
                ? 'bg-blue-900/50 border-blue-400 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                : 'bg-yellow-500/20 border-yellow-400 text-yellow-200'
            }`}
            title="Toggle Day/Night"
          >
            {lightingMode === LightingMode.NIGHT ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </div>
    </>
  );
};
