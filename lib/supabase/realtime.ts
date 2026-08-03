import { supabase } from '@/lib/supabase/client';

export function subscribeToChannel(channelName: string, handler: (payload: unknown) => void) {
  const channel = supabase.channel(channelName);

  channel.on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
    handler(payload);
  });

  return channel.subscribe();
}

export function unsubscribeChannel(channelName: string) {
  return supabase.removeChannel(supabase.getChannels().find((item) => item.topic === channelName) as any);
}
