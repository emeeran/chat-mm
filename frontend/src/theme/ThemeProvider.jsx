import React, { useState, useMemo, createContext, useContext } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';

// Create context for theme toggle
export const ColorModeContext = createContext({ toggleColorMode: () => {} });

// Custom hook to use the color mode context
export const useColorMode = () => useContext(ColorModeContext);

export default function ThemeProvider({ children }) {
  const [mode, setMode] = useState('dark');

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
      mode
    }),
    [mode]
  );

  const theme = useMemo(() => {
    const baseTheme = {
      typography: {
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        h1: { fontWeight: 700 },
        h2: { fontWeight: 600 },
        h3: { fontWeight: 600 },
        h4: { fontWeight: 600 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        button: { fontWeight: 600 }
      },
      shape: {
        borderRadius: 12
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              borderRadius: 8,
              padding: '10px 16px',
              fontWeight: 500,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none',
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              backgroundImage: 'none',
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              boxShadow: mode === 'dark' 
                ? '0 4px 12px rgba(0,0,0,0.25)' 
                : '0 4px 20px rgba(0,0,0,0.08)',
            },
          },
        },
        MuiInputBase: {
          styleOverrides: {
            root: {
              borderRadius: 8,
            },
          },
        },
      },
    };

    if (mode === 'light') {
      return createTheme({
        ...baseTheme,
        palette: {
          mode: 'light',
          primary: {
            main: '#3b82f6', // Tailwind blue-500
            light: '#60a5fa', // blue-400
            dark: '#2563eb', // blue-600
          },
          secondary: {
            main: '#8b5cf6', // purple-500
          },
          background: {
            default: '#f8fafc', // slate-50
            paper: '#ffffff',
          },
          text: {
            primary: '#1e293b', // slate-800
            secondary: '#475569', // slate-600
          },
        },
      });
    } else {
      return createTheme({
        ...baseTheme,
        palette: {
          mode: 'dark',
          primary: {
            main: '#3b82f6', // blue-500
            light: '#60a5fa', // blue-400
            dark: '#2563eb', // blue-600
          },
          secondary: {
            main: '#8b5cf6', // purple-500
          },
          background: {
            default: '#0f172a', // slate-900
            paper: '#1e293b', // slate-800
          },
          text: {
            primary: '#e2e8f0', // slate-200
            secondary: '#94a3b8', // slate-400
          },
        },
      });
    }
  }, [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ColorModeContext.Provider>
  );
} 