
import { GoogleGenAI, Type } from "@google/genai";
import { StoryData } from '../types';

const storyPrompt = `
You are a professional interactive narrative designer. Create a branching story game similar to Choices or Episode. The game should read like a visual novel: mostly text-based storytelling with short character dialogues, emotional decisions, and multiple paths depending on player choices.

Generate a fully structured game script that includes:
- A clear title, setting, and main premise.
- A short description of 2-4 main characters. For each character, provide a 'portraitUrl' using a unique, seeded picsum.photos URL (e.g., 'https://picsum.photos/seed/character_name/200/200').
- A starting scene written in second-person (“you”) with immersive dialogue and descriptive narration.
- After each short scene, give 2-3 player choices. Each choice must have a 'text', 'consequence', and 'nextSceneId'.
- Some choices should include 'relationshipEffects', an array of objects specifying a character's name and how their relationship score changes (e.g., { "character": "Kael", "change": 1 } or { "character": "Anya", "change": -1 }). A positive change means improved relationship, negative means it worsens.
- Each branch should change relationships or story direction (romance, conflict, mystery, etc.). A high relationship score with a character should unlock unique dialogue or story paths, while a low score could lead to conflict or betrayal.
- Include at least 3 major branching moments and 2 different possible endings that are direct consequences of the player's relationships. For example, a high score with one character might lead to a loyal ally in the finale, while a low score might make them an antagonist.
- For each scene's visuals, provide a 'backgroundImage' URL from 'https://picsum.photos/1920/1080'.
- For each scene's 'visuals.characterIllustration', generate a detailed, descriptive prompt suitable for an image generation model (e.g., Midjourney, DALL-E). This prompt should vividly describe the main character featured in the scene, including their appearance, expression, clothing, and the mood of the illustration. For example: 'Cinematic portrait of Kael, a rugged man in his late 20s with short, dark hair and a cybernetic eye glowing faintly blue. He wears a worn leather jacket over a dark shirt. His expression is grim and determined, set against the neon-lit, rainy street of a futuristic city. Moody, dramatic lighting.'
- Ensure all scene IDs are unique, following the pattern 'scene_1', 'scene_2', etc.
- The starting scene must have the ID 'scene_1'.
- An ending is signified by a choice having a 'nextSceneId' of null.

The tone should be cinematic, emotional, and immersive. Think of a mix between a Netflix drama and an RPG dialogue tree. Ensure the story is coherent, has emotional stakes, and rewards player decisions with meaningful outcomes based on relationships.

The genre should be a mix of sci-fi and mystery.
`;

const schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    premise: { type: Type.STRING },
    setting: { type: Type.STRING },
    characters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          portraitUrl: { type: Type.STRING, description: "A seeded picsum.photos URL for the character portrait." },
        },
        required: ['name', 'description', 'portraitUrl'],
      },
    },
    scenes: {
      type: Type.OBJECT,
      description: "A dictionary of scenes, where the key is the scene ID.",
      properties: {
        scene_1: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                narration: { type: Type.STRING },
                dialogue: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      character: { type: Type.STRING },
                      line: { type: Type.STRING },
                    },
                    required: ['character', 'line'],
                  },
                },
                visuals: {
                    type: Type.OBJECT,
                    properties: {
                        backgroundImage: { type: Type.STRING, description: "A placeholder image URL from picsum.photos." },
                        characterIllustration: { type: Type.STRING, description: "A detailed, descriptive prompt for an image generation model." },
                    },
                    required: ['backgroundImage', 'characterIllustration'],
                },
                choices: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      consequence: { type: Type.STRING },
                      nextSceneId: { type: Type.STRING, nullable: true },
                      relationshipEffects: {
                        type: Type.ARRAY,
                        nullable: true,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            character: { type: Type.STRING },
                            change: { type: Type.INTEGER },
                          },
                          required: ['character', 'change'],
                        },
                      },
                    },
                    required: ['text', 'consequence', 'nextSceneId'],
                  },
                },
              },
            required: ['id', 'title', 'narration', 'dialogue', 'visuals', 'choices'],
        }
      },
      additionalProperties: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                narration: { type: Type.STRING },
                dialogue: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      character: { type: Type.STRING },
                      line: { type: Type.STRING },
                    },
                    required: ['character', 'line'],
                  },
                },
                visuals: {
                    type: Type.OBJECT,
                    properties: {
                        backgroundImage: { type: Type.STRING, description: "A placeholder image URL from picsum.photos." },
                        characterIllustration: { type: Type.STRING, description: "A detailed, descriptive prompt for an image generation model." },
                    },
                    required: ['backgroundImage', 'characterIllustration'],
                },
                choices: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      consequence: { type: Type.STRING },
                      nextSceneId: { type: Type.STRING, nullable: true },
                      relationshipEffects: {
                        type: Type.ARRAY,
                        nullable: true,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            character: { type: Type.STRING },
                            change: { type: Type.INTEGER },
                          },
                          required: ['character', 'change'],
                        },
                      },
                    },
                    required: ['text', 'consequence', 'nextSceneId'],
                  },
                },
              },
            required: ['id', 'title', 'narration', 'dialogue', 'visuals', 'choices'],
      }
    },
  },
  required: ['title', 'premise', 'setting', 'characters', 'scenes'],
};

export async function generateStory(): Promise<StoryData> {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: storyPrompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: 0.8,
    },
  });

  const text = response.text.trim();
  
  try {
    const storyData: StoryData = JSON.parse(text);
    return storyData;
  } catch (error) {
    console.error("Failed to parse JSON from Gemini:", text);
    throw new Error("Received invalid story format from the API.");
  }
}