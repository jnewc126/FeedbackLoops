import {createClient as createServerClient} from './lib/supabase/server';
import {createClient} from '@supabase/supabase-js';
import {redirect} from 'next/navigation';
import AuthButton from './auth-button';

export default async function Home() {
    const supabaseServer = await createServerClient();
    const {data: {user},} = await supabaseServer.auth.getUser();
    if (user) {
        const {data: profile} = await supabaseServer.from('profiles').select('first_name, last_name').eq('id', user.id).single();
        if (!profile?.first_name || !profile?.last_name) {
            redirect('/complete-profile');
        }
    }
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const {data, error} = await supabase.from('messages').select('id, text').limit(10);
    return (<div className="min-h-screen bg-zinc-50 px-6 py-10">
        <div className="mx-auto flex max-w-2xl items-center justify-between"><h1
            className="text-2xl font-bold text-zinc-900">Feedback Loops</h1> <AuthButton/></div>
        <div className="mx-auto mt-10 max-w-2xl"> {error ? (<p className="text-red-600">{error.message}</p>) : (
            <ul className="space-y-3"> {data?.map((row) => (<li key={row.id}
                                                                className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-zinc-800 shadow-sm"> {row.text} </li>))} </ul>)} </div>
    </div>);
}