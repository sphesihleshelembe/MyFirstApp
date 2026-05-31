import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'cvs_data';

/**
 * Get all CVs
 */
export const getCVs = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.log('Error loading CVs:', error);
    return [];
  }
};

/**
 * Save all CVs (overwrite)
 */
export const saveCVs = async (cvs: any[]) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cvs));
  } catch (error) {
    console.log('Error saving CVs:', error);
  }
};

/**
 * Add a new CV (always starts as NOT synced)
 */
export const addCV = async (cv: any) => {
  const cvs = await getCVs();

  const newCV = {
    ...cv,
    synced: false, // 🔥 important for sync system
  };

  const updated = [...cvs, newCV];
  await saveCVs(updated);
};

/**
 * Update a CV (mark as NOT synced again)
 */
export const updateCV = async (updatedCV: any) => {
  const cvs = await getCVs();

  const updated = cvs.map((cv: any) =>
    cv.id === updatedCV.id
      ? { ...updatedCV, synced: false } // 🔥 forces re-sync
      : cv
  );

  await saveCVs(updated);
};

/**
 * Delete a CV
 */
export const deleteCV = async (id: string) => {
  const cvs = await getCVs();

  const filtered = cvs.filter((cv: any) => cv.id !== id);

  await saveCVs(filtered);
};

/**
 * Mark a CV as synced (call this AFTER successful Supabase upload)
 */
export const markCVAsSynced = async (id: string) => {
  const cvs = await getCVs();

  const updated = cvs.map((cv: any) =>
    cv.id === id ? { ...cv, synced: true } : cv
  );

  await saveCVs(updated);
};

/**
 * Get only unsynced CVs (used by sync function)
 */
export const getUnsyncedCVs = async () => {
  const cvs = await getCVs();
  return cvs.filter((cv: any) => !cv.synced);
};