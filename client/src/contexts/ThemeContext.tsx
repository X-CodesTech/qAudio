import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Define the theme structure
export type StudioTheme = {
  id: string;
  name: string;
  darkMode: boolean;
  studioA: {
    primary: string;
    secondary: string;
    accent: string;
  };
  studioB: {
    primary: string;
    secondary: string;
    accent: string;
  };
  global: {
    background: string;
    text: string;
    surface: string;
    border: string;
  };
};

// Default themes
export const defaultThemes: StudioTheme[] = [
  {
    id: 'default',
    name: 'Studio Default',
    darkMode: true,
    studioA: {
      primary: '#fe8103',   // custom orange
      secondary: '#e67402', // darker orange
      accent: '#fff0e0',    // light orange
    },
    studioB: {
      primary: '#10b981',   // emerald-500
      secondary: '#047857', // emerald-700
      accent: '#d1fae5',    // emerald-100
    },
    global: {
      background: '#18181b', // zinc-900
      text: '#ffffff',       // white
      surface: '#27272a',    // zinc-800
      border: '#3f3f46',     // zinc-700
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    darkMode: true,
    studioA: {
      primary: '#475569',   // slate-600
      secondary: '#334155', // slate-700
      accent: '#cbd5e1',    // slate-300
    },
    studioB: {
      primary: '#64748b',   // slate-500
      secondary: '#475569', // slate-600
      accent: '#e2e8f0',    // slate-200
    },
    global: {
      background: '#0f172a', // slate-900
      text: '#f8fafc',       // slate-50
      surface: '#1e293b',    // slate-800
      border: '#334155',     // slate-700
    },
  },
  {
    id: 'vintage',
    name: 'Vintage Radio',
    darkMode: true,
    studioA: {
      primary: '#b45309',   // amber-700
      secondary: '#92400e', // amber-800
      accent: '#fef3c7',    // amber-100
    },
    studioB: {
      primary: '#b91c1c',   // red-700
      secondary: '#991b1b', // red-800
      accent: '#fee2e2',    // red-100
    },
    global: {
      background: '#1c1917', // stone-900
      text: '#e7e5e4',       // stone-200
      surface: '#292524',    // stone-800
      border: '#44403c',     // stone-700
    },
  },
  {
    id: 'light',
    name: 'Light Mode',
    darkMode: false,
    studioA: {
      primary: '#fe8103',   // custom orange
      secondary: '#e67402', // darker orange
      accent: '#fff0e0',    // light orange
    },
    studioB: {
      primary: '#059669',   // emerald-600
      secondary: '#047857', // emerald-700
      accent: '#d1fae5',    // emerald-100
    },
    global: {
      background: '#f8fafc', // slate-50
      text: '#0f172a',       // slate-900
      surface: '#f1f5f9',    // slate-100
      border: '#cbd5e1',     // slate-300
    },
  },
];

// Context interface
interface ThemeContextType {
  currentTheme: StudioTheme;
  themes: StudioTheme[];
  setTheme: (themeId: string) => void;
  createTheme: (theme: Omit<StudioTheme, 'id'>) => void;
  updateTheme: (theme: StudioTheme) => void;
  deleteTheme: (themeId: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Storage key for persisting themes
const STORAGE_KEY = 'mazen-studio-themes';
const CURRENT_THEME_KEY = 'mazen-studio-current-theme';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize with default themes, plus load saved themes from localStorage
  const [themes, setThemes] = useState<StudioTheme[]>(() => {
    const savedThemes = localStorage.getItem(STORAGE_KEY);
    if (savedThemes) {
      try {
        const parsed = JSON.parse(savedThemes);
        // Merge default themes with saved themes, preferring saved themes for duplicates
        const combinedThemes = [...defaultThemes];
        parsed.forEach((savedTheme: StudioTheme) => {
          const index = combinedThemes.findIndex(t => t.id === savedTheme.id);
          if (index >= 0) {
            combinedThemes[index] = savedTheme;
          } else {
            combinedThemes.push(savedTheme);
          }
        });
        return combinedThemes;
      } catch (e) {
        console.error('Failed to parse saved themes:', e);
        return defaultThemes;
      }
    }
    return defaultThemes;
  });

  // Initialize currentTheme
  const [currentTheme, setCurrentTheme] = useState<StudioTheme>(() => {
    const savedThemeId = localStorage.getItem(CURRENT_THEME_KEY);
    if (savedThemeId) {
      const theme = themes.find(t => t.id === savedThemeId);
      if (theme) return theme;
    }
    return themes[0]; // Default to first theme
  });

  // Save themes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
  }, [themes]);

  // Update current theme and save to localStorage
  const changeTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      localStorage.setItem(CURRENT_THEME_KEY, themeId);
    }
  };

  // Create a new theme
  const createTheme = (theme: Omit<StudioTheme, 'id'>) => {
    const newTheme: StudioTheme = {
      ...theme,
      id: `custom-${Date.now()}`, // Generate unique ID
    };
    setThemes(prev => [...prev, newTheme]);
    setCurrentTheme(newTheme);
    localStorage.setItem(CURRENT_THEME_KEY, newTheme.id);
  };

  // Update an existing theme
  const updateTheme = (updatedTheme: StudioTheme) => {
    setThemes(prev => 
      prev.map(theme => 
        theme.id === updatedTheme.id ? updatedTheme : theme
      )
    );
    // If updating current theme, update that too
    if (currentTheme.id === updatedTheme.id) {
      setCurrentTheme(updatedTheme);
    }
  };

  // Delete a theme
  const deleteTheme = (themeId: string) => {
    // Don't allow deleting default themes
    if (defaultThemes.some(t => t.id === themeId)) {
      console.warn('Cannot delete default theme');
      return;
    }
    
    setThemes(prev => prev.filter(theme => theme.id !== themeId));
    
    // If deleting current theme, switch to default
    if (currentTheme.id === themeId) {
      setCurrentTheme(themes[0]);
      localStorage.setItem(CURRENT_THEME_KEY, themes[0].id);
    }
  };

  // Apply theme CSS variables to document root
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply global theme variables
    root.style.setProperty('--background', currentTheme.global.background);
    root.style.setProperty('--text', currentTheme.global.text);
    root.style.setProperty('--surface', currentTheme.global.surface);
    root.style.setProperty('--border', currentTheme.global.border);
    
    // Apply Studio A theme variables
    root.style.setProperty('--studio-a-primary', currentTheme.studioA.primary);
    root.style.setProperty('--studio-a-secondary', currentTheme.studioA.secondary);
    root.style.setProperty('--studio-a-accent', currentTheme.studioA.accent);
    
    // Apply Studio B theme variables
    root.style.setProperty('--studio-b-primary', currentTheme.studioB.primary);
    root.style.setProperty('--studio-b-secondary', currentTheme.studioB.secondary);
    root.style.setProperty('--studio-b-accent', currentTheme.studioB.accent);
    
    // Set dark/light mode
    if (currentTheme.darkMode) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    }
  }, [currentTheme]);

  const contextValue: ThemeContextType = {
    currentTheme,
    themes,
    setTheme: changeTheme,
    createTheme,
    updateTheme,
    deleteTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for accessing the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};