
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export function subscribeToHouseholdChanges(
  householdId: string,
  onChange: () => void,
  onSubscribed?: () => void,
): RealtimeChannel {
  const channel = supabase
    .channel(`household:${householdId}`, {
      config: {
        private: true,
      },
    })
    .on(
      'broadcast',
      { event: 'household_change' },
      () => {
        onChange();
      },
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        onSubscribed?.();
      }
    });

  return channel;
}

export async function unsubscribeFromHouseholdChanges(
  channel: RealtimeChannel,
): Promise<void> {
  await supabase.removeChannel(channel);
}
