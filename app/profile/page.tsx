'use client';

import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {createClient} from '@/app/lib/supabase/client';
import type {User} from '@supabase/supabase-js';
import Link from 'next/link';


export default function ProfilePage() {
    const router = useRouter();
    const supabase = createClient();
    const [user, setUser] = useState<User | null>(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const {
                data: {user},
            } = await supabase.auth.getUser();

            if (!user) {
                router.push('/');
                return;
            }

            setUser(user);

            const {data: profile} = await supabase
                .from('profiles')
                .select('first_name, last_name, avatar_url')
                .eq('id', user.id)
                .single();

            setFirstName(profile?.first_name ?? '');
            setLastName(profile?.last_name ?? '');
            setAvatarUrl(profile?.avatar_url ?? null);
            setLoading(false);
        };

        load();
    }, [supabase, router]);

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploading(true);
        setMessage('');

        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/avatar.${fileExt}`;

        const {error: uploadError} = await supabase.storage
            .from('avatars')
            .upload(filePath, file, {upsert: true});

        if (uploadError) {
            setMessage(uploadError.message);
            setUploading(false);
            return;
        }

        const {
            data: {publicUrl},
        } = supabase.storage.from('avatars').getPublicUrl(filePath);

        const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

        const {error: updateError} = await supabase
            .from('profiles')
            .update({avatar_url: cacheBustedUrl})
            .eq('id', user.id);

        if (updateError) {
            setMessage(updateError.message);
        } else {
            setAvatarUrl(cacheBustedUrl);
        }

        setUploading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        setMessage('');

        const {error} = await supabase
            .from('profiles')
            .update({first_name: firstName, last_name: lastName})
            .eq('id', user.id);

        setSaving(false);
        setMessage(error ? error.message : 'Saved!');
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50">
                <p className="text-zinc-500">Loading...</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-10">
            <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
                <div className="mb-6 flex items-center justify-between"><h1
                    className="text-xl font-bold text-zinc-900">Your Profile</h1> <Link href="/"
                                                                                        className="text-sm font-medium text-zinc-500 underline"> Back
                    home </Link></div>

                <div className="mb-6 flex flex-col items-center gap-3">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="Profile" className="h-24 w-24 rounded-full object-cover"/>
                    ) : (
                        <div
                            className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-200 text-2xl text-zinc-500">
                            ?
                        </div>
                    )}
                    <label className="cursor-pointer text-sm font-medium text-zinc-700 underline">
                        {uploading ? 'Uploading...' : 'Change photo'}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            disabled={uploading}
                            className="hidden"
                        />
                    </label>
                </div>

                <form onSubmit={handleSave}>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">First name</label>
                    <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="mb-4 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                    />

                    <label className="mb-1 block text-sm font-medium text-zinc-700">Last name</label>
                    <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="mb-6 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                    />

                    {message && <p className="mb-4 text-sm text-zinc-600">{message}</p>}

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save changes'}
                    </button>
                </form>
            </div>
        </div>
    );
}