import OpenAI from "openai";
import { AudioTrack, AiTrackAnalysis, audioTracks, aiTrackAnalysis } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "../db";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

export interface AnalyzeTrackResult {
  moodTags: string[];
  genreTags: string[];
  tempo?: number;
  key?: string;
  energy?: number;
  danceability?: number;
  valence?: number;
  speechContent?: number;
  instrumentalness?: number;
  acousticness?: number;
  introDurationSecs?: number;
  outroDurationSecs?: number;
  vocalsStartSecs?: number;
  aiDescription: string;
}

export const analyzeTrack = async (track: AudioTrack): Promise<AnalyzeTrackResult> => {
  try {
    const prompt = `
      You are an expert music analyzer and DJ. Analyze the following track and provide detailed musical characteristics:
      
      Track Title: ${track.title}
      Artist: ${track.artist || 'Unknown'}
      Album: ${track.album || 'Unknown'}
      Duration: ${track.duration} seconds
      
      I need a comprehensive analysis with the following attributes:
      1. A list of mood tags (between 3-5 tags)
      2. A list of genre tags (between 2-3 tags)
      3. Estimated tempo (BPM) if possible
      4. Musical key if possible
      5. Energy rating (0-1 scale)
      6. Danceability rating (0-1 scale)
      7. Valence/positivity rating (0-1 scale)
      8. Speech content rating (0-1 scale)
      9. Instrumentalness rating (0-1 scale)
      10. Acousticness rating (0-1 scale)
      11. A short, descriptive summary of the track (1-2 sentences)

      Format your response as a JSON object with these keys: moodTags (array), genreTags (array), tempo (number), key (string), 
      energy (number), danceability (number), valence (number), speechContent (number), instrumentalness (number), 
      acousticness (number), aiDescription (string).
    `;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content returned from OpenAI");
    }

    const analysis = JSON.parse(content) as AnalyzeTrackResult;
    return analysis;
  } catch (error) {
    console.error("Error analyzing track with OpenAI:", error);
    // Return a basic analysis if AI fails
    return {
      moodTags: ["unknown"],
      genreTags: ["unknown"],
      energy: 0.5,
      danceability: 0.5,
      valence: 0.5,
      aiDescription: `AI analysis failed for ${track.title}`,
    };
  }
};

export interface PlaylistGenerationParams {
  mood?: string;
  genre?: string;
  tempo?: string;
  energyLevel?: number;
  duration: number; // in minutes
  trackIds: number[];
  includeJingles?: boolean;
  jingleFrequency?: number;
  includeStationIds?: boolean;
  stationIdFrequency?: number;
}

export interface GeneratePlaylistResult {
  trackIds: number[];
  reasoning: string;
}

export const generateSmartPlaylist = async (params: PlaylistGenerationParams): Promise<GeneratePlaylistResult> => {
  try {
    // Fetch track information from the database directly using Drizzle query builder
    const trackPromises = params.trackIds.map(async (id) => {
      // Use direct table references instead of query builder
      const [track] = await db.select().from(audioTracks)
        .where(eq(audioTracks.id, id));
      
      // Get AI analysis if it exists
      const [analysis] = await db.select().from(aiTrackAnalysis)
        .where(eq(aiTrackAnalysis.trackId, id));
      
      return {
        id,
        track,
        analysis
      };
    });
    
    const tracks = await Promise.all(trackPromises);
    
    // Filter out any missing tracks
    const validTracks = tracks.filter(t => t.track);
    
    // Create a format that's easy for GPT to understand
    const tracksData = validTracks.map(t => {
      const { track, analysis } = t;
      return {
        id: track?.id,
        title: track?.title,
        artist: track?.artist,
        duration: track?.duration,
        category: track?.category,
        moodTags: analysis?.moodTags || [],
        genreTags: analysis?.genreTags || [],
        energy: analysis?.energy || 0.5,
        tempo: analysis?.tempo,
        valence: analysis?.valence,
        danceability: analysis?.danceability
      };
    });
    
    const promptParams = {
      mood: params.mood,
      genre: params.genre,
      tempo: params.tempo,
      energyLevel: params.energyLevel,
      durationMinutes: params.duration,
      includeJingles: params.includeJingles || false,
      jingleFrequency: params.jingleFrequency || 4,
      includeStationIds: params.includeStationIds || false,
      stationIdFrequency: params.stationIdFrequency || 8
    };
    
    const prompt = `
      You are an expert radio DJ and music programmer. Create the optimal playlist using the provided tracks.
      
      Playlist requirements:
      - Duration: approximately ${promptParams.durationMinutes} minutes
      - Mood: ${promptParams.mood || 'Any mood'}
      - Genre: ${promptParams.genre || 'Any genre'}
      - Tempo: ${promptParams.tempo || 'Any tempo'}
      - Energy level (1-10): ${promptParams.energyLevel || 'Any energy level'}
      ${promptParams.includeJingles ? `- Insert station jingles every ${promptParams.jingleFrequency} tracks` : ''}
      ${promptParams.includeStationIds ? `- Insert station IDs every ${promptParams.stationIdFrequency} tracks` : ''}
      
      Programming rules:
      1. Create a musically coherent flow between tracks
      2. Pay attention to energy curves (build up and cool down sections)
      3. Avoid playing the same artist back-to-back
      4. Consider tempo and key changes between tracks
      5. Create a natural mood progression throughout the playlist
      
      Available tracks:
      ${JSON.stringify(tracksData, null, 2)}
      
      Format your response as a JSON object with these keys:
      1. "trackIds": an array of track IDs in the order they should be played
      2. "reasoning": a brief explanation of why you arranged the tracks in this order
    `;
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content returned from OpenAI");
    }
    
    const result = JSON.parse(content) as GeneratePlaylistResult;
    return result;
  } catch (error) {
    console.error("Error generating playlist with OpenAI:", error);
    // Return original track IDs if AI fails
    return {
      trackIds: params.trackIds,
      reasoning: "AI playlist generation failed, returning original track order."
    };
  }
};

export interface SpeechResult {
  text: string;
}

export const generateAnnouncerSpeech = async (
  prompt: string, 
  context?: {trackTitle?: string, artist?: string, timeOfDay?: string}
): Promise<SpeechResult> => {
  try {
    const contextStr = context ? `
      Context:
      ${context.trackTitle ? `- Track title: ${context.trackTitle}` : ''}
      ${context.artist ? `- Artist: ${context.artist}` : ''}
      ${context.timeOfDay ? `- Time of day: ${context.timeOfDay}` : ''}
    ` : '';
    
    const fullPrompt = `
      You are a professional radio announcer. Create a brief announcement script based on the following request:
      
      ${prompt}
      
      ${contextStr}
      
      Rules:
      1. Keep it concise and to the point
      2. Use natural, conversational language
      3. Sound enthusiastic but professional
      4. No profanity or inappropriate content
      5. Maximum length: 2-3 sentences
      
      Return ONLY the script text, no other information.
    `;
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: fullPrompt }]
    });
    
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content returned from OpenAI");
    }
    
    return {
      text: content.trim()
    };
  } catch (error) {
    console.error("Error generating announcer speech with OpenAI:", error);
    return {
      text: "This is your radio station. Stay tuned for more great music."
    };
  }
};