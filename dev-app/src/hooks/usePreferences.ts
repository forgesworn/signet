import { useState, useEffect, useCallback } from 'react';
import { getPreferences, savePreferences, type StoredPreferences } from '../lib/db';

export function usePreferences() {
  const [preferences, setPreferences] = useState<StoredPreferences>({ id: 'current', theme: 'system' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPreferences().then((prefs) => {
      setPreferences(prefs);
      setLoading(false);
    });
  }, []);

  // Apply theme to document
  useEffect(() => {
    const html = document.documentElement;
    if (preferences.theme === 'system') {
      html.removeAttribute('data-theme');
    } else {
      html.setAttribute('data-theme', preferences.theme);
    }
  }, [preferences.theme]);

  const setTheme = useCallback(async (theme: StoredPreferences['theme']) => {
    const updated = { ...preferences, theme };
    await savePreferences(updated);
    setPreferences(updated);
  }, [preferences]);

  return { preferences, loading, setTheme };
}
