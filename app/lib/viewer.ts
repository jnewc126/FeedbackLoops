import {cache} from 'react';
import {createClient} from '@/app/lib/supabase/server';

export type Viewer = {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
};

// Cached per request so the header and the page share one auth + profile lookup.
export const getViewer = cache(async (): Promise<Viewer | null> => {
    const supabase = await createClient();
    const {data: {user},} = await supabase.auth.getUser();
    if (!user) return null;
    const {data: profile} = await supabase.from('profiles').select('first_name, last_name, avatar_url').eq('id', user.id).single();
    return {
        id: user.id,
        email: user.email ?? null,
        firstName: profile?.first_name ?? null,
        lastName: profile?.last_name ?? null,
        avatarUrl: profile?.avatar_url ?? null,
    };
});
