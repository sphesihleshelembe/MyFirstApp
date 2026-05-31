import NetInfo from '@react-native-community/netinfo';
import { getLocalCVs } from '@/utils/cvStorage';
import { supabase } from '@/lib/supabase';

export const syncLocalToSupabase = async (userId: string) => {
  const state = await NetInfo.fetch();

  if (!state.isConnected) return; // ❌ offline, do nothing

  const localCVs = await getLocalCVs();

  for (const cv of localCVs) {
    if (!cv.user_id) continue;

    const payload = {
      ...cv,
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    // Try update first
    const { error } = await supabase
      .from('cvs')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.log('Sync error:', error.message);
    }
  }
};