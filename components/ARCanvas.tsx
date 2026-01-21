import React, { useRef, useEffect, useState } from 'react';
import { LightingMode, SignState } from '../types';
import { Camera, AlertCircle } from 'lucide-react';

interface ARCanvasProps {
  sign: SignState | null;
  lightingMode: LightingMode;
  cameraZoom: number;
  onUpdateSign: (updates: Partial<SignState>) => void;
  screenshotTrigger: number; // Increment to trigger screenshot
  onScreenshotTaken: (dataUrl: string) => void;
}

export const ARCanvas: React.FC<ARCanvasProps> = ({
  sign,
  lightingMode,
  cameraZoom,
  onUpdateSign,
  screenshotTrigger,
  onScreenshotTaken
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);

  // Touch state
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const lastDistRef = useRef<number | null>(null);

  // Initialize Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Use rear camera
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
        
        const videoTrack = stream.getVideoTracks()[0];
        videoTrackRef.current = videoTrack;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for metadata to load before playing
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play().then(() => {
                 setStreamActive(true);
              }).catch(e => {
                 console.error("Video play failed:", e);
                 setError("Tap screen to start camera (Autoplay blocked)");
              });
            }
          };
        }
      } catch (err) {
        console.error("Camera error:", err);
        setError("Unable to access camera. Please check permissions.");
      }
    };

    startCamera();

    return () => {
      // Cleanup stream
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle Hardware Zoom
  useEffect(() => {
    const track = videoTrackRef.current;
    if (track && 'applyConstraints' in track) {
      const capabilities = track.getCapabilities() as any;
      if (capabilities.zoom) {
        // Map current 1-10 slider to track capabilities
        const min = capabilities.zoom.min || 1;
        const max = capabilities.zoom.max || 1;
        // Simple linear mapping from 1..5 UI zoom to min..max hardware zoom
        // Assuming cameraZoom is 1..5
        const normalizedZoom = min + (max - min) * ((cameraZoom - 1) / 4);
        
        track.applyConstraints({
          advanced: [{ zoom: normalizedZoom }]
        } as any).catch(err => {
          console.warn("Could not apply zoom constraints:", err);
        });
      }
    }
  }, [cameraZoom]);

  // Handle Screenshot
  useEffect(() => {
    if (screenshotTrigger > 0 && videoRef.current && sign) {
      captureCanvas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenshotTrigger]);

  const captureCanvas = () => {
    const video = videoRef.current;
    if (!video || !sign) return;

    // Use full video resolution to capture entire vision
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw Full Video Frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 2. Apply Darkening for Night Mode
    if (lightingMode === LightingMode.NIGHT) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; // Darken by 40%
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 3. Draw Sign Correctly Positioned on Full Frame
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      
      const screenRatio = containerRect.width / containerRect.height;
      const videoRatio = video.videoWidth / video.videoHeight;
      
      let scaleFactor = 1; 
      if (screenRatio > videoRatio) {
        scaleFactor = containerRect.width / video.videoWidth;
      } else {
        scaleFactor = containerRect.height / video.videoHeight;
      }
      
      const multiplier = 1 / scaleFactor;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = sign.imageSrc;
      img.onload = () => {
        ctx.save();
        
        const x = (video.videoWidth / 2) + (sign.position.x * multiplier);
        const y = (video.videoHeight / 2) + (sign.position.y * multiplier);
        
        ctx.translate(x, y);
        ctx.rotate(sign.rotation * (Math.PI / 180));
        
        let drawnWidth = img.naturalWidth;
        let drawnHeight = img.naturalHeight;
        const maxScreenW = 300;
        
        if (drawnWidth > maxScreenW) {
          const ratio = drawnWidth / drawnHeight;
          drawnWidth = maxScreenW;
          drawnHeight = maxScreenW / ratio;
        }

        const finalScale = sign.scale * multiplier;
        ctx.scale(finalScale, finalScale);

        const shadowScaleCorrection = 1 / sign.scale;

        if (lightingMode === LightingMode.NIGHT) {
             ctx.shadowColor = '#00eaff'; 
             ctx.shadowBlur = 20 * shadowScaleCorrection;         
        } else {
             ctx.shadowColor = 'rgba(0,0,0,0.5)';
             ctx.shadowBlur = 10 * shadowScaleCorrection;
             ctx.shadowOffsetX = 2 * shadowScaleCorrection;
             ctx.shadowOffsetY = 4 * shadowScaleCorrection;
        }

        ctx.drawImage(img, -drawnWidth / 2, -drawnHeight / 2, drawnWidth, drawnHeight);
        
        ctx.restore();
        onScreenshotTaken(canvas.toDataURL('image/png'));
      };
    }
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if ('touches' in e) {
      if (e.touches.length === 1) {
        lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastDistRef.current = Math.hypot(dx, dy);
      }
    } else {
         const me = e as React.MouseEvent;
         lastTouchRef.current = { x: me.clientX, y: me.clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!sign) return;

    if ('touches' in e) {
      if (e.touches.length === 1 && lastTouchRef.current) {
        const touch = e.touches[0];
        const dx = touch.clientX - lastTouchRef.current.x;
        const dy = touch.clientY - lastTouchRef.current.y;
        
        onUpdateSign({
          position: {
            x: sign.position.x + dx,
            y: sign.position.y + dy
          }
        });
        lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
      } else if (e.touches.length === 2 && lastDistRef.current) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        
        const scaleFactor = dist / lastDistRef.current;
        onUpdateSign({
          scale: Math.max(0.1, Math.min(sign.scale * scaleFactor, 5.0))
        });
        lastDistRef.current = dist;
      }
    } else {
        if (lastTouchRef.current) {
            const me = e as React.MouseEvent;
             if (me.buttons === 1) {
                const dx = me.clientX - lastTouchRef.current.x;
                const dy = me.clientY - lastTouchRef.current.y;
                onUpdateSign({
                    position: {
                        x: sign.position.x + dx,
                        y: sign.position.y + dy
                    }
                });
                lastTouchRef.current = { x: me.clientX, y: me.clientY };
             }
        }
    }
  };

  const handleTouchEnd = () => {
    lastTouchRef.current = null;
    lastDistRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!sign) return;
    const scaleChange = e.deltaY * -0.001;
    onUpdateSign({
      scale: Math.max(0.1, Math.min(sign.scale + scaleChange, 5.0))
    });
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onWheel={handleWheel}
      onClick={() => {
        if (videoRef.current && videoRef.current.paused) {
             videoRef.current.play().then(() => setStreamActive(true));
        }
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute top-0 left-0 w-full h-full object-cover"
        style={{ 
          opacity: streamActive ? 1 : 0,
          filter: lightingMode === LightingMode.NIGHT ? 'brightness(0.6) contrast(1.1)' : 'none',
          transition: 'filter 0.5s ease'
        }}
      />
      
      {!streamActive && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-white/50 pointer-events-none">
          <Camera className="w-12 h-12 animate-pulse" />
          <span className="ml-2">Initializing AR Camera...</span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-red-400 p-8 text-center z-50">
            <div className="flex flex-col items-center">
                <AlertCircle className="w-12 h-12 mb-4" />
                <p>{error}</p>
            </div>
        </div>
      )}

      {sign && (
        <div
          className="absolute pointer-events-none origin-center will-change-transform"
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) translate(${sign.position.x}px, ${sign.position.y}px) scale(${sign.scale}) rotate(${sign.rotation}deg)`,
            transition: 'filter 0.3s ease',
            filter: lightingMode === LightingMode.NIGHT 
              ? 'drop-shadow(0 0 20px #00eaff)' 
              : 'drop-shadow(2px 4px 6px rgba(0,0,0,0.5))'
          }}
        >
          <img 
            src={sign.imageSrc} 
            alt="Sign Overlay" 
            className="max-w-[300px] h-auto"
            draggable={false}
          />
        </div>
      )}

      {streamActive && sign && (
        <div className="absolute top-24 left-0 w-full text-center pointer-events-none">
          <p className="inline-block bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
            Pinch to resize sign • Drag to move
          </p>
        </div>
      )}
    </div>
  );
};
