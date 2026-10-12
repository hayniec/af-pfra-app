import { describe, it, expect } from 'vitest';
import { parseCSV } from './components/ScoreHistory';

describe('CSV Import / Export Resilience', () => {
  it('parses raw CSV with Windows CRLF (\\r\\n) line endings', () => {
    const csv = [
      '"Date","Time","Type","Gender","Age Group","Composite Score","Result","WHtR Score","Cardio Type","Cardio Score","Strength Type","Strength Score","Core Type","Core Score","_id","_savedAt","_assessmentType","_gender","_ageGroup","_cardioType","_cardioValue","_whtrValue","_strengthType","_strengthValue","_coreType","_coreValue","_compositeScore","_passed","_whtrScore","_cardioScore","_strengthScore","_coreScore","_exemptWhtr","_exemptCardio","_exemptStrength","_exemptCore"',
      '"Oct 12, 2026","5:00 PM","Official","Male","30-34","85.5","Pass","18.0","Run","45.0","Push-ups","12.5","Plank","10.0","test-1","2026-10-12T17:00:00.000Z","official","male","30-34","run","720","0.51","pushup","45","plank","180","85.5","1","18","45","12.5","10","0","0","0","0"'
    ].join('\r\n');

    const result = parseCSV(csv);
    expect(result).toHaveLength(1);
    const entry = result[0]!;
    expect(entry.id).toBe('test-1');
    expect(entry.cardioType).toBe('run');
    expect(entry.compositeScore).toBe(85.5);
    expect(entry.passed).toBe(true);
    expect(entry.exemptions?.whtr).toBe(false);
  });

  it('handles UTF-8 Byte Order Mark (BOM) prepended by Google Drive / Excel', () => {
    const csv = '\uFEFF' + [
      '"Date","Time","Type","Gender","Age Group","Composite Score","Result","WHtR Score","Cardio Type","Cardio Score","Strength Type","Strength Score","Core Type","Core Score","_id","_savedAt","_assessmentType","_gender","_ageGroup","_cardioType","_cardioValue","_whtrValue","_strengthType","_strengthValue","_coreType","_coreValue","_compositeScore","_passed","_whtrScore","_cardioScore","_strengthScore","_coreScore","_exemptWhtr","_exemptCardio","_exemptStrength","_exemptCore"',
      '"Oct 12, 2026","5:00 PM","Diagnostic","Female","25-29","90.0","Pass","20.0","HAMR","50.0","HR Push-ups","10.0","Crunches","10.0","test-2","2026-10-12T17:00:00.000Z","diagnostic","female","25-29","hamr","65","0.48","handrelease","35","crunches","45","90.0","1","20","50","10","10","0","0","0","0"'
    ].join('\n');

    const result = parseCSV(csv);
    expect(result).toHaveLength(1);
    const entry = result[0]!;
    expect(entry.id).toBe('test-2');
    expect(entry.assessmentType).toBe('diagnostic');
    expect(entry.gender).toBe('female');
    expect(entry.cardioType).toBe('hamr');
  });

  it('correctly restores exemptions from raw columns', () => {
    const csv = [
      '"Date","Time","Type","Gender","Age Group","Composite Score","Result","WHtR Score","Cardio Type","Cardio Score","Strength Type","Strength Score","Core Type","Core Score","_id","_savedAt","_assessmentType","_gender","_ageGroup","_cardioType","_cardioValue","_whtrValue","_strengthType","_strengthValue","_coreType","_coreValue","_compositeScore","_passed","_whtrScore","_cardioScore","_strengthScore","_coreScore","_exemptWhtr","_exemptCardio","_exemptStrength","_exemptCore"',
      '"Oct 12, 2026","5:00 PM","Official","Male","<25","80.0","Pass","EX","Run","EX","Push-ups","15.0","Sit-ups","15.0","test-3","2026-10-12T17:00:00.000Z","official","male","<25","run","0","0.50","pushup","50","situp","50","80.0","1","0","0","15","15","1","1","0","0"'
    ].join('\r\n');

    const result = parseCSV(csv);
    expect(result).toHaveLength(1);
    const entry = result[0]!;
    expect(entry.exemptions?.whtr).toBe(true);
    expect(entry.exemptions?.cardio).toBe(true);
    expect(entry.exemptions?.strength).toBe(false);
    expect(entry.exemptions?.core).toBe(false);
  });

  it('fallback-parses human-readable columns if raw columns were removed in Google Sheets', () => {
    const csv = [
      '"Date","Time","Type","Gender","Age Group","Composite Score","Result","WHtR Score","Cardio Type","Cardio Score","Strength Type","Strength Score","Core Type","Core Score"',
      '"Oct 12, 2026","5:00 PM","Official","Male","40-44","82.5","Pass","17.0","Walk","Pass","Push-ups","11.0","Plank","12.0"'
    ].join('\r\n');

    const result = parseCSV(csv);
    expect(result).toHaveLength(1);
    const entry = result[0]!;
    expect(entry.gender).toBe('male');
    expect(entry.ageGroup).toBe('40-44');
    expect(entry.cardioType).toBe('walk');
    expect(entry.compositeScore).toBe(82.5);
    expect(entry.passed).toBe(true);
  });

  it('parses semicolon-delimited CSV exported from European Excel / Google Drive', () => {
    const csv = [
      '"Date";"Time";"Type";"Gender";"Age Group";"Composite Score";"Result";"WHtR Score";"Cardio Type";"Cardio Score";"Strength Type";"Strength Score";"Core Type";"Core Score"',
      '"Oct 12, 2026";"5:00 PM";"Diagnostic";"Female";"35-39";"88.0";"Pass";"19.0";"HAMR";"48.0";"Push-ups";"10.0";"Sit-ups";"11.0"'
    ].join('\r\n');

    const result = parseCSV(csv);
    expect(result).toHaveLength(1);
    const entry = result[0]!;
    expect(entry.assessmentType).toBe('diagnostic');
    expect(entry.gender).toBe('female');
    expect(entry.ageGroup).toBe('35-39');
    expect(entry.cardioType).toBe('hamr');
    expect(entry.compositeScore).toBe(88.0);
  });
});
