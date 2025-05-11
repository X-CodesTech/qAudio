-- Create AI DJ related tables

-- AI DJ Settings table
CREATE TABLE IF NOT EXISTS ai_dj_settings (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  duration_hours DECIMAL NOT NULL,
  mood TEXT,
  genre TEXT,
  tempo TEXT,
  energy_level INTEGER DEFAULT 5,
  jingle_frequency INTEGER DEFAULT 4,
  station_id_frequency INTEGER DEFAULT 8,
  source_folder_ids INTEGER[],
  time_restrictions TEXT,
  enable_crossfading BOOLEAN DEFAULT TRUE,
  crossfade_duration INTEGER DEFAULT 3,
  enable_beat_matching BOOLEAN DEFAULT FALSE,
  studio_id TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Track Analysis table
CREATE TABLE IF NOT EXISTS ai_track_analysis (
  id SERIAL PRIMARY KEY,
  track_id INTEGER REFERENCES audio_tracks(id) ON DELETE CASCADE NOT NULL,
  mood_tags TEXT[],
  genre_tags TEXT[],
  tempo INTEGER,
  key TEXT,
  energy DECIMAL,
  danceability DECIMAL,
  valence DECIMAL,
  speech_content DECIMAL,
  instrumentalness DECIMAL,
  acousticness DECIMAL,
  brightness DECIMAL,
  depth DECIMAL,
  warmth DECIMAL,
  popularity_estimate DECIMAL,
  ai_description TEXT,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- AI Generated Playlists table
CREATE TABLE IF NOT EXISTS ai_generated_playlists (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  settings_id INTEGER REFERENCES ai_dj_settings(id) ON DELETE CASCADE NOT NULL,
  playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT FALSE,
  studio_id TEXT,
  prompt_used TEXT,
  ai_reasoning TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_track_analysis_track_id ON ai_track_analysis(track_id);
CREATE INDEX IF NOT EXISTS idx_ai_dj_settings_studio ON ai_dj_settings(studio_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_playlists_settings ON ai_generated_playlists(settings_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_playlists_playlist ON ai_generated_playlists(playlist_id);