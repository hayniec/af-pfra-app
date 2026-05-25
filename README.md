# USAF Physical Fitness Readiness Assessment (PFRA) Scoring Guide

This repository contains the application source code and scoring databases for the **United States Air Force Physical Fitness Readiness Assessment (PFRA)**, effective **1 March 2026**. 

---

## ⚠️ Critical Bug Fix Notice
During the analysis of the official scoring charts in [Tab 2. PFRA Scoring Charts.pdf](file:///c:/Users/erich/OneDrive/Documents/GitHubRepos/PFRA/Tab%202.%20PFRA%20Scoring%20Charts.pdf), a critical mapping alignment bug was identified and resolved in [scoring.ts](file:///c:/Users/erich/OneDrive/Documents/GitHubRepos/PFRA/src/scoring.ts):
- **Crunches** were mapped to the **Push-up** database tables.
- **Push-ups** were mapped to the **Hand Release Push-up** database tables.
- **Hand Release Push-ups** were mapped to the **Sit-up** database tables.
- **Sit-ups** were mapped to the **Cross-Leg Crunch** database tables.
*The lookup indices in `TABLE_MAP` have been corrected, and all calculations now correctly align with the official standards.*

---

## PFRA Scoring Overview

An airman's PFRA score is compiled from four components:
1. **Cardiorespiratory Fitness (Max 50.0 pts)**: 2 Mile Run, 20-Meter HAMR Shuttle Run, or 2.0 Kilometer Walk (Pass/Fail).
2. **Upper Body Strength (Max 15.0 pts)**: Standard Push-ups or Hand Release (HR) Push-ups.
3. **Core Strength (Max 15.0 pts)**: Standard Sit-ups, Cross-Leg Reverse Crunches, or Forearm Plank.
4. **Waist to Height Ratio (WHtR) (Max 20.0 pts)**: Calculated by dividing waist circumference by height.

### Passing Requirements:
- **Composite Score**: **≥ 75.0 points**.
- **Minimum Component Performance**: Graded components must achieve at least the minimum score thresholds (usually > 0 pts, which corresponds to the **2.5 pts** row for strength/core and **35.0 pts** row for cardiorespiratory events).

---

## 1. Waist to Height Ratio (WHtR) Scoring Standards (All Ages & Genders)
Unlike physical performance events, WHtR standards are uniform across all age brackets and genders.

| Risk Category | WHtR Ratio | Points Awarded |
|---|---|---|
| **Low Risk** | ≤ 0.49 | **20.0 pts** |
| **Moderate Risk** | 0.50 | **19.0 pts** |
| | 0.51 | **18.0 pts** |
| | 0.52 | **17.0 pts** |
| | 0.53 | **16.0 pts** |
| | 0.54 | **15.0 pts** |
| | 0.55 | **12.5 pts** |
| **High Risk** | 0.56 | **10.0 pts** |
| | 0.57 | **7.5 pts** |
| | 0.58 | **5.0 pts** |
| | 0.59 | **2.5 pts** |
| | ≥ 0.60 | **0.0 pts** (Automatic Fail if not exempt) |

---

## 2. Cardiorespiratory Scoring Standards (Max 50.0 pts)

### 2 Mile Run (Timed Event)
*To score points, airmen must run faster than the 35.0-point threshold. Times slower than the 35.0-point threshold receive 0 points (Unsatisfactory).*

| Age Bracket | Gender | 50.0 Pts (Max Points) | 35.0 Pts (Minimum Pass) | Below 35.0 (0 Pts / Fail) |
|---|---|---|---|---|
| **Under 25** | Male <br> Female | ≤ 13:25 <br> ≤ 15:30 | 19:45 <br> 25:23 | > 19:45 <br> > 25:23 |
| **25–29** | Male <br> Female | ≤ 13:35 <br> ≤ 15:55 | 19:55 <br> 25:40 | > 19:55 <br> > 25:40 |
| **30–34** | Male <br> Female | ≤ 13:42 <br> ≤ 16:10 | 20:44 <br> 26:15 | > 20:44 <br> > 26:15 |
| **35–39** | Male <br> Female | ≤ 13:56 <br> ≤ 16:12 | 21:16 <br> 26:30 | > 21:16 <br> > 26:30 |
| **40–44** | Male <br> Female | ≤ 14:05 <br> ≤ 16:45 | 22:04 <br> 26:52 | > 22:04 <br> > 26:52 |
| **45–49** | Male <br> Female | ≤ 14:30 <br> ≤ 16:55 | 22:27 <br> 27:15 | > 22:27 <br> > 27:15 |
| **50–54** | Male <br> Female | ≤ 15:09 <br> ≤ 17:10 | 22:50 <br> 28:05 | > 22:50 <br> > 28:05 |
| **55–59** | Male <br> Female | ≤ 15:28 <br> ≤ 17:43 | 23:36 <br> 28:40 | > 23:36 <br> > 28:40 |
| **60 and Over** | Male <br> Female | ≤ 16:58 <br> ≤ 18:20 | 24:00 <br> 29:40 | > 24:00 <br> > 29:40 |

---

### 20-Meter HAMR Shuttle Run (Reps / Shuttles)
*Points scale from 35.0 (minimum pass) to 50.0 (maximum performance).*

| Age Bracket | Gender | 50.0 Pts (Max Points) | 35.0 Pts (Minimum Pass) | Below 35.0 (0 Pts / Fail) |
|---|---|---|---|---|
| **Under 25** | Male <br> Female | ≥ 87 shuttles <br> ≥ 68 shuttles | 42 shuttles <br> 21 shuttles | < 42 shuttles <br> < 21 shuttles |
| **25–29** | Male <br> Female | ≥ 85 shuttles <br> ≥ 65 shuttles | 42 shuttles <br> 20 shuttles | < 42 shuttles <br> < 20 shuttles |
| **30–34** | Male <br> Female | ≥ 84 shuttles <br> ≥ 63 shuttles | 38 shuttles <br> 19 shuttles | < 38 shuttles <br> < 19 shuttles |
| **35–39** | Male <br> Female | ≥ 82 shuttles <br> ≥ 63 shuttles | 36 shuttles <br> 18 shuttles | < 36 shuttles <br> < 18 shuttles |
| **40–44** | Male <br> Female | ≥ 81 shuttles <br> ≥ 59 shuttles | 32 shuttles <br> 17 shuttles | < 32 shuttles <br> < 17 shuttles |
| **45–49** | Male <br> Female | ≥ 77 shuttles <br> ≥ 58 shuttles | 31 shuttles <br> 16 shuttles | < 31 shuttles <br> < 16 shuttles |
| **50–54** | Male <br> Female | ≥ 71 shuttles <br> ≥ 57 shuttles | 30 shuttles <br> 14 shuttles | < 30 shuttles <br> < 14 shuttles |
| **55–59** | Male <br> Female | ≥ 69 shuttles <br> ≥ 53 shuttles | 27 shuttles <br> 13 shuttles | < 27 shuttles <br> < 13 shuttles |
| **60 and Over** | Male <br> Female | ≥ 65 shuttles <br> ≥ 50 shuttles | 26 shuttles <br> 11 shuttles | < 26 shuttles <br> < 11 shuttles |

---

### 2.0 Kilometer Walk (Pass/Fail Standard)
*The walk event is graded on a pass/fail basis. Finishing under the target time constitutes a pass (no points are added to the composite score, but cardiorespiratory requirement is satisfied).*

| Age Bracket | Male Passing Time (max) | Female Passing Time (max) |
|---|---|---|
| **Under 30** | ≤ 16:16 | ≤ 17:22 |
| **30–39** | ≤ 16:18 | ≤ 17:28 |
| **40–49** | ≤ 16:23 | ≤ 17:49 |
| **50–59** | ≤ 16:40 | ≤ 18:11 |
| **60 and Over** | ≤ 16:58 | ≤ 18:53 |

---

## 3. Upper Body Strength Scoring Standards (Max 15.0 pts)

### Standard Push-ups
*Repetitions completed within 1 minute.*

| Age Bracket | Gender | 15.0 Pts (Max Points) | 2.5 Pts (Minimum Pass) | Below 2.5 (0 Pts / Fail) |
|---|---|---|---|---|
| **Under 25** | Male <br> Female | ≥ 67 <br> ≥ 50 | 30 <br> 15 | < 30 <br> < 15 |
| **25–29** | Male <br> Female | ≥ 63 <br> ≥ 47 | 28 <br> 14 | < 28 <br> < 14 |
| **30–34** | Male <br> Female | ≥ 60 <br> ≥ 44 | 26 <br> 12 | < 26 <br> < 12 |
| **35–39** | Male <br> Female | ≥ 56 <br> ≥ 42 | 23 <br> 11 | < 23 <br> < 11 |
| **40–44** | Male <br> Female | ≥ 52 <br> ≥ 39 | 21 <br> 10 | < 21 <br> < 10 |
| **45–49** | Male <br> Female | ≥ 49 <br> ≥ 36 | 19 <br> 8 | < 19 <br> < 8 |
| **50–54** | Male <br> Female | ≥ 45 <br> ≥ 34 | 17 <br> 7 | < 17 <br> < 7 |
| **55–59** | Male <br> Female | ≥ 42 <br> ≥ 31 | 14 <br> 5 | < 14 <br> < 5 |
| **60 and Over** | Male <br> Female | ≥ 38 <br> ≥ 28 | 12 <br> 3 | < 12 <br> < 3 |

---

### Hand Release (HR) Push-ups
*Repetitions completed within 2 minutes.*

| Age Bracket | Gender | 15.0 Pts (Max Points) | 2.5 Pts (Minimum Pass) | Below 2.5 (0 Pts / Fail) |
|---|---|---|---|---|
| **Under 25** | Male <br> Female | ≥ 52 <br> ≥ 42 | 27 <br> 17 | < 27 <br> < 17 |
| **25–29** | Male <br> Female | ≥ 50 <br> ≥ 40 | 25 <br> 15 | < 25 <br> < 15 |
| **30–34** | Male <br> Female | ≥ 48 <br> ≥ 38 | 23 <br> 13 | < 23 <br> < 13 |
| **35–39** | Male <br> Female | ≥ 46 <br> ≥ 36 | 21 <br> 11 | < 21 <br> < 11 |
| **40–44** | Male <br> Female | ≥ 44 <br> ≥ 34 | 19 <br> 9 | < 19 <br> < 9 |
| **45–49** | Male <br> Female | ≥ 42 <br> ≥ 32 | 17 <br> 7 | < 17 <br> < 7 |
| **50–54** | Male <br> Female | ≥ 40 <br> ≥ 30 | 15 <br> 5 | < 15 <br> < 5 |
| **55–59** | Male <br> Female | ≥ 38 <br> ≥ 28 | 13 <br> 3 | < 13 <br> < 3 |
| **60 and Over** | Male <br> Female | ≥ 36 <br> ≥ 26 | 11 <br> 1 | < 11 <br> < 1 |

---

## 4. Core Strength Scoring Standards (Max 15.0 pts)

### Standard Sit-ups
*Repetitions completed within 1 minute.*

| Age Bracket | Gender | 15.0 Pts (Max Points) | 2.5 Pts (Minimum Pass) | Below 2.5 (0 Pts / Fail) |
|---|---|---|---|---|
| **Under 25** | Male <br> Female | ≥ 58 <br> ≥ 54 | 33 <br> 29 | < 33 <br> < 29 |
| **25–29** | Male <br> Female | ≥ 56 <br> ≥ 50 | 31 <br> 25 | < 31 <br> < 25 |
| **30–34** | Male <br> Female | ≥ 54 <br> ≥ 45 | 29 <br> 20 | < 29 <br> < 20 |
| **35–39** | Male <br> Female | ≥ 52 <br> ≥ 43 | 27 <br> 18 | < 27 <br> < 18 |
| **40–44** | Male <br> Female | ≥ 50 <br> ≥ 41 | 25 <br> 16 | < 25 <br> < 16 |
| **45–49** | Male <br> Female | ≥ 48 <br> ≥ 35 | 23 <br> 10 | < 23 <br> < 10 |
| **50–54** | Male <br> Female | ≥ 46 <br> ≥ 34 | 21 <br> 9 | < 21 <br> < 9 |
| **55–59** | Male <br> Female | ≥ 44 <br> ≥ 32 | 19 <br> 7 | < 19 <br> < 7 |
| **60 and Over** | Male <br> Female | ≥ 42 <br> ≥ 31 | 17 <br> 6 | < 17 <br> < 6 |

---

### Cross-Leg Reverse Crunches
*Continuous repetitions without time limit.*

| Age Bracket | Gender | 15.0 Pts (Max Points) | 2.5 Pts (Minimum Pass) | Below 2.5 (0 Pts / Fail) |
|---|---|---|---|---|
| **Under 25** | Male <br> Female | ≥ 60 <br> ≥ 58 | 35 <br> 33 | < 35 <br> < 33 |
| **25–29** | Male <br> Female | ≥ 58 <br> ≥ 56 | 33 <br> 31 | < 33 <br> < 31 |
| **30–34** | Male <br> Female | ≥ 56 <br> ≥ 54 | 31 <br> 29 | < 31 <br> < 29 |
| **35–39** | Male <br> Female | ≥ 54 <br> ≥ 52 | 29 <br> 27 | < 29 <br> < 27 |
| **40–44** | Male <br> Female | ≥ 52 <br> ≥ 50 | 27 <br> 25 | < 27 <br> < 25 |
| **45–49** | Male <br> Female | ≥ 50 <br> ≥ 48 | 25 <br> 23 | < 25 <br> < 23 |
| **50–54** | Male <br> Female | ≥ 48 <br> ≥ 46 | 23 <br> 21 | < 23 <br> < 21 |
| **55–59** | Male <br> Female | ≥ 46 <br> ≥ 44 | 21 <br> 19 | < 21 <br> < 19 |
| **60 and Over** | Male <br> Female | ≥ 44 <br> ≥ 42 | 19 <br> 17 | < 19 <br> < 17 |

---

### Forearm Plank (Timed Event)
*Maximum time held in correct posture.*

| Age Bracket | Gender | 15.0 Pts (Max Points) | 2.5 Pts (Minimum Pass) | Below 2.5 (0 Pts / Fail) |
|---|---|---|---|---|
| **Under 25** | Male <br> Female | ≥ 3:40 <br> ≥ 3:35 | 1:35 <br> 1:30 | < 1:35 <br> < 1:30 |
| **25–29** | Male <br> Female | ≥ 3:35 <br> ≥ 3:30 | 1:30 <br> 1:25 | < 1:30 <br> < 1:25 |
| **30–34** | Male <br> Female | ≥ 3:30 <br> ≥ 3:25 | 1:25 <br> 1:20 | < 1:25 <br> < 1:20 |
| **35–39** | Male <br> Female | ≥ 3:25 <br> ≥ 3:20 | 1:20 <br> 1:15 | < 1:20 <br> < 1:15 |
| **40–44** | Male <br> Female | ≥ 3:20 <br> ≥ 3:15 | 1:15 <br> 1:10 | < 1:15 <br> < 1:10 |
| **45–49** | Male <br> Female | ≥ 3:15 <br> ≥ 3:10 | 1:10 <br> 1:05 | < 1:10 <br> < 1:05 |
| **50–54** | Male <br> Female | ≥ 3:10 <br> ≥ 3:05 | 1:05 <br> 1:00 | < 1:05 <br> < 1:00 |
| **55–59** | Male <br> Female | ≥ 3:05 <br> ≥ 3:00 | 1:00 <br> 0:55 | < 1:00 <br> < 0:55 |
| **60 and Over** | Male <br> Female | ≥ 3:00 <br> ≥ 2:55 | 0:55 <br> 0:50 | < 0:55 <br> < 0:50 |
