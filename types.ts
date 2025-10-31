
export enum GameState {
  START,
  LOADING,
  PLAYING,
  END,
}

export interface Dialogue {
  character: string;
  line: string;
}

export interface RelationshipEffect {
  character: string;
  change: number;
}

export interface Choice {
  text: string;
  consequence: string;
  nextSceneId: string | null;
  relationshipEffects?: RelationshipEffect[];
}

export interface Visuals {
  backgroundImage: string;
  characterIllustration: string;
}

export interface Scene {
  id: string;
  title: string;
  narration: string;
  dialogue: Dialogue[];
  visuals: Visuals;
  choices: Choice[];
}

export interface Character {
  name: string;
  description: string;
  portraitUrl: string;
}

export interface StoryData {
  title: string;
  premise: string;
  setting: string;
  characters: Character[];
  scenes: {
    [key: string]: Scene;
  };
}

export type RelationshipScores = Record<string, number>;
