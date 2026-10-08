'use client';
import {useState} from 'react';
import {createClient} from '@/app/lib/supabase/client';

export default function VoteButtons({generationId, initialCount, initialUserVote, isLoggedIn,}: {
    generationId: string;
    initialCount: number;
    initialUserVote: number;
    isLoggedIn: boolean;
}) {
    const supabase = createClient();
    const [count, setCount] = useState(initialCount);
    const [myVote, setMyVote] = useState(initialUserVote);
    const [loading, setLoading] = useState(false);
    const vote = async (value: number) => {
        setLoading(true);
        const {data: {user},} = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }
        if (myVote === value) {
            await supabase.from('votes').delete().eq('generation_id', generationId).eq('user_id', user.id);
            setCount(count - value);
            setMyVote(0);
        } else if (myVote === 0) {
            await supabase.from('votes').insert({generation_id: generationId, user_id: user.id, value});
            setCount(count + value);
            setMyVote(value);
        } else {
            await supabase.from('votes').update({value}).eq('generation_id', generationId).eq('user_id', user.id);
            setCount(count - myVote + value);
            setMyVote(value);
        }
        setLoading(false);
    };
    return (<div className="flex items-center gap-3">
        <button onClick={() => vote(1)} disabled={loading || !isLoggedIn}
                title={!isLoggedIn ? 'Sign in to vote' : undefined}
                className={`rounded-full border px-3 py-1 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${myVote === 1 ? 'border-green-600 bg-green-50 text-green-700' : 'border-zinc-300 text-zinc-600 hover:bg-zinc-100'}`}> ▲
            Upvote
        </button>
        <span className="text-sm font-medium text-zinc-700">{count}</span>
        <button onClick={() => vote(-1)} disabled={loading || !isLoggedIn}
                title={!isLoggedIn ? 'Sign in to vote' : undefined}
                className={`rounded-full border px-3 py-1 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${myVote === -1 ? 'border-red-600 bg-red-50 text-red-700' : 'border-zinc-300 text-zinc-600 hover:bg-zinc-100'}`}> ▼
            Downvote
        </button>
    </div>);
}