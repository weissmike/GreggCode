
import React, { useState, useRef, useEffect } from 'react';
import { AppMode, FolioGuide, RecognitionResult } from './types';
import { FOLIO_GUIDES, GLYPH_OPTIONS, LESSONS } from './constants';
import { analyzeShorthandImage, recognizeShorthand } from './services/geminiService';
import { recognizeFromPrimitives, recognizeFromStrokes } from './services/localRecognition';
import { parseLatexPrimitives } from './services/latexParser';
import { loadUserGuideBlob, loadUserGuides, saveUserGuide } from './services/folioStore';
import ShorthandCanvas, { ShorthandCanvasHandle } from './components/ShorthandCanvas';
import GlyphTile from './components/GlyphTile';

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

const GLYPH_COMMANDS = GLYPH_OPTIONS.filter((glyph) => glyph.command.length <= 3);

const GUIDE_FALLBACK_IMAGE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='640' height='420'><rect width='100%25' height='100%25' fill='%23d4c2a1'/><text x='50%25' y='50%25' font-family='Courier New, monospace' font-size='24' fill='%232b2b2b' dominant-baseline='middle' text-anchor='middle'>MISSING GUIDE IMAGE</text></svg>";

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.LEARN);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [resultSource, setResultSource] = useState<'local' | 'ai' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLessonSelector, setShowLessonSelector] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [showKeyboardMap, setShowKeyboardMap] = useState(false);
  const [latexInput, setLatexInput] = useState('');
  const [latexPreview, setLatexPreview] = useState('');
  const [clipboardStatus, setClipboardStatus] = useState<string | null>(null);
  const [glyphFilter, setGlyphFilter] = useState('');
  const [primitiveTokens, setPrimitiveTokens] = useState<string[]>([]);
  const [inputMode, setInputMode] = useState<'freehand' | 'primitives' | null>(null);
  const [useAiFallback, setUseAiFallback] = useState(true);
  const [analysisText, setAnalysisText] = useState('');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [userGuides, setUserGuides] = useState<FolioGuide[]>([]);
  const [showAddGuideModal, setShowAddGuideModal] = useState(false);
  const [newGuideTitle, setNewGuideTitle] = useState('');
  const [newGuideDescription, setNewGuideDescription] = useState('');
  const [newGuideFile, setNewGuideFile] = useState<File | null>(null);
  const [activeGuide, setActiveGuide] = useState<FolioGuide | null>(null);
  const [userGuideUrls, setUserGuideUrls] = useState<Record<string, string>>({});
  
  const canvasRef = useRef<ShorthandCanvasHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folioFileInputRef = useRef<HTMLInputElement>(null);
  const userGuideUrlsRef = useRef<Record<string, string>>({});
  
  const currentLesson = LESSONS[currentLessonIndex];
  const currentWord = currentLesson.words[currentWordIndex];
  const allGuides = [...FOLIO_GUIDES, ...userGuides];
  const getGuideUrl = (guide: FolioGuide) =>
    guide.type === 'built-in' ? guide.assetUrl : userGuideUrls[guide.id];
  const glyphOptions = GLYPH_OPTIONS;
  const filteredGlyphs = glyphOptions.filter((glyph) => {
    const needle = glyphFilter.trim().toLowerCase();
    if (!needle) return true;
    return (
      glyph.label.toLowerCase().includes(needle)
      || glyph.hint.toLowerCase().includes(needle)
      || glyph.command.toLowerCase().includes(needle)
    );
  });

  const registerPrimitive = (token: string) => {
    setPrimitiveTokens((prev) => [...prev, token]);
    setInputMode('primitives');
  };

  const markFreehandStart = () => {
    setInputMode('freehand');
    setPrimitiveTokens([]);
  };

  const refreshUserGuides = async () => {
    const guides = await loadUserGuides();
    const nextUrls: Record<string, string> = {};

    for (const guide of guides) {
      const blob = await loadUserGuideBlob(guide.id);
      if (blob) {
        nextUrls[guide.id] = URL.createObjectURL(blob);
      }
    }

    setUserGuideUrls((prev) => {
      Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
      return nextUrls;
    });
    userGuideUrlsRef.current = nextUrls;
    setUserGuides(guides);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === AppMode.TRANSLATE && !isLoading) {
        if (STENO_KEYS.some(sk => sk.key === e.key.toLowerCase()) || e.key === ' ') {
          const token = e.key === ' ' ? ' ' : e.key.toLowerCase();
          canvasRef.current?.drawPrimitive(token);
          registerPrimitive(token);
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

  useEffect(() => {
    refreshUserGuides().catch(() => {
      setUserGuides([]);
      setUserGuideUrls({});
      userGuideUrlsRef.current = {};
    });

    return () => {
      Object.values(userGuideUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleCheck = async () => {
    if (!canvasRef.current) return;
    const imageData = canvasRef.current.getDataUrl();
    const strokes = canvasRef.current.getStrokes();
    
    setIsLoading(true);
    setResult(null);
    setError(null);
    setResultSource(null);

    try {
      if (inputMode === 'primitives' && primitiveTokens.length) {
        const recognition = recognizeFromPrimitives(primitiveTokens);
        setResult(recognition);
        setResultSource('local');
        return;
      }

      const localRecognition = recognizeFromStrokes(strokes);
      if (!useAiFallback || localRecognition.confidence >= 0.6) {
        setResult(localRecognition);
        setResultSource('local');
        return;
      }

      const recognition = await recognizeShorthand(
        imageData, 
        mode === AppMode.LEARN ? currentWord.word : undefined
      );
      setResult(recognition);
      setResultSource('ai');
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
    setResultSource(null);
    setLatexInput('');
    setLatexPreview('');
    setClipboardStatus(null);
    setAnalysisText('');
    setAnalysisError(null);
    setPrimitiveTokens([]);
    setInputMode(null);
  };

  const handleClearBackground = () => {
    setBackgroundImage(null);
    setAnalysisText('');
    setAnalysisError(null);
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
        setAnalysisText('');
        setAnalysisError(null);
        handleClear();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClipboardImport = async () => {
    setClipboardStatus(null);
    if (!navigator.clipboard || !('read' in navigator.clipboard)) {
      setClipboardStatus('Clipboard read is not supported in this browser.');
      return;
    }

    try {
      const items = await navigator.clipboard.read();
      const imageItem = items.find((item) => item.types.some((type) => type.startsWith('image/')));
      if (!imageItem) {
        setClipboardStatus('No image found in clipboard.');
        return;
      }
      const imageType = imageItem.types.find((type) => type.startsWith('image/')) || 'image/png';
      const blob = await imageItem.getType(imageType);
      const reader = new FileReader();
      reader.onload = (event) => {
        setBackgroundImage(event.target?.result as string);
        setAnalysisText('');
        setAnalysisError(null);
        handleClear();
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Clipboard read failed', err);
      setClipboardStatus('Clipboard access denied. Use Import Evidence instead.');
    }
  };

  const appendGlyphToken = (token: string) => {
    setLatexPreview((prev) => (prev ? `${prev} ${token}` : token));
  };

  const clearGlyphSnippet = () => {
    setLatexPreview('');
  };

  const handleRenderLatex = () => {
    if (!canvasRef.current) return;
    const source = latexInput.trim() || latexPreview.trim();
    const tokens = parseLatexPrimitives(source);
    if (!tokens.length) return;
    tokens.forEach((token) => {
      canvasRef.current?.drawPrimitive(token);
      registerPrimitive(token);
    });
  };

  const handleAnalyzeEvidence = async () => {
    if (!backgroundImage) return;
    setAnalysisLoading(true);
    setAnalysisError(null);
    setAnalysisText('');
    try {
      const report = await analyzeShorthandImage(backgroundImage);
      setAnalysisText(report.trim());
    } catch (err: any) {
      setAnalysisError(err.message || 'Analysis failed.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleAddGuide = async () => {
    if (!newGuideFile || !newGuideTitle.trim()) return;
    const guideId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `guide-${Date.now()}`;

    const guide: FolioGuide = {
      id: guideId,
      title: newGuideTitle.trim(),
      description: newGuideDescription.trim() || undefined,
      type: 'user',
      createdAt: new Date().toISOString()
    };

    try {
      await saveUserGuide(guide, newGuideFile);
      setShowAddGuideModal(false);
      setNewGuideTitle('');
      setNewGuideDescription('');
      setNewGuideFile(null);
      if (folioFileInputRef.current) {
        folioFileInputRef.current.value = '';
      }
      await refreshUserGuides();
    } catch (err) {
      console.error('Failed to save guide', err);
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
          <button
            onClick={() => { setMode(AppMode.FOLIO); handleClear(); }}
            className={`px-4 py-1.5 rounded text-xs font-bold uppercase transition-all ${
              mode === AppMode.FOLIO ? 'bg-[#8b0000] text-white shadow-inner' : 'text-gray-400'
            }`}
          >
            Folio
          </button>
        </div>
      </header>

      {/* Main Dossier Body */}
      <main className="flex-1 flex flex-col relative overflow-hidden spy-paper">
        {mode !== AppMode.FOLIO && (
          <>
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
                <div className="mt-4 flex flex-col gap-2 max-w-2xl">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">LATEX ENTRY</label>
                  <div className="flex flex-col md:flex-row gap-2">
                    <input
                      value={latexInput}
                      onChange={(e) => setLatexInput(e.target.value)}
                      placeholder="\\t \\n \\e \\space \\r"
                      className="flex-1 px-3 py-2 text-xs font-bold uppercase tracking-widest bg-white/60 border-2 border-black/10 rounded"
                    />
                    <button
                      onClick={handleRenderLatex}
                      className="px-4 py-2 bg-[#2b2b2b] text-white text-xs font-black uppercase tracking-[0.2em] border border-white/10 hover:bg-[#1a1a1a] transition-all"
                    >
                      Render
                    </button>
                  </div>
                  <div className="mt-4 border-2 border-black/10 bg-white/60 rounded p-3 max-w-md">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.3em]">Glyph Matrix</label>
                      <input
                        value={glyphFilter}
                        onChange={(e) => setGlyphFilter(e.target.value)}
                        placeholder="filter: curve, tick, \\t"
                        className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest bg-white/80 border border-black/10 rounded w-40"
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto pr-1">
                      <div className="grid grid-cols-4 gap-2">
                        {filteredGlyphs.map((glyph) => (
                          <GlyphTile
                            key={glyph.command}
                            label={glyph.label}
                            hint={glyph.hint}
                            command={glyph.command}
                            tokens={parseLatexPrimitives(glyph.command)}
                            onSelect={appendGlyphToken}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 border-2 border-black/10 bg-white/60 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.3em]">Snippet Builder</span>
                      <button
                        onClick={clearGlyphSnippet}
                        className="text-[10px] font-bold text-[#8b0000] uppercase"
                      >
                        Clear Snippet
                      </button>
                    </div>
                    <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.3em]">Snippet</span>
                      <div className="flex-1 text-[10px] font-bold uppercase tracking-widest bg-white/80 border border-black/10 rounded px-2 py-1 min-h-[28px]">
                        {latexPreview || '--'}
                      </div>
                      <button
                        onClick={() => setLatexInput(latexPreview)}
                        className="px-2 py-1 text-[10px] font-bold uppercase bg-[#2b2b2b] text-white border border-white/10 rounded"
                      >
                        Copy to Input
                      </button>
                      <button
                        onClick={handleRenderLatex}
                        className="px-2 py-1 text-[10px] font-bold uppercase bg-[#8b0000] text-white border border-[#500000] rounded"
                      >
                        Render Snippet
                      </button>
                    </div>
                  </div>
                  <p className="text-[9px] text-gray-500 uppercase tracking-[0.3em]">
                    Commands: \\t \\d \\n \\m \\p \\b \\f \\v \\r \\l \\e \\a \\s \\space
                  </p>
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
                 <button
                  onClick={handleClipboardImport}
                  className="px-4 py-2 bg-[#2b2b2b] text-white border-2 border-black/20 text-xs font-bold rounded shadow-sm hover:shadow-md transition-all active:translate-y-0.5"
                 >
                   PASTE EVIDENCE
                 </button>
                 {backgroundImage && (
                   <button onClick={handleClearBackground} className="px-4 py-2 bg-red-100 text-red-800 border-2 border-red-200 text-xs font-bold rounded">
                     BURN EVIDENCE
                   </button>
                 )}
                 {clipboardStatus && (
                  <span className="text-[10px] font-bold text-[#8b0000] uppercase self-center">
                    {clipboardStatus}
                  </span>
                 )}
              </div>
            </div>
              )}
            </div>
          </>
        )}

        {mode === AppMode.FOLIO && (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-black typewriter text-[#2b2b2b]">FIELD FOLIO</h2>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                  Quick guides and user dossiers
                </p>
              </div>
              <button
                onClick={() => setShowAddGuideModal(true)}
                className="px-4 py-2 bg-[#8b0000] text-white text-xs font-black uppercase tracking-[0.3em] border-b-4 border-[#500000] shadow-lg active:scale-95 transition-all"
              >
                Add Guide
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {allGuides.map((guide) => (
                <button
                  key={guide.id}
                  onClick={() => setActiveGuide(guide)}
                  className="text-left bg-[#e2d1b3] border-2 border-black/20 p-4 shadow-md hover:shadow-xl transition-all group"
                >
                  <div className="h-40 bg-[#d4c2a1] border border-black/10 overflow-hidden">
                    <img
                      src={getGuideUrl(guide) || GUIDE_FALLBACK_IMAGE}
                      alt={guide.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = GUIDE_FALLBACK_IMAGE;
                      }}
                    />
                  </div>
                  <div className="mt-3">
                    <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-500">
                      {guide.type === 'built-in' ? 'ARCHIVE' : 'USER'}
                    </span>
                    <h3 className="text-lg font-black typewriter text-[#2b2b2b] mt-1">{guide.title}</h3>
                    {guide.description && (
                      <p className="text-xs text-gray-600 typewriter mt-1">{guide.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Keyboard Mapper (Floating overlay) */}
        {mode === AppMode.TRANSLATE && showKeyboardMap && (
          <div className="absolute top-24 left-8 grid grid-cols-4 gap-2 z-40 bg-[#e2d1b3] p-4 border-2 border-black/20 shadow-xl rounded animate-in fade-in slide-in-from-left duration-300">
             {STENO_KEYS.map(sk => (
               <button 
                 key={sk.key}
                 onClick={() => {
                   canvasRef.current?.drawPrimitive(sk.key);
                   registerPrimitive(sk.key);
                 }}
                 className="flex flex-col items-center p-2 bg-white/50 border border-black/10 rounded hover:bg-white transition-colors"
               >
                 <span className="text-xs font-black typewriter text-[#8b0000]">{sk.key.toUpperCase()}</span>
                 <span className="text-[8px] font-bold text-gray-500 uppercase">{sk.label}</span>
               </button>
             ))}
          </div>
        )}

        {/* Drawing Surface */}
        {mode !== AppMode.FOLIO && (
          <div className={`flex-1 ${mode === AppMode.TRANSLATE && backgroundImage ? 'flex flex-col md:flex-row' : 'relative'}`}>
            <div className="relative flex-1 cursor-crosshair">
              <ShorthandCanvas
                ref={canvasRef}
                backgroundImage={backgroundImage}
                className="opacity-90"
                onFreehandStart={markFreehandStart}
              />
              
              {/* Top Secret Stamp Decoration */}
              <div className="absolute top-10 right-10 top-secret-stamp pointer-events-none select-none z-0">
                Top Secret
              </div>
            </div>
            {mode === AppMode.TRANSLATE && backgroundImage && (
              <aside className="w-full md:w-96 border-l-4 border-[#2b2b2b] bg-[#d4c2a1] p-4 flex flex-col gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-600">Evidence Image</span>
                  <div className="mt-2 border-2 border-black/30 bg-[#f4ecd8] p-2">
                    <img
                      src={backgroundImage}
                      alt="Uploaded evidence"
                      className="w-full h-48 object-contain"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-600">AI Breakdown</span>
                  <button
                    onClick={handleAnalyzeEvidence}
                    disabled={analysisLoading}
                    className={`px-3 py-1 text-[10px] font-bold uppercase border ${
                      analysisLoading
                        ? 'bg-gray-500 text-white/60 border-gray-600'
                        : 'bg-[#8b0000] text-white border-[#500000]'
                    }`}
                  >
                    {analysisLoading ? 'Analyzing...' : 'Analyze Evidence'}
                  </button>
                </div>
                <div className="border-2 border-black/20 bg-[#f4ecd8] p-3 text-xs typewriter h-40 overflow-y-auto whitespace-pre-wrap">
                  {analysisError
                    ? `ERROR: ${analysisError}`
                    : analysisText || 'No report yet. Run analysis to compare.'}
                </div>
              </aside>
            )}
          </div>
        )}

        {/* Recognition Results */}
        {mode !== AppMode.FOLIO && (result || error || isLoading) && (
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
                      {resultSource && (
                        <span className="text-[10px] font-black text-black/40 mt-1">SOURCE: {resultSource.toUpperCase()}</span>
                      )}
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
      {mode !== AppMode.FOLIO && (
        <footer className="bg-[#4a3b2b] px-8 py-6 flex gap-6 border-t-4 border-[#2b2b2b] z-50">
          <button
            onClick={handleClear}
            className="px-8 py-3 bg-[#2b2b2b] text-white text-xs font-black uppercase tracking-[0.2em] border border-white/10 hover:bg-[#1a1a1a] transition-all active:scale-95 shadow-md"
          >
            SCRUB SLATE
          </button>
          <button
            onClick={() => setUseAiFallback((prev) => !prev)}
            className="px-6 py-3 bg-[#d4c2a1] text-[#2b2b2b] text-xs font-black uppercase tracking-[0.2em] border-2 border-black/20 shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            AI FALLBACK: {useAiFallback ? 'ON' : 'OFF'}
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
      )}

      {/* Folio Viewer Modal */}
      {mode === AppMode.FOLIO && activeGuide && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-[#d4c2a1] w-full max-w-4xl rounded-sm border-8 border-[#4a3b2b] shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh]">
            <div className="p-6 bg-[#4a3b2b] text-[#f4ecd8] flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold typewriter uppercase">{activeGuide.title}</h3>
                {activeGuide.description && (
                  <p className="text-xs text-white/70 uppercase tracking-widest mt-1">{activeGuide.description}</p>
                )}
              </div>
              <button onClick={() => setActiveGuide(null)} className="text-white hover:opacity-50">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto p-6 bg-[#e2d1b3]">
              <img
                src={getGuideUrl(activeGuide) || GUIDE_FALLBACK_IMAGE}
                alt={activeGuide.title}
                className="w-full max-h-[70vh] object-contain border-4 border-[#2b2b2b]"
                onError={(e) => {
                  e.currentTarget.src = GUIDE_FALLBACK_IMAGE;
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Guide Modal */}
      {mode === AppMode.FOLIO && showAddGuideModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-[#d4c2a1] w-full max-w-2xl rounded-sm border-8 border-[#4a3b2b] shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col">
            <div className="p-6 bg-[#4a3b2b] text-[#f4ecd8] flex items-center justify-between">
              <h3 className="text-xl font-bold typewriter uppercase">Add Field Guide</h3>
              <button onClick={() => setShowAddGuideModal(false)} className="text-white hover:opacity-50">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Title</label>
                <input
                  value={newGuideTitle}
                  onChange={(e) => setNewGuideTitle(e.target.value)}
                  className="mt-2 w-full px-3 py-2 text-sm font-bold bg-white/70 border-2 border-black/10 rounded"
                  placeholder="Brief Forms - Custom"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Description</label>
                <input
                  value={newGuideDescription}
                  onChange={(e) => setNewGuideDescription(e.target.value)}
                  className="mt-2 w-full px-3 py-2 text-sm bg-white/70 border-2 border-black/10 rounded"
                  placeholder="Optional notes for this guide"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Image</label>
                <input
                  ref={folioFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewGuideFile(e.target.files?.[0] || null)}
                  className="mt-2 w-full text-xs"
                />
              </div>
            </div>
            <div className="p-6 bg-[#4a3b2b] flex justify-end gap-3">
              <button
                onClick={() => setShowAddGuideModal(false)}
                className="px-4 py-2 bg-black/30 text-white text-xs font-bold uppercase tracking-widest border border-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handleAddGuide}
                disabled={!newGuideTitle.trim() || !newGuideFile}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border ${
                  !newGuideTitle.trim() || !newGuideFile
                    ? 'bg-gray-500 text-white/60 border-gray-600'
                    : 'bg-[#8b0000] text-white border-[#500000]'
                }`}
              >
                Save Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {showLessonSelector && mode === AppMode.LEARN && (
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
