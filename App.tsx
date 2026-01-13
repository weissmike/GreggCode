
import React, { useState, useRef, useEffect } from 'react';
import { AppMode, RecognitionResult } from './types';
import { LESSONS } from './constants';
import { recognizeShorthand } from './services/geminiService';
import ShorthandCanvas, { ShorthandCanvasHandle } from './components/ShorthandCanvas';

const STENO_KEYS = [
  { key: 't', label: 'T', hint: 'Short Down' },
  { key: 'd', label: 'D', hint: 'Long Down' },
  { key: 'n', label: 'N', hint: 'Short Horiz' },
  { key: 'm', label: 'M', hint: 'Long Horiz' },
  { key: 'p', label: 'P', hint: 'Short L-Curve' },
  { key: 'b', label: 'B', hint: 'Long L-Curve' },
  { key: 'f', label: 'F', hint: 'Short R-Curve' },
  { key: 'v', label: 'V', hint: 'Long R-Curve' },
  { key: 'r', label: 'R', hint: 'Short Up-Curve' },
  { key: 'l', label: 'L', hint: 'Long Up-Curve' },
  { key: 'e', label: 'E', hint: 'Small Circle' },
  { key: 'a', label: 'A', hint: 'Large Circle' },
  { key: 's', label: 'S', hint: 'Tick' },
];

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.LEARN);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLessonSelector, setShowLessonSelector] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [showKeyboardMap, setShowKeyboardMap] = useState(false);
  
  const canvasRef = useRef<ShorthandCanvasHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const currentLesson = LESSONS[currentLessonIndex];
  const currentWord = currentLesson.words[currentWordIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === AppMode.TRANSLATE && !isLoading) {
        // Prevent default for mapped keys to avoid scrolling
        if (STENO_KEYS.some(sk => sk.key === e.key.toLowerCase()) || e.key === ' ') {
          canvasRef.current?.drawPrimitive(e.key.toLowerCase());
        } else if (e.key === 'Backspace') {
          handleClear();
        } else if (e.key === 'Enter') {
          handleCheck();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, isLoading]);

  const handleCheck = async () => {
    if (!canvasRef.current) return;
    const imageData = canvasRef.current.getDataUrl();
    
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const recognition = await recognizeShorthand(
        imageData, 
        mode === AppMode.LEARN ? currentWord.word : undefined
      );
      setResult(recognition);
    } catch (err: any) {
      setError(err.message || "Decryption failed. Intelligence lost.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    canvasRef.current?.clear();
    setResult(null);
    setError(null);
  };

  const handleClearBackground = () => {
    setBackgroundImage(null);
    handleClear();
  };

  const handleNextWord = () => {
    if (currentWordIndex < currentLesson.words.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
    } else if (currentLessonIndex < LESSONS.length - 1) {
      setCurrentLessonIndex(prev => prev + 1);
      setCurrentWordIndex(0);
    } else {
      setCurrentLessonIndex(0);
      setCurrentWordIndex(0);
    }
    handleClear();
  };

  const handlePrevWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(prev => prev - 1);
    } else if (currentLessonIndex > 0) {
      const prevLessonIndex = currentLessonIndex - 1;
      setCurrentLessonIndex(prevLessonIndex);
      setCurrentWordIndex(LESSONS[prevLessonIndex].words.length - 1);
    }
    handleClear();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBackgroundImage(event.target?.result as string);
        handleClear();
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Dossier Header */}
      <header className="bg-[#4a3b2b] text-[#f4ecd8] px-6 py-4 flex items-center justify-between border-b-4 border-[#2b2b2b] z-50">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-60">Intelligence Dossier v.1947</span>
          <h1 className="font-bold text-2xl typewriter tracking-tight flex items-center gap-3">
             CLASSIFIED: GREGG PROJECT
          </h1>
        </div>
        <div className="flex bg-[#2b2b2b] rounded-md p-1 border border-[#6b5b4b]">
          <button
            onClick={() => { setMode(AppMode.LEARN); handleClear(); }}
            className={`px-4 py-1.5 rounded text-xs font-bold uppercase transition-all ${
              mode === AppMode.LEARN ? 'bg-[#8b0000] text-white shadow-inner' : 'text-gray-400'
            }`}
          >
            Train
          </button>
          <button
            onClick={() => { setMode(AppMode.TRANSLATE); handleClear(); }}
            className={`px-4 py-1.5 rounded text-xs font-bold uppercase transition-all ${
              mode === AppMode.TRANSLATE ? 'bg-[#8b0000] text-white shadow-inner' : 'text-gray-400'
            }`}
          >
            Decode
          </button>
        </div>
      </header>

      {/* Main Dossier Body */}
      <main className="flex-1 flex flex-col relative overflow-hidden spy-paper">
        {/* Progress Bar */}
        <div className="bg-[#d4c2a1] h-2 w-full">
           <div 
             className="bg-[#8b0000] h-full transition-all duration-500" 
             style={{ width: `${((currentLessonIndex * 10 + currentWordIndex) / (LESSONS.length * 10)) * 100}%` }}
           />
        </div>

        {/* Word Info Block */}
        <div className="px-8 py-6 border-b-2 border-dashed border-black/10 z-10 bg-inherit">
          {mode === AppMode.LEARN ? (
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <button 
                  onClick={() => setShowLessonSelector(true)}
                  className="text-[11px] font-bold typewriter text-[#8b0000] underline uppercase mb-4 block"
                >
                  FILE: {currentLesson.title}
                </button>
                <div className="flex items-center gap-12">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">STENO KEY:</span>
                      <h2 className="text-6xl font-black text-[#2b2b2b] typewriter drop-shadow-sm">{currentWord.word}</h2>
                   </div>
                   <div className="max-w-[300px]">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">INTEL HINT:</span>
                      <p className="text-sm font-medium italic text-gray-600 leading-tight typewriter">{currentWord.hint}</p>
                   </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                 <button onClick={handleNextWord} className="p-3 bg-black/5 hover:bg-black/10 rounded-full transition-all active:scale-90">
                    <svg className="w-8 h-8 text-[#8b0000]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                 </button>
                 <button onClick={handlePrevWord} className="p-2 bg-black/5 hover:bg-black/10 rounded-full transition-all opacity-50 active:scale-90">
                    <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                 </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-3xl font-black typewriter text-[#2b2b2b]">DECRYPTION CHAMBER</h2>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Type to assemble or draw to decode</p>
                  <button 
                    onClick={() => setShowKeyboardMap(!showKeyboardMap)}
                    className="text-[10px] font-black text-blue-600 border border-blue-200 px-2 py-0.5 rounded hover:bg-blue-50"
                  >
                    {showKeyboardMap ? 'HIDE KEY MAP' : 'SHOW KEY MAP'}
                  </button>
                </div>
              </div>
              <div className="flex gap-4">
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                 <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-[#d4c2a1] border-2 border-black/20 text-xs font-bold rounded shadow-sm hover:shadow-md transition-all active:translate-y-0.5"
                 >
                   IMPORT EVIDENCE
                 </button>
                 {backgroundImage && (
                   <button onClick={handleClearBackground} className="px-4 py-2 bg-red-100 text-red-800 border-2 border-red-200 text-xs font-bold rounded">
                     BURN EVIDENCE
                   </button>
                 )}
              </div>
            </div>
          )}
        </div>

        {/* Keyboard Mapper (Floating overlay) */}
        {mode === AppMode.TRANSLATE && showKeyboardMap && (
          <div className="absolute top-24 left-8 grid grid-cols-4 gap-2 z-40 bg-[#e2d1b3] p-4 border-2 border-black/20 shadow-xl rounded animate-in fade-in slide-in-from-left duration-300">
             {STENO_KEYS.map(sk => (
               <button 
                 key={sk.key}
                 onClick={() => canvasRef.current?.drawPrimitive(sk.key)}
                 className="flex flex-col items-center p-2 bg-white/50 border border-black/10 rounded hover:bg-white transition-colors"
               >
                 <span className="text-xs font-black typewriter text-[#8b0000]">{sk.key.toUpperCase()}</span>
                 <span className="text-[8px] font-bold text-gray-500 uppercase">{sk.label}</span>
               </button>
             ))}
          </div>
        )}

        {/* Drawing Surface */}
        <div className="flex-1 relative cursor-crosshair">
          <ShorthandCanvas ref={canvasRef} backgroundImage={backgroundImage} className="opacity-90" />
          
          {/* Top Secret Stamp Decoration */}
          <div className="absolute top-10 right-10 top-secret-stamp pointer-events-none select-none z-0">
            Top Secret
          </div>
        </div>

        {/* Recognition Results */}
        {(result || error || isLoading) && (
          <div className="absolute inset-x-0 bottom-0 p-6 z-20 pointer-events-none">
            <div className={`mx-auto max-w-2xl bg-[#e2d1b3] border-4 border-[#2b2b2b] p-6 shadow-2xl pointer-events-auto transition-all duration-500 ${isLoading ? 'translate-y-4 opacity-70' : 'translate-y-0'}`}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black typewriter bg-black text-white px-2 py-1 uppercase">INCOMING TRANSMISSION</span>
                <button onClick={() => {setResult(null); setError(null);}} className="text-black/30 hover:text-black">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center gap-4">
                   <div className="h-2 w-2 bg-[#8b0000] animate-ping rounded-full"></div>
                   <p className="typewriter text-sm font-bold animate-pulse">DECODING STROKES... PLEASE WAIT...</p>
                </div>
              ) : error ? (
                <p className="typewriter text-red-700 font-bold">CRITICAL ERROR: {error}</p>
              ) : (
                <div className="flex gap-8 items-start">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-black/40 mb-1">DECODED AS:</span>
                      <span className="text-5xl font-black typewriter text-[#8b0000]">{result?.prediction}</span>
                      <span className="text-[10px] font-black text-black/50 mt-1">CONFIDENCE: {Math.round((result?.confidence || 0) * 100)}%</span>
                   </div>
                   <div className="flex-1">
                      <span className="text-[10px] font-bold text-black/40 mb-1">NOTES:</span>
                      <p className="text-sm typewriter leading-relaxed">{result?.explanation}</p>
                   </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Control Footer */}
      <footer className="bg-[#4a3b2b] px-8 py-6 flex gap-6 border-t-4 border-[#2b2b2b] z-50">
        <button
          onClick={handleClear}
          className="px-8 py-3 bg-[#2b2b2b] text-white text-xs font-black uppercase tracking-[0.2em] border border-white/10 hover:bg-[#1a1a1a] transition-all active:scale-95 shadow-md"
        >
          SCRUB SLATE
        </button>
        <button
          onClick={handleCheck}
          disabled={isLoading}
          className={`flex-1 py-3 px-8 text-xs font-black uppercase tracking-[0.3em] text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-4 ${
            isLoading ? 'bg-gray-600' : 'bg-[#8b0000] hover:bg-[#a00000] border-b-4 border-[#500000]'
          }`}
        >
          {mode === AppMode.LEARN ? 'SEND FOR ANALYSIS' : 'EXECUTE DECODE'}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </button>
      </footer>

      {/* Archive Modal */}
      {showLessonSelector && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-[#d4c2a1] w-full max-w-2xl rounded-sm border-8 border-[#4a3b2b] shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col max-h-[85vh]">
            <div className="p-6 bg-[#4a3b2b] text-[#f4ecd8] flex items-center justify-between">
              <h3 className="text-xl font-bold typewriter uppercase">Project Archives</h3>
              <button onClick={() => setShowLessonSelector(false)} className="text-white hover:opacity-50">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4">
              {LESSONS.map((lesson, idx) => (
                <button
                  key={lesson.id}
                  onClick={() => { setCurrentLessonIndex(idx); setCurrentWordIndex(0); setShowLessonSelector(false); }}
                  className={`w-full text-left p-6 border-2 transition-all flex items-center justify-between group ${
                    currentLessonIndex === idx ? 'bg-[#f4ecd8] border-[#8b0000]' : 'bg-[#e2d1b3] border-black/10 hover:bg-[#f4ecd8] hover:border-[#4a3b2b]'
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-black uppercase text-gray-500 mb-1 block">Dossier #{idx + 1}</span>
                    <h4 className="font-bold text-lg typewriter">{lesson.title}</h4>
                    <p className="text-xs text-gray-600 typewriter mt-1">{lesson.description}</p>
                  </div>
                  <div className={`h-12 w-12 rounded border-2 border-dashed flex items-center justify-center opacity-0 group-hover:opacity-100 ${currentLessonIndex === idx ? 'opacity-100 border-[#8b0000] text-[#8b0000]' : 'border-black text-black'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-4 bg-[#4a3b2b] text-center">
              <span className="text-[9px] font-bold text-white/40 uppercase tracking-[0.5em]">Unauthorized Access Strictly Prohibited</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
