import NetInfo from '@react-native-community/netinfo';
import { supabase } from '@/lib/supabase';
import { getUnsyncedCVs, markCVAsSynced } from './cvStorage';

/**
 * Sync local CVs → Supabase
 */
export const syncCVsToCloud = async (userId: string) => {
  try {
    // 1. Check internet
    const state = await NetInfo.fetch();
    if (!state.isConnected) return;

    // 2. Get only unsynced CVs
    const unsyncedCVs = await getUnsyncedCVs();

    if (unsyncedCVs.length === 0) return;

    // 3. Upload one by one
    for (const cv of unsyncedCVs) {
      const payload = {
        ...cv,
        user_id: userId,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('cvs')
        .upsert(payload, { onConflict: 'id' });

      // 4. If upload successful → mark as synced locally
      if (!error) {
        await markCVAsSynced(cv.id);
      }
    }
  } catch (error) {
    console.log('Sync error:', error);
  }
};