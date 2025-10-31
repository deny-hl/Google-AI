import React, { useState, useEffect, useMemo } from 'react';
import { Scene, Choice, RelationshipScores, RelationshipEffect, Character } from '../types';

interface GameScreenProps {
  scene: Scene;
  onChoice: (choice: Choice) => void;
  onSave: () => void;
  storyTitle: string;
  relationshipScores: RelationshipScores;
  characters: Character[];
  lastAutosave: number;
}

const GameScreen: React.FC<GameScreenProps> = ({ scene, onChoice, onSave, storyTitle, relationshipScores, characters, lastAutosave }) => {
  const [key, setKey] = useState(0);
  const [notifications, setNotifications] = useState<(RelationshipEffect & { id: number })[]>([]);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);
  const [autosaveNotification, setAutosaveNotification] = useState<string | null>(null);
  
  const characterPortraits = useMemo(() => {
    const map = new Map<string, string>();
    characters.forEach(char => {
      map.set(char.name, char.portraitUrl);
    });
    return map;
  }, [characters]);

  useEffect(() => {
    setKey(prevKey => prevKey + 1);
  }, [scene]);

  useEffect(() => {
    if (lastAutosave > 0) { // Check if it's not the initial value
      setAutosaveNotification("Autosaved");
      const timer = setTimeout(() => {
        setAutosaveNotification(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [lastAutosave]);

  const handleChoiceClick = (choice: Choice) => {
    if (choice.relationshipEffects) {
        const newNotifications = choice.relationshipEffects.map((effect, index) => ({
            ...effect,
            id: Date.now() + index,
        }));
        setNotifications(prev => [...prev, ...newNotifications]);
        
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => !newNotifications.some(nn => nn.id === n.id)));
        }, 3000);
    }
    onChoice(choice);
  };

  const handleSaveClick = () => {
    onSave();
    setSaveNotification("Game Saved!");
    setTimeout(() => {
      setSaveNotification(null);
    }, 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-[90vh] p-4 md:p-6 relative">
      <div className="absolute top-4 left-4 flex items-start gap-2 z-20">
        <RelationshipTracker 
          scores={relationshipScores} 
          characters={characters.filter(c => c.name.toLowerCase() !== 'you')} 
        />
        <button
          onClick={handleSaveClick}
          className="bg-purple-600/80 hover:bg-purple-700/80 text-white font-bold py-2 px-3 text-xs rounded-lg transition duration-300 shadow-md border border-purple-500/50"
        >
          Save
        </button>
      </div>

      <header className="text-center mb-4 border-b border-gray-500/50 pb-2">
        <h1 className="text-3xl font-bold font-cinzel">{storyTitle}</h1>
        <h2 className="text-xl text-purple-300">{scene.title}</h2>
      </header>
      
      <div key={key} className="flex-grow bg-black/60 p-6 rounded-lg shadow-xl overflow-y-auto animate-fade-in space-y-4 mb-4">
        <p className="text-lg text-gray-200 italic whitespace-pre-wrap mb-6">{scene.narration}</p>
        {scene.dialogue.map((d, index) => {
            const portraitUrl = characterPortraits.get(d.character);
            const isPlayer = d.character.toLowerCase() === 'you';
            
            return (
                <div 
                  key={index} 
                  className={`flex items-start gap-3 my-4 ${isPlayer ? 'flex-row-reverse animate-slide-in-right' : 'animate-slide-in-left'}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                    {portraitUrl && (
                        <img src={portraitUrl} alt={d.character} className="w-12 h-12 rounded-full object-cover border-2 border-purple-400/50 flex-shrink-0" />
                    )}
                    <div className={`max-w-[70%] text-lg p-3 rounded-xl shadow-md ${isPlayer ? 'bg-gradient-to-br from-purple-800 to-purple-900 border border-purple-600' : 'bg-gradient-to-bl from-gray-700 to-gray-800 border border-gray-600'}`}>
                        {!isPlayer && <strong className="text-purple-300 block mb-1">{d.character}</strong>}
                        <span className="text-gray-100 whitespace-pre-wrap">"{d.line}"</span>
                    </div>
                </div>
            )
        })}
      </div>
      
      <div className="mt-auto">
        <h3 className="text-center text-lg mb-4 text-gray-300">What do you do?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scene.choices.map((choice, index) => (
            <ChoiceButton key={index} choice={choice} onChoice={handleChoiceClick} index={index} />
          ))}
        </div>
      </div>
      
      <div className="absolute top-20 right-6 space-y-2">
        {notifications.map(n => (
            <div key={n.id} className="animate-fade-out bg-black/70 border border-gray-600 p-2 rounded-lg shadow-lg">
                <p className={`text-sm ${n.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {n.character} {n.change > 0 ? `+${n.change}` : n.change}
                </p>
            </div>
        ))}
      </div>
      {saveNotification && (
        <div className="absolute top-16 left-4 animate-fade-out bg-green-900/80 border border-green-600 p-2 rounded-lg shadow-lg">
          <p className="text-sm text-green-200">{saveNotification}</p>
        </div>
      )}
      {autosaveNotification && (
        <div className="absolute bottom-4 right-4 animate-fade-in-up bg-black/70 border border-gray-600 p-2 rounded-lg shadow-lg">
            <p className="text-xs text-gray-400 italic">{autosaveNotification}</p>
        </div>
      )}
    </div>
  );
};

interface RelationshipTrackerProps {
    scores: RelationshipScores;
    characters: { name: string }[];
}

const RelationshipTracker: React.FC<RelationshipTrackerProps> = ({ scores, characters }) => {
    return (
        <div className="bg-black/60 p-3 rounded-lg shadow-md border border-gray-700">
            <h4 className="text-sm font-bold text-purple-300 mb-2 border-b border-gray-600 pb-1">Relationships</h4>
            <ul className="space-y-1">
                {characters.map(({name}) => (
                    <li key={name} className="text-xs text-gray-300 flex justify-between">
                        <span>{name}:</span>
                        <span className={`font-bold ml-2 ${scores[name] > 0 ? 'text-green-400' : scores[name] < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                            {scores[name]}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

interface ChoiceButtonProps {
    choice: Choice;
    onChoice: (choice: Choice) => void;
    index: number;
}

const ChoiceButton: React.FC<ChoiceButtonProps> = ({ choice, onChoice, index }) => {
    return (
        <div 
            className="animate-fade-in-up" 
            style={{ animationDelay: `${index * 100}ms`, opacity: 0, animationFillMode: 'forwards' }}
        >
            <button
                onClick={() => onChoice(choice)}
                className="w-full text-left bg-gray-800/70 border border-gray-600 rounded-lg p-4 transition duration-300 hover:bg-purple-800/80 hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400 transform hover:scale-[1.03]"
            >
                <p className="font-bold text-lg text-white">{choice.text}</p>
                <p className="text-sm text-gray-400 italic mt-1">{choice.consequence}</p>
            </button>
        </div>
    );
};

export default GameScreen;