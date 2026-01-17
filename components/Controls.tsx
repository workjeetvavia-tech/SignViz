import React, { useRef } from 'react';
import { LightingMode } from '../types';
import { Sun, Moon, Upload, Camera, Sparkles, ImagePlus } from 'lucide-react';

interface ControlsProps {
  lightingMode: LightingMode;
  onToggleLighting: () => void;
  onCapture: () => void;
  onUpload: (file: File) => void;
  onGenerateClick: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  lightingMode,
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
    <div className="absolute bottom-0 left-0 w-full p-6 pb-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
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
          <div className="w-16 h-16 bg-white rounded-full group-hover:bg-gray-200 transition-colors" />
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
  );
};
