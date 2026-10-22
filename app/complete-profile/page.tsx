import type {Metadata} from 'next';
import {redirect} from 'next/navigation';
import {createClient} from '@/app/lib/supabase/server';
import {getViewer} from '../lib/viewer';
import {BrandMark} from '../site-header';
import CompleteProfileForm from './complete-profile-form';

export const metadata: Metadata = {
    title: 'Finish setting up',
};

export default async function CompleteProfilePage() {
    const viewer = await getViewer();
    if (!viewer) redirect('/');
    // Google usually shares the person's name, so the form can start filled in.
    const supabase = await createClient();
    const {data: {user}} = await supabase.auth.getUser();
    const meta = user?.user_metadata ?? {};
    const [fullFirst, ...fullRest] = String(meta.full_name ?? meta.name ?? '').trim().split(/\s+/);
    const firstName = viewer.firstName ?? meta.given_name ?? fullFirst ?? '';
    const lastName = viewer.lastName ?? meta.family_name ?? fullRest.join(' ');

    return (
        <div className="page-container pb-20 pt-10 sm:pt-20">
            <div className="mx-auto max-w-md">
                <BrandMark className="h-10 w-10 text-ink"/>
                <p className="mb-3 mt-8 text-xs font-semibold uppercase tracking-[0.14em] text-amber-deep">One last step</p>
                <h1 className="font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink sm:text-5xl">
                    Welcome to FeedbackLoops
                </h1>
                <p className="mt-4 text-base leading-relaxed text-muted">
                    Tell us what to call you. Your name appears next to the photos you post, so people know whose
                    caption they&apos;re voting on.
                </p>
                <CompleteProfileForm userId={viewer.id} initialFirstName={firstName} initialLastName={lastName}/>
            </div>
        </div>
    );
}
