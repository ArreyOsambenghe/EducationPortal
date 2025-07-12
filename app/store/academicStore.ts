import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { BaseEntity, BaseStore } from './baseStore';

// Academic Entities
export interface Program extends BaseEntity {
  name: string;
  description: string | null;
  code: string;
}

export interface Level extends BaseEntity {
  name: string;
  description: string | null;
  programId: string;
  code: string;
}

export interface Semester extends BaseEntity {
  name: string;
  description: string | null;
  levelId: string;
  code: string;
}

// Academic Store Interface
interface AcademicStore {
  // Programs
  programs: Program[];
  programsLoading: boolean;
  programsError: string | null;
  
  // Levels  
  levels: Level[];
  levelsLoading: boolean;
  levelsError: string | null;
  
  // Semesters
  semesters: Semester[];
  semestersLoading: boolean; 
  semestersError: string | null;
  
  // Program Actions
  setPrograms: (programs: Program[]) => void;
  addProgram: (program: Program) => void;
  updateProgram: (id: string, updates: Partial<Program>) => void;
  removeProgram: (id: string) => void;
  setProgramsLoading: (loading: boolean) => void;
  setProgramsError: (error: string | null) => void;
  
  // Level Actions
  setLevels: (levels: Level[]) => void;
  addLevel: (level: Level) => void;
  updateLevel: (id: string, updates: Partial<Level>) => void;
  removeLevel: (id: string) => void;
  setLevelsLoading: (loading: boolean) => void;
  setLevelsError: (error: string | null) => void;
  
  // Semester Actions
  setSemesters: (semesters: Semester[]) => void;
  addSemester: (semester: Semester) => void;
  updateSemester: (id: string, updates: Partial<Semester>) => void;
  removeSemester: (id: string) => void;
  setSemestersLoading: (loading: boolean) => void;
  setSemestersError: (error: string | null) => void;
  
  // Utility Actions
  clearAll: () => void;
  getProgramById: (id: string) => Program | undefined;
  getLevelById: (id: string) => Level | undefined;
  getSemesterById: (id: string) => Semester | undefined;
  getLevelsByProgram: (programId: string) => Level[];
  getSemestersByLevel: (levelId: string) => Semester[];
}

export const useAcademicStore = create<AcademicStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      programs: [],
      programsLoading: false,
      programsError: null,
      levels: [],
      levelsLoading: false,
      levelsError: null,
      semesters: [],
      semestersLoading: false,
      semestersError: null,
      
      // Program Actions
      setPrograms: (programs) => set({ programs }, false, "setPrograms"),
      addProgram: (program) => set(
        (state) => ({ programs: [...state.programs, program] }),
        false,
        "addProgram"
      ),
      updateProgram: (id, updates) => set(
        (state) => ({
          programs: state.programs.map(p => p.id === id ? { ...p, ...updates } : p)
        }),
        false,
        "updateProgram"
      ),
      removeProgram: (id) => set(
        (state) => ({ programs: state.programs.filter(p => p.id !== id) }),
        false,
        "removeProgram"
      ),
      setProgramsLoading: (loading) => set({ programsLoading: loading }, false, "setProgramsLoading"),
      setProgramsError: (error) => set({ programsError: error }, false, "setProgramsError"),
      
      // Level Actions
      setLevels: (levels) => set({ levels }, false, "setLevels"),
      addLevel: (level) => set(
        (state) => ({ levels: [...state.levels, level] }),
        false,
        "addLevel"
      ),
      updateLevel: (id, updates) => set(
        (state) => ({
          levels: state.levels.map(l => l.id === id ? { ...l, ...updates } : l)
        }),
        false,
        "updateLevel"
      ),
      removeLevel: (id) => set(
        (state) => ({ levels: state.levels.filter(l => l.id !== id) }),
        false,
        "removeLevel"
      ),
      setLevelsLoading: (loading) => set({ levelsLoading: loading }, false, "setLevelsLoading"),
      setLevelsError: (error) => set({ levelsError: error }, false, "setLevelsError"),
      
      // Semester Actions
      setSemesters: (semesters) => set({ semesters }, false, "setSemesters"),
      addSemester: (semester) => set(
        (state) => ({ semesters: [...state.semesters, semester] }),
        false,
        "addSemester"
      ),
      updateSemester: (id, updates) => set(
        (state) => ({
          semesters: state.semesters.map(s => s.id === id ? { ...s, ...updates } : s)
        }),
        false,
        "updateSemester"
      ),
      removeSemester: (id) => set(
        (state) => ({ semesters: state.semesters.filter(s => s.id !== id) }),
        false,
        "removeSemester"
      ),
      setSemestersLoading: (loading) => set({ semestersLoading: loading }, false, "setSemestersLoading"),
      setSemestersError: (error) => set({ semestersError: error }, false, "setSemestersError"),
      
      // Utility Actions
      clearAll: () => set(
        {
          programs: [],
          levels: [],
          semesters: [],
          programsError: null,
          levelsError: null,
          semestersError: null,
        },
        false,
        "clearAll"
      ),
      getProgramById: (id) => get().programs.find(p => p.id === id),
      getLevelById: (id) => get().levels.find(l => l.id === id),
      getSemesterById: (id) => get().semesters.find(s => s.id === id),
      getLevelsByProgram: (programId) => get().levels.filter(l => l.programId === programId),
      getSemestersByLevel: (levelId) => get().semesters.filter(s => s.levelId === levelId),
    }),
    { name: "academic-store" }
  )
);
