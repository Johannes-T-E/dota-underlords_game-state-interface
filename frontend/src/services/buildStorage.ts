import type { Build } from '@/types';
import { apiService } from './api';

const STORAGE_KEY = 'underlords_builds';

/**
 * Save a build to backend (with localStorage fallback)
 */
export async function saveBuild(build: Build): Promise<void> {
  try {
    // Try to save to backend first
    await apiService.saveBuild(build);
    
    // Also save to localStorage as backup
    const builds = loadBuildsFromLocalStorage();
    const existingIndex = builds.findIndex(b => b.id === build.id);
    
    if (existingIndex >= 0) {
      builds[existingIndex] = {
        ...build,
        updatedAt: new Date().toISOString(),
      };
    } else {
      builds.push({
        ...build,
        createdAt: build.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
  } catch (error) {
    console.error('Failed to save build to backend, falling back to localStorage:', error);
    
    // Fallback to localStorage only
    try {
      const builds = loadBuildsFromLocalStorage();
      const existingIndex = builds.findIndex(b => b.id === build.id);
      
      if (existingIndex >= 0) {
        builds[existingIndex] = {
          ...build,
          updatedAt: new Date().toISOString(),
        };
      } else {
        builds.push({
          ...build,
          createdAt: build.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
    } catch (localError) {
      console.error('Failed to save build to localStorage:', localError);
      throw new Error('Failed to save build');
    }
  }
}

/**
 * Load all builds from backend (with localStorage fallback)
 */
export async function loadBuilds(): Promise<Build[]> {
  try {
    // Try to load from backend first
    const builds = await apiService.getBuilds();
    
    // Also sync to localStorage as backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
    
    return builds;
  } catch (error) {
    console.error('Failed to load builds from backend, falling back to localStorage:', error);
    
    // Fallback to localStorage
    return loadBuildsFromLocalStorage();
  }
}

/**
 * Load all builds from localStorage only (internal helper)
 */
function loadBuildsFromLocalStorage(): Build[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    
    const builds = JSON.parse(data) as Build[];
    // Validate that we got an array
    if (!Array.isArray(builds)) {
      console.warn('Invalid builds data in localStorage, resetting');
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    
    return builds;
  } catch (error) {
    console.error('Failed to load builds from localStorage:', error);
    return [];
  }
}

/**
 * Get a specific build by ID
 */
export async function getBuild(id: string): Promise<Build | null> {
  try {
    return await apiService.getBuild(id);
  } catch (error) {
    console.error('Failed to get build from backend, falling back to localStorage:', error);
    
    // Fallback to localStorage
    try {
      const builds = loadBuildsFromLocalStorage();
      return builds.find(b => b.id === id) || null;
    } catch (localError) {
      console.error('Failed to get build from localStorage:', localError);
      return null;
    }
  }
}

/**
 * Delete a build by ID
 */
export async function deleteBuild(id: string): Promise<void> {
  try {
    // Try to delete from backend first
    await apiService.deleteBuild(id);
    
    // Also remove from localStorage
    const builds = loadBuildsFromLocalStorage();
    const filtered = builds.filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete build from backend, falling back to localStorage:', error);
    
    // Fallback to localStorage only
    try {
      const builds = loadBuildsFromLocalStorage();
      const filtered = builds.filter(b => b.id !== id);
      
      if (filtered.length === builds.length) {
        // Build not found
        return;
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (localError) {
      console.error('Failed to delete build from localStorage:', localError);
      throw new Error('Failed to delete build');
    }
  }
}

/**
 * Update a build (partial update)
 */
export async function updateBuild(id: string, updates: Partial<Omit<Build, 'id' | 'createdAt'>>): Promise<void> {
  try {
    const builds = await loadBuilds();
    const index = builds.findIndex((b: Build) => b.id === id);
    
    if (index < 0) {
      throw new Error(`Build with id ${id} not found`);
    }
    
    builds[index] = {
      ...builds[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    } as Build;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
  } catch (error) {
    console.error('Failed to update build:', error);
    throw new Error('Failed to update build in localStorage');
  }
}

/**
 * Generate a new UUID for build IDs
 */
export function generateBuildId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

