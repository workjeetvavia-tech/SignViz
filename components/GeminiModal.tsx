import React, { useState } from 'react';
import { X, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';
import { generateSignImage, generateSignConcept } from '../services/geminiService';

interface GeminiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelected: (imageUrl: string) => void;
}

export const GeminiModal: React.FC<GeminiModalProps> = ({ isOpen, onClose, onImageSelected }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedConcept, setGeneratedConcept] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setGeneratedImage(null);
    setGeneratedConcept(null);

    try {
      // Parallel execution for speed, though image gen is slower
      const [concept, imageUrl] = await Promise.all([
        generateSignConcept(prompt),
        generateSignImage(prompt)
      ]);
      
      setGeneratedConcept(concept);
      setGeneratedImage(imageUrl);

    } catch (error) {
      console.error("Failed to generate", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>

        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Sparkles className="text-indigo-400" />
          AI Sign Generator
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">What kind of shop/sign?</label>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A neon burger joint logo, retro style"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
            Generate Design
          </button>

          {(generatedImage || generatedConcept) && (
            <div className="mt-6 p-4 bg-gray-800/50 rounded-xl border border-white/5 animate-in fade-in slide-in-from-bottom-4">
              {generatedConcept && (
                <p className="text-sm text-indigo-300 mb-4 font-medium italic">"{generatedConcept}"</p>
              )}
              
              {generatedImage ? (
                <div className="relative group cursor-pointer" onClick={() => onImageSelected(generatedImage)}>
                  <div className="aspect-square w-full rounded-lg overflow-hidden bg-white/5">
                    <img src={generatedImage} alt="Generated Sign" className="w-full h-full object-contain" />
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                    <span className="bg-white text-black px-4 py-2 rounded-full font-medium text-sm">Use This Sign</span>
                  </div>
                </div>
              ) : (
                <div className="aspect-video w-full flex flex-col items-center justify-center text-gray-500 border border-dashed border-gray-700 rounded-lg">
                    {loading ? "Generating..." : "No image generated"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
