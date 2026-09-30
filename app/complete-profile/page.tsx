'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {createClient} from '@/app/lib/supabase/client';

export default function CompleteProfile() {
    const router = useRouter();
    const supabase = createClient();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const {data: {user},} = await supabase.auth.getUser();
        if (!user) {
            router.push('/');
            return;
        }
        const {error: updateError} = await supabase.from('profiles').update({
            first_name: firstName,
            last_name: lastName
        }).eq('id', user.id);
        setLoading(false);
        if (updateError) {
            setError(updateError.message);
            return;
        }
        router.push('/');
    };
    return (<div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
        <form onSubmit={handleSubmit}
              className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm"><h1
            className="mb-2 text-xl font-bold text-zinc-900">Welcome!</h1> <p
            className="mb-6 text-sm text-zinc-600">Let&apos;s finish setting up your profile.</p> <label
            className="mb-1 block text-sm font-medium text-zinc-700">First name</label> <input type="text"
                                                                                               value={firstName}
                                                                                               onChange={(e) => setFirstName(e.target.value)}
                                                                                               required
                                                                                               className="mb-4 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"/>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Last name</label> <input type="text"
                                                                                                     value={lastName}
                                                                                                     onChange={(e) => setLastName(e.target.value)}
                                                                                                     required
                                                                                                     className="mb-6 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"/> {error &&
                <p className="mb-4 text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading}
                    className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"> {loading ? 'Saving...' : 'Save and continue'} </button>
        </form>
    </div>);
}