'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {createClient} from '@/app/lib/supabase/client';

const inputClass = 'h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-sm text-ink transition-colors hover:border-faint focus:border-amber';

export default function CompleteProfileForm({userId, initialFirstName, initialLastName}: {
    userId: string;
    initialFirstName: string;
    initialLastName: string;
}) {
    const router = useRouter();
    const supabase = createClient();
    const [firstName, setFirstName] = useState(initialFirstName);
    const [lastName, setLastName] = useState(initialLastName);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firstName.trim() || !lastName.trim()) {
            setError('Add both a first and last name to continue.');
            return;
        }
        setSaving(true);
        setError('');
        const {error: updateError} = await supabase.from('profiles')
            .update({first_name: firstName.trim(), last_name: lastName.trim()})
            .eq('id', userId);
        if (updateError) {
            console.error('Profile save failed', updateError);
            setError('Your name didn’t save. Try again.');
            setSaving(false);
            return;
        }
        router.push('/');
        router.refresh();
    };

    return (
        <form onSubmit={handleSubmit} noValidate className="mt-8 rounded-card border border-line bg-surface p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="first-name" className="mb-1.5 block text-sm font-medium text-ink">First name</label>
                    <input id="first-name" type="text" autoComplete="given-name" required autoFocus
                           value={firstName} onChange={(e) => setFirstName(e.target.value)}
                           aria-invalid={!!error && !firstName.trim()} className={inputClass}/>
                </div>
                <div>
                    <label htmlFor="last-name" className="mb-1.5 block text-sm font-medium text-ink">Last name</label>
                    <input id="last-name" type="text" autoComplete="family-name" required
                           value={lastName} onChange={(e) => setLastName(e.target.value)}
                           aria-invalid={!!error && !lastName.trim()} className={inputClass}/>
                </div>
            </div>
            {error && <p role="alert" className="mt-4 text-sm text-down">{error}</p>}
            <button type="submit" disabled={saving}
                    className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-control bg-amber px-5 text-sm font-semibold text-ink shadow-sm transition-colors hover:bg-amber-strong disabled:cursor-wait disabled:opacity-60">
                {saving ? 'Saving…' : <>Continue to the feed <span aria-hidden="true">→</span></>}
            </button>
            <p className="mt-3 text-center text-xs text-muted">You can change this later on your profile.</p>
        </form>
    );
}
