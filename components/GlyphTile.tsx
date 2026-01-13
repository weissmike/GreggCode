import React, { useEffect, useRef } from 'react';

interface GlyphTileProps {
  label: string;
  hint: string;
  command: string;
  tokens: string[];
  onSelect: (command: string) => void;
}

const drawPrimitive = (ctx: CanvasRenderingContext2D, type: string, startX: number, startY: number) => {
  let nextX = startX;
  let nextY = startY;

  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#2b2b2b';
  ctx.beginPath();
  ctx.moveTo(startX, startY);

  switch (type.toLowerCase()) {
    case 't':
      nextY += 20;
      ctx.lineTo(nextX, nextY);
      break;
    case 'd':
      nextY += 45;
      ctx.lineTo(nextX, nextY);
      break;
    case 'n':
      nextX += 25;
      ctx.lineTo(nextX, nextY);
      break;
    case 'm':
      nextX += 50;
      ctx.lineTo(nextX, nextY);
      break;
    case 'p':
      nextX -= 10; nextY += 20;
      ctx.quadraticCurveTo(startX - 15, startY + 10, nextX, nextY);
      break;
    case 'b':
      nextX -= 15; nextY += 40;
      ctx.quadraticCurveTo(startX - 25, startY + 20, nextX, nextY);
      break;
    case 'f':
      nextX += 10; nextY += 20;
      ctx.quadraticCurveTo(startX + 15, startY + 10, nextX, nextY);
      break;
    case 'v':
      nextX += 15; nextY += 40;
      ctx.quadraticCurveTo(startX + 25, startY + 20, nextX, nextY);
      break;
    case 'e':
      ctx.arc(startX + 5, startY, 5, 0, Math.PI * 2);
      nextX += 10;
      break;
    case 'a':
      ctx.arc(startX + 10, startY, 10, 0, Math.PI * 2);
      nextX += 20;
      break;
    case 'r':
      nextX += 20; nextY -= 10;
      ctx.quadraticCurveTo(startX + 10, startY - 15, nextX, nextY);
      break;
    case 'l':
      nextX += 40; nextY -= 15;
      ctx.quadraticCurveTo(startX + 20, startY - 30, nextX, nextY);
      break;
    case 's':
      nextX += 5; nextY += 10;
      ctx.lineTo(nextX, nextY);
      break;
    case ' ':
      break;
    default:
      break;
  }

  ctx.stroke();
  return { x: nextX, y: nextY };
};

const GlyphTile: React.FC<GlyphTileProps> = ({ label, hint, command, tokens, onSelect }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (command === '\\space') {
      ctx.fillStyle = '#2b2b2b';
      ctx.font = 'bold 9px "Courier Prime", monospace';
      ctx.fillText('SPACE', 16, 36);
      return;
    }
    let cursorX = 24;
    let cursorY = 32;
    tokens.forEach((token) => {
      const next = drawPrimitive(ctx, token, cursorX, cursorY);
      cursorX = next.x + 8;
      cursorY = next.y;
    });
  }, [command, tokens]);

  return (
    <button
      onClick={() => onSelect(command)}
      className="bg-[#f4ecd8] border border-black/20 rounded p-1 flex flex-col items-center gap-1 hover:bg-[#e2d1b3] transition-colors"
      title={hint}
    >
      <canvas ref={canvasRef} width={70} height={60} />
      <div className="text-center">
        <div className="text-[9px] font-black uppercase text-[#8b0000]">{label}</div>
        <div className="text-[7px] uppercase text-gray-500">{command}</div>
      </div>
    </button>
  );
};

export default GlyphTile;
