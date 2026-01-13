
import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';

interface ShorthandCanvasProps {
  className?: string;
  backgroundImage?: string | null;
  onFreehandStart?: () => void;
}

export interface ShorthandCanvasHandle {
  clear: () => void;
  getDataUrl: () => string;
  drawPrimitive: (type: string) => void;
  getStrokes: () => Array<{ x: number; y: number }>;
}

const ShorthandCanvas = forwardRef<ShorthandCanvasHandle, ShorthandCanvasProps>(({ className, backgroundImage, onFreehandStart }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [cursor, setCursor] = useState({ x: 50, y: 150 }); // Starting position for "typing"
  const pointsRef = useRef<Array<{ x: number; y: number }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        clear();
      }
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
    setCursor({ x: 50, y: 150 });
    pointsRef.current = [];
  };

  const getPointerPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: (e as MouseEvent).clientX - rect.left,
        y: (e as MouseEvent).clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getPointerPos(e);
    onFreehandStart?.();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2b2b2b'; 
    setIsDrawing(true);
    setHasContent(true);
    setCursor({ x, y });
    pointsRef.current.push({ x, y });
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getPointerPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setCursor({ x, y });
    pointsRef.current.push({ x, y });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const drawPrimitive = (type: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2b2b2b';
    ctx.beginPath();
    ctx.moveTo(cursor.x, cursor.y);

    let nextX = cursor.x;
    let nextY = cursor.y;

    switch (type.toLowerCase()) {
      case 't': // Short down
        nextY += 20;
        ctx.lineTo(nextX, nextY);
        break;
      case 'd': // Long down
        nextY += 45;
        ctx.lineTo(nextX, nextY);
        break;
      case 'n': // Short horizontal
        nextX += 25;
        ctx.lineTo(nextX, nextY);
        break;
      case 'm': // Long horizontal
        nextX += 50;
        ctx.lineTo(nextX, nextY);
        break;
      case 'p': // Short left curve
        nextX -= 10; nextY += 20;
        ctx.quadraticCurveTo(cursor.x - 15, cursor.y + 10, nextX, nextY);
        break;
      case 'b': // Long left curve
        nextX -= 15; nextY += 40;
        ctx.quadraticCurveTo(cursor.x - 25, cursor.y + 20, nextX, nextY);
        break;
      case 'f': // Short right curve
        nextX += 10; nextY += 20;
        ctx.quadraticCurveTo(cursor.x + 15, cursor.y + 10, nextX, nextY);
        break;
      case 'v': // Long right curve
        nextX += 15; nextY += 40;
        ctx.quadraticCurveTo(cursor.x + 25, cursor.y + 20, nextX, nextY);
        break;
      case 'e': // Small circle
        ctx.arc(cursor.x + 5, cursor.y, 5, 0, Math.PI * 2);
        nextX += 10;
        break;
      case 'a': // Large circle
        ctx.arc(cursor.x + 10, cursor.y, 10, 0, Math.PI * 2);
        nextX += 20;
        break;
      case 'r': // Short upward curve
        nextX += 20; nextY -= 10;
        ctx.quadraticCurveTo(cursor.x + 10, cursor.y - 15, nextX, nextY);
        break;
      case 'l': // Long upward curve
        nextX += 40; nextY -= 15;
        ctx.quadraticCurveTo(cursor.x + 20, cursor.y - 30, nextX, nextY);
        break;
      case 's': // Tiny tick
        nextX += 5; nextY += 10;
        ctx.lineTo(nextX, nextY);
        break;
      case ' ': // Space
        nextX += 40;
        break;
      default:
        return;
    }

    ctx.stroke();
    setCursor({ x: nextX, y: nextY });
    setHasContent(true);
  };

  useImperativeHandle(ref, () => ({
    clear,
    getDataUrl: () => canvasRef.current?.toDataURL('image/png') || '',
    drawPrimitive,
    getStrokes: () => pointsRef.current
  }));

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {backgroundImage && (
        <div 
          className="absolute inset-0 z-0 opacity-40 pointer-events-none bg-center bg-no-repeat bg-contain"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}
      
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="absolute inset-0 cursor-crosshair touch-none z-10"
      />
      
      {!hasContent && !backgroundImage && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 z-0">
          <p className="text-3xl font-black typewriter uppercase tracking-widest text-[#2b2b2b]">READY FOR INTEL</p>
        </div>
      )}
    </div>
  );
});

export default ShorthandCanvas;
