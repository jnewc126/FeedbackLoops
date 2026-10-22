'use client';
import {useEffect, useId, useState} from 'react';
import {createClient} from '@/app/lib/supabase/client';

function Arrow({direction}: { direction: 'up' | 'down' }) {
    return (
        <svg viewBox="0 0 16 16" className={`h-4 w-4 ${direction === 'down' ? 'rotate-180' : ''}`} aria-hidden="true">
            <path fill="currentColor" d="M8 3.2 13.6 10.4H2.4z"/>
        </svg>
    );
}

export default function VoteButtons({generationId, initialCount, initialUserVote, isLoggedIn,}: {
    generationId: string;
    initialCount: number;
    initialUserVote: number;
    isLoggedIn: boolean;
}) {
    const supabase = createClient();
    const hintId = useId();
    const [count, setCount] = useState(initialCount);
    const [myVote, setMyVote] = useState(initialUserVote);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(() => setMessage(''), 4000);
        return () => clearTimeout(timer);
    }, [message]);
    const vote = async (value: number) => {
        if (!isLoggedIn) {
            setMessage('Sign in to vote');
            return;
        }
        if (loading) return;
        setLoading(true);
        setMessage('');
        const {data: {user},} = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            setMessage('Sign in to vote');
            return;
        }
        // The count only changes once Supabase confirms the write, so the UI never drifts from the database.
        let error;
        if (myVote === value) {
            ({error} = await supabase.from('votes').delete().eq('generation_id', generationId).eq('user_id', user.id));
            if (!error) {
                setCount(count - value);
                setMyVote(0);
            }
        } else if (myVote === 0) {
            ({error} = await supabase.from('votes').insert({generation_id: generationId, user_id: user.id, value}));
            if (!error) {
                setCount(count + value);
                setMyVote(value);
            }
        } else {
            ({error} = await supabase.from('votes').update({value}).eq('generation_id', generationId).eq('user_id', user.id));
            if (!error) {
                setCount(count - myVote + value);
                setMyVote(value);
            }
        }
        if (error) setMessage('Vote didn’t save. Try again.');
        setLoading(false);
    };
    const base = 'inline-flex h-10 w-10 items-center justify-center rounded-control transition-colors disabled:cursor-wait aria-disabled:cursor-not-allowed aria-disabled:opacity-45';
    return (
        <div className="relative shrink-0">
            <div role="group" aria-label="Vote on this caption" aria-busy={loading}
                 className="flex items-center rounded-control border border-line bg-surface">
                <button type="button" onClick={() => vote(1)} disabled={loading}
                        aria-pressed={myVote === 1} aria-disabled={!isLoggedIn || undefined}
                        aria-describedby={message ? hintId : undefined}
                        aria-label={myVote === 1 ? 'Remove upvote' : 'Upvote: caption landed'}
                        className={`${base} ${myVote === 1 ? 'bg-up-soft text-up ring-1 ring-inset ring-up/40' : 'text-faint hover:bg-up-soft hover:text-up'}`}>
                    <Arrow direction="up"/>
                </button>
                <span aria-live="polite"
                      className={`min-w-8 text-center text-sm font-semibold tabular-nums ${myVote === 1 ? 'text-up' : myVote === -1 ? 'text-down' : 'text-ink'}`}>
                    <span className="sr-only">Score </span>{count}
                </span>
                <button type="button" onClick={() => vote(-1)} disabled={loading}
                        aria-pressed={myVote === -1} aria-disabled={!isLoggedIn || undefined}
                        aria-describedby={message ? hintId : undefined}
                        aria-label={myVote === -1 ? 'Remove downvote' : 'Downvote: caption missed'}
                        className={`${base} ${myVote === -1 ? 'bg-down-soft text-down ring-1 ring-inset ring-down/40' : 'text-faint hover:bg-down-soft hover:text-down'}`}>
                    <Arrow direction="down"/>
                </button>
            </div>
            {message && (
                <p id={hintId} role="status"
                   className="absolute right-0 top-full z-10 mt-1.5 whitespace-nowrap rounded-control bg-ink px-2.5 py-1 text-xs font-medium text-paper shadow-lift">
                    {message}
                </p>
            )}
        </div>
    );
}
