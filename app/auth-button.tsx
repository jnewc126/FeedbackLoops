'use client';
import {useEffect, useState} from 'react';
import {createClient} from '@/app/lib/supabase/client';
import type {User} from '@supabase/supabase-js';
import Link from 'next/link';

export default function AuthButton() {
    const supabase = createClient();
    const [user, setUser] = useState<User | null>(null);
    useEffect(() => {
        supabase.auth.getUser().then(({data}) => setUser(data.user));
        const {data: listener} = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });
        return () => listener.subscription.unsubscribe();
    }, [supabase]);
    const signInWithGoogle = () => {
        supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {redirectTo: `${window.location.origin}/auth/callback`},
        }).catch(console.error);
    };
    const signOut = () => {
        supabase.auth.signOut().then(() => window.location.reload());
    };
    if (user) {
        return (
            <div className="flex items-center gap-3"><span className="text-sm text-zinc-600">{user.email}</span> <Link
                href="/profile"
                className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"> Profile </Link>
                <button onClick={signOut}
                        className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"> Sign
                    out
                </button>
            </div>);
    }
    return (<button onClick={signInWithGoogle}
                    className="flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800">
        <svg width="16" height="16" viewBox="0 0 48 48">
            <path fill="#FFC107"
                  d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
            <path fill="#FF3D00"
                  d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50"
                  d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.4C29.6 35.4 27 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.6 5.1C9.6 39.6 16.3 44 24 44z"/>
            <path fill="#1976D2"
                  d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.7l6.6 5.4C41.9 36.2 44 30.6 44 24c0-1.3-.1-2.7-.4-3.5z"/>
        </svg>
        Sign in with Google </button>);
}