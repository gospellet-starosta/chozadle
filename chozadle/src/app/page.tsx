"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface CharacterBase {
  id: number;
  nickname: string;
  first_name: string;
  gender: string;
  nationality: string;
  appearance_year: number;
  iconic_phrase: string;
  image_url: string | null;
}

interface GuessFeedback {
  isCorrect: boolean;
  characterData: CharacterBase;
  comparision?:{
    first_name: 'match' | 'miss';
    gender: 'match' | 'miss';
    nationality: 'match' | 'miss';
    appearance_year: 'match' | 'higher' | 'lower';
  };
}

interface UserStats {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
}

export default function GameBoard() {
  const [guesses, setGuesses] = useState<GuessFeedback[]>([]);

  const [gameStatus, setGameStatus] = useState<'playing'|'won'|'lost'>('playing');

  const [iconicPhrase, setIconicPhrase] = useState<string | null>(null);

  const [availableCharacters, setAvailableCharacters] = useState<{id: number, nickname: string}[]>([]);

  const [searchQuery, setSearchQuery] = useState('');

  const [filteredCharacters, setFilteredCharacters] = useState<{id: number, nickname: string}[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const [stats, setStats] = useState<UserStats>({ played: 0, won: 0, currentStreak: 0, maxStreak: 0});

  const [showStats, setShowStats] = useState(false);

  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  useEffect(() => {
    const fetchCharacters = async () => {
      const { data, error } = await supabase
      .from('characters')
      .select('id, nickname')
      .order('nickname', { ascending: true});
      
      if (data && !error) {
        setAvailableCharacters(data);
      }
    };
    fetchCharacters();
  }, []);

  useEffect(() => {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('chozadle_date');
    const savedStats = localStorage.getItem('chozadle_stats');

     if (savedStats) setStats(JSON.parse(savedStats));


    if ((savedDate === today )) {
      const savedGuesses = localStorage.getItem('chozadle_guesses');
      const savedStatus = localStorage.getItem('chozadle_status');
      const savedPhrase = localStorage.getItem('chozadle_phrase');
    
      if (savedGuesses) setGuesses(JSON.parse(savedGuesses));
      if (savedStatus) setGameStatus(savedStatus as 'playing' | 'won' | 'lost');
      if (savedPhrase) setIconicPhrase(savedPhrase);
    } else {
      localStorage.removeItem('chozadle_guesses')
      localStorage.removeItem('chozadle_status')
      localStorage.removeItem('chozadle_phrase')
      localStorage.setItem('chozadle_date', today);
    }
  }, []);

  useEffect(() => {
    if (guesses.length > 0) {
      localStorage.setItem('chozadle_guesses', JSON.stringify(guesses));
      localStorage.setItem('chozadle_status', gameStatus);
      if (iconicPhrase) localStorage.setItem('chozadle_phrase', iconicPhrase);
    }
}, [guesses, gameStatus, iconicPhrase]);

const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
const query = e.target.value;
setSearchQuery(query);
setHighlightedIndex(-1); 

if (query.length > 0) {
  const matches = availableCharacters.filter(char =>
    char.nickname.toLowerCase().includes(query.toLowerCase()) &&
    !guesses.some(g => g.characterData.id === char.id)
  );
  setFilteredCharacters(matches);
} else {
  setFilteredCharacters([]);
}
};

const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (filteredCharacters.length === 0) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    setHighlightedIndex(prev => 
      prev < filteredCharacters.length - 1 ? prev + 1 : 0
    );
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    setHighlightedIndex((prev) => 
      (prev > 0 ? prev - 1 : -1)
    );
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (highlightedIndex >= 0 && highlightedIndex < filteredCharacters.length) {
      handleGuess(filteredCharacters[highlightedIndex].id);
    }
  }
}

const updateStats = (isWin: boolean) => {
    setStats(prev => {
      const newStats = {
        played: prev.played + 1,
        won: prev.won + (isWin ? 1 : 0),
        currentStreak: isWin ? prev.currentStreak + 1 : 0,
        maxStreak: isWin ? Math.max(prev.maxStreak, prev.currentStreak + 1) : prev.maxStreak,
      };
      localStorage.setItem('chozadle_stats', JSON.stringify(newStats));
      
      // Retrasamos la aparición de la ventana 2 segundos para dejar que las cartas giren primero
      setTimeout(() => setShowStats(true), 2000); 
      return newStats;
    });
  };

const handleGuess = async (characterId: number) => {
  setIsLoading(true);
  setSearchQuery('');
  setFilteredCharacters([]);

  try {
    const res = await fetch('/api/guess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guessedId: characterId })
    });

    const data = await res.json();

    if (res.ok) {
      const newGuesses = [data, ...guesses];
      setGuesses(newGuesses);

      if(data.isCorrect){ 
        setGameStatus('won');
        if (data.iconic_phrase) setIconicPhrase(data.iconic_phrase);
        updateStats(true);
      } else if (newGuesses.length >= 5) {
        setGameStatus('lost');
        updateStats(false);
      }
    }
  } catch (error) {
    console.error("Error al validar el personaje: " + error);
  } finally {
    setIsLoading(false);
  }
};

 return (
    <main className="min-h-screen bg-linear-to-br from-indigo-950 via-purple-900 to-black text-white flex flex-col items-center py-12 px-4 font-sans">
      <div className="w-full max-w-3xl flex flex-col items-center gap-8">
        
      <header className="text-center flex flex-col items-center">
        <button onClick={() => setShowStats(true)}
          className="absolute right-0 top-0 text-2xl hover:text-indigo-400 transition-colors"
          title="Estadísticas">
            📊
          </button>
          <img 
            src="/logo.png" 
            alt="Chozadle Logo" 
            className="w-64 h-auto object-contain mb-4"
          />
          <p className="text-gray-400">Adivina el personaje misterioso. Intentos: {guesses.length} / 5</p>
        </header>

        {gameStatus === 'won' && (
          <div className="bg-green-900/50 border border-green-500 text-green-200 p-4 rounded-lg text-center w-full">
            <h2 className="text-xl font-bold mb-1">¡Correcto!</h2>
            <p className="italic">"{iconicPhrase}"</p>
          </div>
        )}
        {gameStatus === 'lost' && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg text-center w-full">
            <h2 className="text-xl font-bold">Sin intentos restantes</h2>
            <p>Vuelve mañana para un nuevo personaje.</p>
          </div>
        )}

{gameStatus === 'playing' && (
          <div className="relative w-full max-w-md z-10 mx-auto">
            <input 
              type="text" 
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Escribe el nombre de un personaje..."
              className="w-full bg-black text-white border border-gray-700 focus:border-white rounded-md p-4 outline-none transition-colors disabled:opacity-50"
              autoComplete="off"
            />
            
            {filteredCharacters.length > 0 && (
              <ul className="absolute top-full left-0 w-full mt-2 bg-black border border-gray-700 rounded-md shadow-2xl max-h-60 overflow-y-auto">
                {filteredCharacters.map((char, index) => (
                  <li 
                    key={char.id}
                    onClick={() => handleGuess(char.id)}
                    className={`p-3 cursor-pointer text-gray-200 border-b border-gray-900 last:border-0 transition-colors
                      ${index === highlightedIndex ? 'bg-gray-700 text-white' : 'hover:bg-gray-800'}`}
                  >
                    {char.nickname}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

  <div className="w-full max-w-3xl mt-4">
        
          <div className="grid grid-cols-6 gap-2 text-center text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
            <div>ícono</div>
            <div>Personaje</div>
            <div>Nombre</div>
            <div>Género</div>
            <div>Nacionalidad</div>
            <div>Año</div>
          </div>

          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, index) => {
              const guess = guesses[index];

              if (!guess) {
                return (
                  <div key={index} className="grid grid-cols-6 gap-2 h-16">
                    <div className="bg-gray-900 border-2 border-gray-800 rounded"></div>
                    <div className="bg-gray-900 border-2 border-gray-800 rounded"></div>
                    <div className="bg-gray-900 border-2 border-gray-800 rounded"></div>
                    <div className="bg-gray-900 border-2 border-gray-800 rounded"></div>
                    <div className="bg-gray-900 border-2 border-gray-800 rounded"></div>
                    <div className="bg-gray-900 border-2 border-gray-800 rounded"></div>
                  </div>
                );
              }

              const { isCorrect, characterData, comparision } = guess;

              const isLatestGuess = index === 0;

              return (
                <div key={`guess-${characterData.id}`} className="grid grid-cols-6 gap-2 h-16 text-xs sm:text-sm md:text-base text-center font-bold shadow-lg">
                  

                    <div 
                    className={`flex items-center justify-center border-2 rounded overflow-hidden bg-gray-800 border-gray-700
                      ${isLatestGuess ? 'animate-flip-seq' : ''}`}
                    style={isLatestGuess ? { animationDelay: '0ms' } : {}}
                  >
                    {characterData.image_url ? (
                      <img 
                        src={characterData.image_url} 
                        alt={characterData.nickname} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600">?</span>
                    )}
                  </div>

                  <div className={`flex items-center justify-center border-2 rounded p-1 
                    ${isCorrect ? 'bg-green-600 border-green-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}
                    ${isLatestGuess ? 'animate-flip-seq' : ''}`}
                    style={isLatestGuess ? { animationDelay: '0ms'} : {}}
                    >
                    {characterData.nickname}
                  </div>

                  <div className={`flex items-center justify-center border-2 rounded p-1
                    ${isCorrect ? 'bg-green-600 border-green-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}
                    ${isLatestGuess ? 'animate-flip-seq' : ''}`}
                    style={isLatestGuess ? { animationDelay: '300ms'} : {}}
                    >
                      {characterData.first_name}
                  </div>

                  <div className={`flex items-center justify-center border-2 rounded p-1 
                    ${isCorrect || comparision?.gender === 'match' ? 'bg-green-600 border-green-500 text-white' : 'bg-red-600 border-red-500 text-white'}
                    ${isLatestGuess ? 'animate-flip-seq' : ''}`}
                    style={isLatestGuess ? { animationDelay: '600ms'} : {}}>
                    {characterData.gender}
                  </div>

                  <div className={`flex items-center justify-center border-2 rounded p-1 wrap-break-word leading-tight
                    ${isCorrect || comparision?.nationality === 'match' ? 'bg-green-600 border-green-500 text-white' : 'bg-red-600 border-red-500 text-white'}
                    ${isLatestGuess ? 'animate-flip-seq' : ''}`}
                    style={isLatestGuess ? { animationDelay: '900ms'} : {}}>
                    {characterData.nationality}
                  </div>
                    
               <div 
                    className={`flex items-center justify-center border-2 rounded p-1 
                      ${isCorrect || comparision?.appearance_year === 'match' ? 'bg-green-600 border-green-500 text-white' : 'bg-red-600 border-red-500 text-white'}
                      ${isLatestGuess ? 'animate-flip-seq' : ''}`}
                    style={isLatestGuess ? { animationDelay: '1000ms' } : {}}
                  >
                   <span>{characterData.appearance_year}</span>
                    {!isCorrect && comparision?.appearance_year === 'higher' && <span className="ml-1 text-lg">↑</span>}
                    {!isCorrect && comparision?.appearance_year === 'lower' && <span className="ml-1 text-lg">↓</span>}
                  </div>

                </div>
              );
            })}
          </div>
        </div>

    {showStats && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-sm text-center shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 tracking-widest text-indigo-400">ESTADÍSTICAS</h2>
            
            <div className="flex justify-between mb-8 px-2">
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-white">{stats.played}</span>
                <span className="text-xs text-gray-400 mt-1">Jugadas</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-white">
                  {stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0}
                </span>
                <span className="text-xs text-gray-400 mt-1">% Victorias</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-white">{stats.currentStreak}</span>
                <span className="text-xs text-gray-400 mt-1">Racha</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-white">{stats.maxStreak}</span>
                <span className="text-xs text-gray-400 mt-1">Mejor</span>
              </div>
            </div>

            <button 
              onClick={() => setShowStats(false)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded w-full transition-colors"
            >
              CERRAR
            </button>
          </div>
        </div>
      )}
      </div>
    </main>
  );
}
