import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Delete, Check, Info, Lightbulb } from 'lucide-react';
import { getRandomWordEntry, WORDS, WordEntry } from './constants';

type LetterStatus = 'correct' | 'present' | 'absent' | 'empty';

interface Guess {
  word: string;
  status: LetterStatus[];
}

export default function App() {
  const [targetEntry, setTargetEntry] = useState<WordEntry | null>(null);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [message, setMessage] = useState('');
  const [showInfo, setShowInfo] = useState(true);
  
  // Multi-round states
  const [currentRound, setCurrentRound] = useState(1);
  const [totalWins, setTotalWins] = useState(0);
  const [guessedWords, setGuessedWords] = useState<string[]>([]);
  const [showRoundSummary, setShowRoundSummary] = useState(false);
  const [showFinalScreen, setShowFinalScreen] = useState(false);

  // Hint states
  const [hintsUsed, setHintsUsed] = useState(0);
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const hintTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTargetEntry(getRandomWordEntry());
  }, []);

  const resetGame = () => {
    setTargetEntry(getRandomWordEntry());
    setGuesses([]);
    setCurrentGuess('');
    setGameState('playing');
    setMessage('');
    setHintsUsed(0);
    setActiveHint(null);
    setCurrentRound(1);
    setTotalWins(0);
    setGuessedWords([]);
    setShowRoundSummary(false);
    setShowFinalScreen(false);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
  };

  const nextRound = () => {
    if (currentRound < 5) {
      setTargetEntry(getRandomWordEntry());
      setGuesses([]);
      setCurrentGuess('');
      setGameState('playing');
      setMessage('');
      setHintsUsed(0);
      setActiveHint(null);
      setCurrentRound(prev => prev + 1);
      setShowRoundSummary(false);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    } else {
      setShowFinalScreen(true);
    }
  };

  const showHint = () => {
    if (gameState !== 'playing' || hintsUsed >= 2 || !targetEntry) return;

    const hintText = targetEntry.hints[hintsUsed];
    setActiveHint(hintText);
    setHintsUsed(prev => prev + 1);

    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    
    hintTimerRef.current = setTimeout(() => {
      setActiveHint(null);
    }, 10000); // 10 seconds
  };

  const checkGuess = (guess: string): LetterStatus[] => {
    if (!targetEntry) return [];
    const status: LetterStatus[] = Array(5).fill('absent');
    const targetArr = targetEntry.word.split('');
    const guessArr = guess.split('');

    // First pass: Correct positions
    guessArr.forEach((letter, i) => {
      if (letter === targetArr[i]) {
        status[i] = 'correct';
        targetArr[i] = '';
      }
    });

    // Second pass: Present but wrong position
    guessArr.forEach((letter, i) => {
      if (status[i] !== 'correct') {
        const index = targetArr.indexOf(letter);
        if (index !== -1) {
          status[i] = 'present';
          targetArr[index] = '';
        }
      }
    });

    return status;
  };

  const onKeyPress = useCallback((key: string) => {
    if (gameState !== 'playing' || !targetEntry || showRoundSummary || showFinalScreen) return;

    if (key === 'Enter') {
      if (currentGuess.length !== 5) {
        setMessage('Not enough letters');
        setTimeout(() => setMessage(''), 2000);
        return;
      }
      
      const status = checkGuess(currentGuess);
      const newGuesses = [...guesses, { word: currentGuess, status }];
      setGuesses(newGuesses);
      setCurrentGuess('');

      if (currentGuess === targetEntry.word) {
        setGameState('won');
        setTotalWins(prev => prev + 1);
        setGuessedWords(prev => [...prev, targetEntry.word]);
        setMessage('Magnificent!');
        setActiveHint(null);
        setTimeout(() => setShowRoundSummary(true), 2000);
      } else if (newGuesses.length === 6) {
        setGameState('lost');
        setMessage(`The word was ${targetEntry.word}`);
        setActiveHint(null);
        setTimeout(() => setShowRoundSummary(true), 2000);
      }
    } else if (key === 'Backspace') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (/^[A-ZÑ]$/.test(key.toUpperCase()) && currentGuess.length < 5) {
      setCurrentGuess(prev => prev + key.toUpperCase());
    }
  }, [currentGuess, gameState, guesses, targetEntry, showRoundSummary, showFinalScreen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      onKeyPress(e.key);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onKeyPress]);

  const getLetterColor = (status: LetterStatus) => {
    switch (status) {
      case 'correct': return 'bg-pink-400 text-white border-pink-400';
      case 'present': return 'bg-pink-200 text-pink-800 border-pink-200';
      case 'absent': return 'bg-stone-200 text-stone-500 border-stone-200';
      default: return 'bg-white text-stone-800 border-pink-100';
    }
  };

  const getKeyStatus = (key: string): LetterStatus => {
    let bestStatus: LetterStatus = 'empty';
    guesses.forEach(g => {
      g.word.split('').forEach((letter, i) => {
        if (letter === key) {
          const s = g.status[i];
          if (s === 'correct') bestStatus = 'correct';
          else if (s === 'present' && bestStatus !== 'correct') bestStatus = 'present';
          else if (s === 'absent' && bestStatus === 'empty') bestStatus = 'absent';
        }
      });
    });
    return bestStatus;
  };

  const Keyboard = () => {
    const rows = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
      ['Enter', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Backspace']
    ];

    return (
      <div className="mt-8 w-full max-w-md px-2">
        {rows.map((row, i) => (
          <div key={i} className="flex justify-center gap-1 mb-2">
            {row.map(key => {
              const status = getKeyStatus(key);
              const isSpecial = key === 'Enter' || key === 'Backspace';
              return (
                <button
                  key={key}
                  onClick={() => onKeyPress(key)}
                  className={`
                    ${isSpecial ? 'px-3 text-xs' : 'w-8 sm:w-10'} 
                    h-12 rounded-md font-medium transition-all active:scale-95
                    ${status === 'correct' ? 'bg-pink-400 text-white' : 
                      status === 'present' ? 'bg-pink-200 text-pink-800' :
                      status === 'absent' ? 'bg-stone-300 text-stone-600' :
                      'bg-pink-50 text-pink-900 border border-pink-100 hover:bg-pink-100'}
                  `}
                >
                  {key === 'Backspace' ? <Delete size={18} className="mx-auto" /> : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const Confetti = () => {
    return (
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {Array(50).fill(null).map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              top: -20, 
              left: `${Math.random() * 100}%`,
              rotate: 0,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{ 
              top: "120%",
              rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
              left: `${(Math.random() * 100) + (Math.random() * 20 - 10)}%`
            }}
            transition={{ 
              duration: Math.random() * 2 + 2, 
              ease: "linear",
              repeat: Infinity,
              delay: Math.random() * 2
            }}
            className="absolute w-3 h-3 rounded-sm"
            style={{ 
              backgroundColor: ['#f472b6', '#fbcfe8', '#db2777', '#f9a8d4', '#ffffff'][Math.floor(Math.random() * 5)] 
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4 font-sans overflow-hidden">
      {gameState === 'won' && <Confetti />}
      {/* Header */}
      <header className="w-full max-w-md flex justify-between items-center mb-8 border-b border-pink-100 pb-4">
        <div className="flex gap-4">
          <button onClick={() => setShowInfo(true)} className="text-pink-300 hover:text-pink-500 transition-colors">
            <Info size={24} />
          </button>
          <button 
            onClick={showHint} 
            disabled={hintsUsed >= 2 || gameState !== 'playing'}
            className={`transition-colors ${hintsUsed >= 2 || gameState !== 'playing' ? 'text-stone-200' : 'text-pink-300 hover:text-pink-500'}`}
          >
            <div className="relative">
              <Lightbulb size={24} />
              <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {2 - hintsUsed}
              </span>
            </div>
          </button>
        </div>
        <h1 className="text-3xl font-bold tracking-tighter text-pink-500">
          PINK<span className="font-light text-pink-300">DLE</span>
        </h1>
        <button onClick={resetGame} className="text-pink-300 hover:text-pink-500 transition-colors">
          <RefreshCw size={24} />
        </button>
      </header>

      {/* Hint Overlay */}
      <AnimatePresence>
        {activeHint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-40 w-full max-w-xs"
          >
            <div className="bg-pink-500 text-white p-4 rounded-2xl shadow-xl border-2 border-pink-300 text-center relative overflow-hidden">
              <div className="text-xs uppercase tracking-widest opacity-70 mb-1 font-bold">Pista</div>
              <p className="text-lg font-medium leading-tight">{activeHint}</p>
              {/* Progress bar for 10s */}
              <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 10, ease: "linear" }}
                className="absolute bottom-0 left-0 h-1 bg-white/30"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Toast */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 z-50 bg-stone-800 text-white px-4 py-2 rounded-md shadow-lg text-sm font-medium"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Grid */}
      <div className="flex-1 flex flex-col justify-center gap-2">
        {Array(6).fill(null).map((_, i) => {
          const guess = guesses[i];
          const isCurrent = i === guesses.length;
          
          return (
            <div key={i} className="flex gap-2">
              {Array(5).fill(null).map((_, j) => {
                let char = '';
                let status: LetterStatus = 'empty';
                
                if (guess) {
                  char = guess.word[j];
                  status = guess.status[j];
                } else if (isCurrent) {
                  char = currentGuess[j] || '';
                }

                const isWinningRow = gameState === 'won' && i === guesses.length - 1;

                return (
                  <motion.div
                    key={j}
                    initial={false}
                    animate={
                      isWinningRow 
                        ? { 
                            y: [0, -20, 0],
                            scale: [1, 1.1, 1],
                            rotateX: [0, 90, 0]
                          } 
                        : status !== 'empty' 
                          ? { rotateX: [0, 90, 0] } 
                          : {}
                    }
                    transition={
                      isWinningRow 
                        ? { 
                            duration: 0.6, 
                            delay: j * 0.1,
                            repeat: 2,
                            repeatType: "reverse"
                          }
                        : { duration: 0.4, delay: j * 0.1 }
                    }
                    className={`
                      w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-2xl font-bold rounded-lg border-2
                      ${getLetterColor(status)}
                      ${isCurrent && char ? 'border-pink-300 scale-105' : ''}
                      ${isWinningRow ? 'shadow-lg shadow-pink-300/50' : ''}
                      transition-all duration-300
                    `}
                  >
                    {char}
                  </motion.div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Keyboard */}
      <Keyboard />

      {/* Round Summary Modal */}
      <AnimatePresence>
        {showRoundSummary && !showFinalScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-pink-900/40 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full border-4 border-pink-200 text-center"
            >
              <div className="mb-6">
                <div className="text-pink-300 text-xs font-bold uppercase tracking-widest mb-2">Ronda {currentRound} de 5</div>
                <h2 className={`text-4xl font-black ${gameState === 'won' ? 'text-pink-500' : 'text-stone-400'}`}>
                  {gameState === 'won' ? '¡LOGRADO!' : 'FALLIDO'}
                </h2>
              </div>

              <div className="bg-pink-50 rounded-2xl p-4 mb-6">
                <h3 className="text-pink-400 text-xs font-bold uppercase mb-3">Registro de Aciertos</h3>
                {guessedWords.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-2">
                    {guessedWords.map((w, idx) => (
                      <span key={idx} className="bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                        {w}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-stone-400 text-sm italic">Aún no has adivinado ninguna palabra</p>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div className="text-stone-500 text-sm font-medium">
                  Victorias: <span className="text-pink-500 font-bold">{totalWins}</span> / 5
                </div>
                <button
                  onClick={nextRound}
                  className="w-full py-4 bg-pink-500 text-white rounded-2xl font-black text-xl hover:bg-pink-600 transition-all shadow-lg shadow-pink-200 active:scale-95 flex items-center justify-center gap-2"
                >
                  {currentRound < 5 ? 'SIGUIENTE RONDA' : 'VER RESULTADO FINAL'}
                  <Check size={24} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Final Screen Overlay */}
      <AnimatePresence>
        {showFinalScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-pink-500 p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, rotate: -5 }}
              animate={{ scale: 1, rotate: 0 }}
              className="max-w-md w-full"
            >
              {totalWins >= 3 ? (
                <>
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-8xl mb-6"
                  >
                    👑
                  </motion.div>
                  <h1 className="text-5xl font-black text-white mb-4 leading-tight">
                    ¡ENHORABUENA!
                  </h1>
                  <p className="text-pink-100 text-xl mb-4 font-medium">
                    Has completado el juego con éxito adivinando {totalWins} palabras.
                  </p>
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/30">
                    <div className="text-pink-100 text-xs font-bold uppercase tracking-widest mb-2">Tu Contraseña Especial</div>
                    <div className="text-6xl font-black text-white tracking-tighter">
                      {totalWins === 3 ? 'Presencia' : totalWins === 4 ? 'Ternura' : 'Mirada'}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-8xl mb-6">💔</div>
                  <h1 className="text-5xl font-black text-white mb-4 leading-tight">
                    ¡CASI LO LOGRAS!
                  </h1>
                  <p className="text-pink-100 text-xl mb-8 font-medium">
                    Necesitabas 3 aciertos, pero has conseguido {totalWins}. ¿Quieres intentarlo de nuevo?
                  </p>
                </>
              )}

              <button
                onClick={resetGame}
                className="w-full py-5 bg-white text-pink-500 rounded-3xl font-black text-2xl hover:bg-pink-50 transition-all shadow-2xl active:scale-95"
              >
                VOLVER A EMPEZAR
              </button>
            </motion.div>
            
            {totalWins >= 3 && <Confetti />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-pink-900/10 backdrop-blur-sm p-4"
            onClick={() => setShowInfo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-pink-50"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-pink-500 mb-4">Cómo Jugar</h2>
              <p className="text-stone-600 mb-4 leading-relaxed text-sm">
                Adivina la palabra en 6 intentos. Cada intento debe ser una palabra válida de 5 letras.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-pink-400 rounded flex items-center justify-center text-white font-bold">W</div>
                  <span className="text-sm text-stone-500">Posición correcta</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-pink-200 rounded flex items-center justify-center text-pink-800 font-bold">O</div>
                  <span className="text-sm text-stone-500">Letra presente, posición incorrecta</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-stone-200 rounded flex items-center justify-center text-stone-500 font-bold">R</div>
                  <span className="text-sm text-stone-500">No está en la palabra</span>
                </div>
              </div>
              
              <div className="bg-pink-50 p-4 rounded-xl mb-6 border border-pink-100">
                <h3 className="text-pink-500 font-bold text-sm mb-2">🎁 Recompensa Final</h3>
                <p className="text-xs text-stone-600 leading-tight">
                  ¡Demuestra tu estilo! Si logras adivinar al menos 3 palabras en las 5 rondas, desbloquearás una **contraseña exclusiva**.
                </p>
                <p className="mt-2 text-[10px] text-pink-600 font-bold italic">
                  La recompensa varía según tu puntuación (3, 4 o 5 aciertos). ¡A por todas!
                </p>
              </div>

              <p className="text-[10px] text-pink-400 font-medium mb-4 italic">
                Tip: Usa la bombilla para pistas (máx 2 por ronda).
              </p>
              <button
                onClick={() => setShowInfo(false)}
                className="w-full py-3 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600 transition-colors shadow-lg shadow-pink-200"
              >
                ¡ENTENDIDO!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
