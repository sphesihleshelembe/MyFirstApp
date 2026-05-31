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
 * Add a new CV
 */
export const addCV = async (cv: any) => {
  const cvs = await getCVs();
  const updated = [...cvs, cv];
  await saveCVs(updated);
};

/**
 * Update a CV
 */
export const updateCV = async (updatedCV: any) => {
  const cvs = await getCVs();

  const updated = cvs.map((cv: any) =>
    cv.id === updatedCV.id ? updatedCV : cv
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