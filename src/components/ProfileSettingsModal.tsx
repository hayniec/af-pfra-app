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
            <label htmlFor="settings-height">Height (inches)</label>
            <input
              id="settings-height"
              type="number"
              min={0}
              step="0.5"
              placeholder="e.g. 70"
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
