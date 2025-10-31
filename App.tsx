
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, StoryData, Choice, RelationshipScores } from './types';
import { generateStory } from './services/geminiService';
import StartScreen from './components/StartScreen';
import LoadingScreen from './components/LoadingScreen';
import GameScreen from './components/GameScreen';
import EndScreen from './components/EndScreen';

const SAVE_KEY = 'geminiNarrativeSave';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [story, setStory] = useState<StoryData | null>(null);
  const [currentSceneId, setCurrentSceneId] = useState<string>('scene_1');
  const [error, setError] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string>('https://picsum.photos/seed/start/1920/1080');
  const [relationshipScores, setRelationshipScores] = useState<RelationshipScores>({});
  const [saveExists, setSaveExists] = useState<boolean>(false);
  const [lastAutosave, setLastAutosave] = useState<number>(0);

  useEffect(() => {
    const savedGame = localStorage.getItem(SAVE_KEY);
    setSaveExists(!!savedGame);
  }, []);

  const handleStartGame = useCallback(async () => {
    setGameState(GameState.LOADING);
    setError(null);
    try {
      const storyData = await generateStory();

      // Ensure player character exists for portrait display
      const playerExists = storyData.characters.some(c => c.name.toLowerCase() === 'you');
      if (!playerExists) {
        storyData.characters.push({
          name: 'You',
          description: 'The protagonist of this story.',
          portraitUrl: 'https://picsum.photos/seed/protagonist/200/200'
        });
      }
      
      setStory(storyData);
      setCurrentSceneId('scene_1');

      // Initialize relationship scores
      const initialScores: RelationshipScores = {};
      storyData.characters.forEach(char => {
        // Exclude the player character if they are in the list
        if (char.name.toLowerCase() !== 'you') {
          initialScores[char.name] = 0;
        }
      });
      setRelationshipScores(initialScores);

      if (storyData.scenes.scene_1.visuals.backgroundImage) {
        setBackgroundImage(storyData.scenes.scene_1.visuals.backgroundImage);
      }
      setGameState(GameState.PLAYING);
    } catch (err) {
      console.error(err);
      setError('Failed to generate story. Please check the API key and try again.');
      setGameState(GameState.START);
    }
  }, []);
  
  const handleResetGame = useCallback(() => {
    setGameState(GameState.START);
    setStory(null);
    setCurrentSceneId('scene_1');
    setError(null);
    setBackgroundImage('https://picsum.photos/seed/start/1920/1080');
    setRelationshipScores({});
    localStorage.removeItem(SAVE_KEY);
    setSaveExists(false);
  }, []);

  const handleSaveGame = useCallback(() => {
    if (story && currentSceneId && relationshipScores && backgroundImage) {
      const gameStateToSave = {
        story,
        currentSceneId,
        relationshipScores,
        backgroundImage,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(gameStateToSave));
      setSaveExists(true);
    }
  }, [story, currentSceneId, relationshipScores, backgroundImage]);

  // --- AUTOSAVE LOGIC ---
  const autosaveCallback = useCallback(() => {
    if (gameState === GameState.PLAYING && story) {
      handleSaveGame();
      setLastAutosave(Date.now());
    }
  }, [gameState, story, handleSaveGame]);

  // FIX: The type for useRef was incorrect. It should allow for an undefined value since no initial value is provided.
  const savedCallback = useRef<(() => void) | undefined>();

  useEffect(() => {
    savedCallback.current = autosaveCallback;
  }, [autosaveCallback]);

  useEffect(() => {
    const tick = () => {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }
    const intervalId = setInterval(tick, 30000); // Autosave every 30 seconds
    return () => clearInterval(intervalId);
  }, []);
  // --- END AUTOSAVE LOGIC ---

  const handleLoadGame = useCallback(() => {
    const savedGameJSON = localStorage.getItem(SAVE_KEY);
    if (savedGameJSON) {
      try {
        const savedGameState = JSON.parse(savedGameJSON);
        setStory(savedGameState.story);
        setCurrentSceneId(savedGameState.currentSceneId);
        setRelationshipScores(savedGameState.relationshipScores);
        setBackgroundImage(savedGameState.backgroundImage);
        setGameState(GameState.PLAYING);
      } catch (e) {
        console.error("Failed to load game:", e);
        setError("Failed to load saved game. The file might be corrupted.");
        localStorage.removeItem(SAVE_KEY);
        setSaveExists(false);
      }
    }
  }, []);

  const handleChoice = useCallback((choice: Choice) => {
    // Update relationship scores
    if (choice.relationshipEffects) {
      setRelationshipScores(prevScores => {
        const newScores = { ...prevScores };
        choice.relationshipEffects!.forEach(effect => {
          if (newScores[effect.character] !== undefined) {
            newScores[effect.character] += effect.change;
          }
        });
        return newScores;
      });
    }

    // Move to next scene
    if (choice.nextSceneId && story?.scenes[choice.nextSceneId]) {
      setCurrentSceneId(choice.nextSceneId);
      const newBg = story.scenes[choice.nextSceneId].visuals.backgroundImage;
      if (newBg) {
        setBackgroundImage(newBg);
      }
    } else {
      setGameState(GameState.END);
    }
  }, [story]);

  const renderContent = () => {
    switch (gameState) {
      case GameState.LOADING:
        return <LoadingScreen />;
      case GameState.PLAYING:
        if (story) {
          const currentScene = story.scenes[currentSceneId];
          return (
            <GameScreen 
              scene={currentScene} 
              onChoice={handleChoice} 
              onSave={handleSaveGame}
              storyTitle={story.title}
              relationshipScores={relationshipScores}
              characters={story.characters}
              lastAutosave={lastAutosave}
            />
          );
        }
        return null;
      case GameState.END:
        const finalScene = story?.scenes[currentSceneId];
        return <EndScreen endingText={finalScene?.narration || "The story concludes."} onReset={handleResetGame} />;
      case GameState.START:
      default:
        return <StartScreen onStart={handleStartGame} onLoad={handleLoadGame} saveExists={saveExists} error={error} />;
    }
  };

  return (
    <main 
      className="relative min-h-screen w-full bg-cover bg-center bg-no-repeat text-white transition-all duration-1000" 
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        {renderContent()}
      </div>
    </main>
  );
};

export default App;