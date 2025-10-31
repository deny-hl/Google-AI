
import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="text-center flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-400 mb-6"></div>
      <h2 className="text-3xl font-bold font-cinzel mb-2">Crafting Your Narrative...</h2>
      <p className="text-gray-300">Gemini is weaving the threads of fate.</p>
    </div>
  );
};

export default LoadingScreen;
