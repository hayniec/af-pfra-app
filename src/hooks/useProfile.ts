import { useState } from 'react';
import type { UserProfile, LastAssessmentValues } from '../types';

const STORAGE_KEY = 'pfra-profile';

export const DEFAULT_PROFILE: UserProfile = {
  gender: 'male',
  ageGroup: '<25',
  height: null,
  heightUnit: 'in',
  rememberLastValues: true,
  lastValues: {},
};

function loadProfile(): UserProfile {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_PROFILE;
    const parsed = JSON.parse(stored) as Partial<UserProfile>;
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      lastValues: {
        ...DEFAULT_PROFILE.lastValues,
        ...(parsed.lastValues || {}),
      },
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

function persistProfile(profile: UserProfile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Storage full or unavailable
  }
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile>(loadProfile);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => {
      const updated: UserProfile = {
        ...prev,
        ...updates,
      };
      persistProfile(updated);
      return updated;
    });
  };

  const setRememberLastValues = (remember: boolean) => {
    setProfile(prev => {
      const updated: UserProfile = {
        ...prev,
        rememberLastValues: remember,
        // If turning off remember, clear lastValues
        lastValues: remember ? prev.lastValues : {},
      };
      persistProfile(updated);
      return updated;
    });
  };

  const updateLastValues = (newValues: Partial<LastAssessmentValues>) => {
    setProfile(prev => {
      if (!prev.rememberLastValues) return prev;
      const updated: UserProfile = {
        ...prev,
        lastValues: {
          ...prev.lastValues,
          ...newValues,
        },
      };
      persistProfile(updated);
      return updated;
    });
  };

  const clearProfile = () => {
    setProfile(DEFAULT_PROFILE);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage unavailable
    }
  };

  return {
    profile,
    updateProfile,
    setRememberLastValues,
    updateLastValues,
    clearProfile,
  };
}
