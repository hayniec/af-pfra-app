import React, { useState } from 'react';
import type { UserProfile } from '../types';
import { AGE_GROUPS } from '../scoring';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onToggleRemember: (remember: boolean) => void;
  onClearProfile: () => void;
}

export function ProfileSettingsModal({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  onToggleRemember,
  onClearProfile,
}: ProfileSettingsModalProps) {
  const [heightInput, setHeightInput] = useState<string>(
    profile.height !== null ? String(profile.height) : ''
  );
  const [confirmClear, setConfirmClear] = useState(false);

  if (!isOpen) return null;

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setHeightInput(valStr);
    const num = parseFloat(valStr);
    onUpdateProfile({ height: isNaN(num) || num <= 0 ? null : num });
  };

  const handleUnitToggle = (unit: 'in' | 'cm') => {
    if (unit === profile.heightUnit) return;
    // Optionally convert height number if present
    let convertedHeight = profile.height;
    if (profile.height !== null && profile.height > 0) {
      if (unit === 'cm' && profile.heightUnit === 'in') {
        convertedHeight = Math.round(profile.height * 2.54 * 10) / 10;
      } else if (unit === 'in' && profile.heightUnit === 'cm') {
        convertedHeight = Math.round((profile.height / 2.54) * 10) / 10;
      }
    }
    setHeightInput(convertedHeight !== null ? String(convertedHeight) : '');
    onUpdateProfile({ heightUnit: unit, height: convertedHeight });
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-content card animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-settings-title"
      >
        <div className="modal-header">
          <h3 id="profile-settings-title" className="section-title">
            Profile Settings
          </h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="settings-gender">Gender</label>
            <select
              id="settings-gender"
              value={profile.gender}
              onChange={(e) => onUpdateProfile({ gender: e.target.value })}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="settings-ageGroup">Age Group</label>
            <select
              id="settings-ageGroup"
              value={profile.ageGroup}
              onChange={(e) => onUpdateProfile({ ageGroup: e.target.value })}
            >
              {AGE_GROUPS.map((age) => (
                <option key={age} value={age}>
                  {age === '<25' ? 'Under 25' : age}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <div className="whtr-header" style={{ marginBottom: '0.5rem' }}>
              <label htmlFor="settings-height">Height ({profile.heightUnit})</label>
              <div className="toggle-group" role="group" aria-label="Height Unit">
                {(['in', 'cm'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    className={`toggle-btn ${profile.heightUnit === u ? 'active' : ''}`}
                    onClick={() => handleUnitToggle(u)}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <input
              id="settings-height"
              type="number"
              min={0}
              step={profile.heightUnit === 'in' ? '0.5' : '1'}
              placeholder={profile.heightUnit === 'in' ? 'e.g. 70' : 'e.g. 178'}
              value={heightInput}
              onChange={handleHeightChange}
            />
          </div>

          <div className="setting-toggle-card">
            <div className="setting-toggle-header">
              <label htmlFor="remember-toggle-checkbox" className="setting-toggle-label">
                Remember last entered assessment data
              </label>
              <label className="switch">
                <input
                  id="remember-toggle-checkbox"
                  type="checkbox"
                  checked={profile.rememberLastValues}
                  onChange={(e) => onToggleRemember(e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
            </div>
            <p className="setting-toggle-desc">
              When turned on, your last entered reps, times, and waist size are remembered across app visits. When turned off, standard defaults are loaded.
            </p>
          </div>

          <div className="settings-danger-zone">
            {!confirmClear ? (
              <button
                type="button"
                className="btn-danger-outline"
                onClick={() => setConfirmClear(true)}
              >
                Reset Saved Profile
              </button>
            ) : (
              <div className="confirm-clear-box">
                <p>Are you sure? This resets profile & settings to defaults.</p>
                <div className="confirm-actions">
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => {
                      onClearProfile();
                      setHeightInput('');
                      setConfirmClear(false);
                    }}
                  >
                    Yes, Reset
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setConfirmClear(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="save-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
