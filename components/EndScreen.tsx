
import React from 'react';

interface EndScreenProps {
  endingText: string;
  onReset: () => void;
}

const EndScreen: React.FC<EndScreenProps> = ({ endingText, onReset }) => {
  return (
    <div className="text-center bg-black/50 p-8 rounded-lg shadow-2xl max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-5xl font-bold mb-4 font-cinzel">The End</h1>
      <p className="text-lg text-gray-300 mb-8 italic whitespace-pre-wrap">
        {endingText}
      </p>
      <button
        onClick={onReset}
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-12 text-xl rounded-full transition duration-300 ease-in-out transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-400"
      >
        Play a New Story
      </button>
    </div>
  );
};

export default EndScreen;
