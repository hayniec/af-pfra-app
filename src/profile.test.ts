import { describe, it, expect, beforeEach } from 'vitest';
import { DEFAULT_PROFILE } from './hooks/useProfile';
import type { UserProfile } from './types';

// Simple mock for localStorage in node environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
});


describe('useProfile logic & defaults', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('has correct default profile structure', () => {
    expect(DEFAULT_PROFILE).toEqual({
      gender: 'male',
      ageGroup: '<25',
      height: null,
      heightUnit: 'in',
      rememberLastValues: true,
      lastValues: {},
    });
  });

  it('can serialize and deserialize profile data', () => {
    const customProfile: UserProfile = {
      gender: 'female',
      ageGroup: '30-34',
      height: 65,
      heightUnit: 'in',
      rememberLastValues: true,
      lastValues: {
        waist: 28,
        cardioType: 'run',
        cardioValue: 800,
      },
    };

    localStorageMock.setItem('pfra-profile', JSON.stringify(customProfile));
    const loaded = JSON.parse(localStorageMock.getItem('pfra-profile') || '{}');
    expect(loaded).toEqual(customProfile);
  });

  it('handles clearing profile', () => {
    localStorageMock.setItem('pfra-profile', JSON.stringify({ gender: 'female' }));
    expect(localStorageMock.getItem('pfra-profile')).not.toBeNull();
    localStorageMock.removeItem('pfra-profile');
    expect(localStorageMock.getItem('pfra-profile')).toBeNull();
  });
});
