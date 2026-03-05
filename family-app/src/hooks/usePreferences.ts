import { useState, useEffect, useCallback } from 'react';
import type { AppPreferences } from '../types';
import * as db from '../lib/db';

export function usePreferences() {
  const [preferences, setPreferences] = useState<AppPreferences>({ id: 'current', theme: 'system' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.getPreferences().then(p => { setPreferences(p); setLoading(false); });
  }, []);

  useEffect(() => {
    if (preferences.theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', preferences.theme);
    }
  }, [preferences.theme]);

  const setTheme = useCallback(async (theme: 'system' | 'light' | 'dark') => {
    const updated = { ...preferences, theme };
    setPreferences(updated);
    await db.savePreferences(updated);
  }, [preferences]);

  return { preferences, loading, setTheme };
}
