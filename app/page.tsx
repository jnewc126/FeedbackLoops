import {createClient as createServerClient} from './lib/supabase/server';
import {redirect} from 'next/navigation';
import AuthButton from './auth-button';
import VoteButtons from './vote-buttons';

export default async function Home() {
    const supabase = await createServerClient();
    const {data: {user},} = await supabase.auth.getUser();
    if (user) {
        const {data: profile} = await supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single();
        if (!profile?.first_name || !profile?.last_name) {
            redirect('/complete-profile');
        }
    }
    const {data: generations} = await supabase.from('generations').select('id, image_url, caption, prompt, created_at').order('created_at', {ascending: false});
    const {data: votes} = await supabase.from('votes').select('generation_id, user_id, value');
    const voteCounts: Record<string, number> = {};
    const userVotes: Record<string, number> = {};
    votes?.forEach((v) => {
        voteCounts[v.generation_id] = (voteCounts[v.generation_id] ?? 0) + v.value;
        if (user && v.user_id === user.id) {
            userVotes[v.generation_id] = v.value;
        }
    });
    return (<div className="min-h-screen bg-zinc-50 px-6 py-10">
        <div className="mx-auto flex max-w-2xl items-center justify-between"><h1
            className="text-2xl font-bold text-zinc-900">Feedback Loops</h1> <AuthButton/></div>
        <div
            className="mx-auto mt-10 max-w-2xl space-y-6"> {generations && generations.length > 0 ? (generations.map((gen) => (
            <div key={gen.id} className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"><img
                src={gen.image_url} alt="" className="h-64 w-full object-cover"/>
                <div className="p-4"><p className="mb-3 text-zinc-800">{gen.caption}</p> <VoteButtons
                    generationId={gen.id} initialCount={voteCounts[gen.id] ?? 0}
                    initialUserVote={userVotes[gen.id] ?? 0} isLoggedIn={!!user}/></div>
            </div>))) : (<p className="text-zinc-500">No captions yet. Be the first to generate one!</p>)} </div>
    </div>);
}