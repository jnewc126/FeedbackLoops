'use client';
import {useEffect, useId, useState} from 'react';
import {useRouter} from 'next/navigation';
import {createClient} from '@/app/lib/supabase/client';
import Avatar, {initialsFor} from '../avatar';
import {prepareImage} from '../lib/prepare-image';

type Notice = { tone: 'success' | 'error'; text: string } | null;

const inputClass = 'h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-faint transition-colors hover:border-faint focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30';

export default function ProfileForm({userId, email, initialFirstName, initialLastName, initialAvatarUrl}: {
    userId: string;
    email: string | null;
    initialFirstName: string;
    initialLastName: string;
    initialAvatarUrl: string | null;
}) {
    const router = useRouter();
    const supabase = createClient();
    const photoInputId = useId();
    const [firstName, setFirstName] = useState(initialFirstName);
    const [lastName, setLastName] = useState(initialLastName);
    const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [photoNotice, setPhotoNotice] = useState<Notice>(null);
    const [formNotice, setFormNotice] = useState<Notice>(null);
    const dirty = firstName.trim() !== initialFirstName || lastName.trim() !== initialLastName;

    // Success messages fade on their own; errors stay until the next attempt.
    useEffect(() => {
        if (formNotice?.tone !== 'success') return;
        const timer = setTimeout(() => setFormNotice(null), 4000);
        return () => clearTimeout(timer);
    }, [formNotice]);

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        e.target.value = '';
        if (!selected) return;
        setPhotoNotice(null);
        if (!selected.type.startsWith('image/')) {
            setPhotoNotice({tone: 'error', text: 'That file isn’t a photo. Choose a JPG, PNG or WebP image.'});
            return;
        }
        setUploading(true);
        try {
            // Avatars never show larger than 112px, so a small square-ish copy is plenty.
            const file = await prepareImage(selected, {maxEdge: 512, passthroughBytes: 512 * 1024});
            const fileExt = file.name.split('.').pop();
            const filePath = `${userId}/avatar.${fileExt}`;
            const {error: uploadError} = await supabase.storage.from('avatars').upload(filePath, file, {upsert: true});
            if (uploadError) throw uploadError;
            const {data: {publicUrl}} = supabase.storage.from('avatars').getPublicUrl(filePath);
            const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;
            const {error: updateError} = await supabase.from('profiles').update({avatar_url: cacheBustedUrl}).eq('id', userId);
            if (updateError) throw updateError;
            setAvatarUrl(cacheBustedUrl);
            setPhotoNotice({tone: 'success', text: 'Photo updated'});
            router.refresh();
        } catch (err) {
            console.error('Avatar upload failed', err);
            setPhotoNotice({
                tone: 'error',
                text: err instanceof Error && err.message.startsWith('This photo') ? err.message : 'Your photo couldn’t be uploaded. Try again.',
            });
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firstName.trim() || !lastName.trim()) {
            setFormNotice({tone: 'error', text: 'Add both a first and last name.'});
            return;
        }
        setSaving(true);
        setFormNotice(null);
        const {error} = await supabase.from('profiles')
            .update({first_name: firstName.trim(), last_name: lastName.trim()})
            .eq('id', userId);
        setSaving(false);
        if (error) {
            console.error('Profile save failed', error);
            setFormNotice({tone: 'error', text: 'Your changes didn’t save. Try again.'});
            return;
        }
        setFirstName(firstName.trim());
        setLastName(lastName.trim());
        setFormNotice({tone: 'success', text: 'Changes saved'});
        router.refresh();
    };

    return (
        <div className="mt-6 rounded-card border border-line bg-surface p-5 sm:p-6">
            <div className="flex items-center gap-5">
                <div className="relative">
                    <Avatar src={avatarUrl} size="lg" initials={initialsFor(firstName, lastName, email)}/>
                    {uploading && (
                        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-ink/50"
                              aria-hidden="true">
                            <span className="h-6 w-6 animate-spin rounded-full border-2 border-paper/30 border-t-amber"/>
                        </span>
                    )}
                </div>
                <div className="min-w-0">
                    <input id={photoInputId} type="file" accept="image/*" className="peer sr-only"
                           disabled={uploading} onChange={handlePhotoChange}/>
                    <label htmlFor={photoInputId}
                           className={`inline-flex h-9 items-center rounded-control border border-line-strong bg-surface px-3 text-sm font-medium text-ink transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amber ${uploading ? 'cursor-wait opacity-60' : 'cursor-pointer hover:border-faint'}`}>
                        {uploading ? 'Uploading…' : avatarUrl ? 'Change photo' : 'Add a photo'}
                    </label>
                    <p className="mt-2 text-xs text-muted">A clear photo of your face works best.</p>
                    <p role="status" className={`mt-1 text-xs ${photoNotice?.tone === 'error' ? 'text-down' : 'text-up'}`}>
                        {photoNotice?.text}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSave} className="mt-6 border-t border-line pt-6" noValidate>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <div>
                        <label htmlFor="first-name" className="mb-1.5 block text-sm font-medium text-ink">First name</label>
                        <input id="first-name" type="text" autoComplete="given-name" required value={firstName}
                               onChange={(e) => setFirstName(e.target.value)} className={inputClass}/>
                    </div>
                    <div>
                        <label htmlFor="last-name" className="mb-1.5 block text-sm font-medium text-ink">Last name</label>
                        <input id="last-name" type="text" autoComplete="family-name" required value={lastName}
                               onChange={(e) => setLastName(e.target.value)} className={inputClass}/>
                    </div>
                </div>
                {email && (
                    <div className="mt-4">
                        <p className="mb-1.5 text-sm font-medium text-ink">Email</p>
                        <p className="truncate text-sm text-muted">{email}</p>
                        <p className="mt-1 text-xs text-muted">From your Google account. Only you can see it.</p>
                    </div>
                )}
                <div className="mt-6 flex flex-wrap items-center gap-4">
                    <button type="submit" disabled={saving || !dirty}
                            className="inline-flex h-11 items-center justify-center rounded-control bg-ink px-5 text-sm font-semibold text-paper transition-colors hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-40">
                        {saving ? 'Saving…' : 'Save changes'}
                    </button>
                    <p role="status" className={`text-sm ${formNotice?.tone === 'error' ? 'text-down' : 'text-up'}`}>
                        {formNotice?.text}
                    </p>
                </div>
            </form>
        </div>
    );
}
