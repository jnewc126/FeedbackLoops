import type {Metadata} from 'next';
import Link from 'next/link';
import {createClient} from '@/app/lib/supabase/server';
import {getViewer} from '../lib/viewer';
import {GoogleIcon, SignInButton} from '../auth-button';
import CaptionCard from '../caption-card';
import ProfileForm from './profile-form';

export const metadata: Metadata = {
    title: 'Your profile',
};

export default async function ProfilePage() {
    const viewer = await getViewer();
    if (!viewer) {
        return (
            <div className="page-container pb-20 pt-8 sm:pt-14">
                <section aria-labelledby="profile-signin"
                         className="mx-auto flex max-w-xl flex-col items-center rounded-card border border-dashed border-line-strong bg-surface px-6 py-16 text-center">
                    <h1 id="profile-signin" className="font-display text-3xl text-ink">Sign in to see your profile</h1>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
                        Your profile holds your name, your photo and every caption you&apos;ve posted.
                    </p>
                    <SignInButton
                        className="mt-6 inline-flex h-11 items-center gap-2 rounded-control bg-ink px-5 text-sm font-semibold text-paper transition-colors hover:bg-ink/85">
                        <GoogleIcon/>
                        Sign in with Google
                    </SignInButton>
                </section>
            </div>
        );
    }

    const supabase = await createClient();
    const {data: generations} = await supabase.from('generations')
        .select('id, image_url, caption, created_at')
        .eq('user_id', viewer.id)
        .order('created_at', {ascending: false});
    const ids = generations?.map((g) => g.id) ?? [];
    const {data: votes} = ids.length > 0
        ? await supabase.from('votes').select('generation_id, user_id, value').in('generation_id', ids)
        : {data: []};
    const scores: Record<string, number> = {};
    const myVotes: Record<string, number> = {};
    votes?.forEach((v) => {
        scores[v.generation_id] = (scores[v.generation_id] ?? 0) + v.value;
        if (v.user_id === viewer.id) myVotes[v.generation_id] = v.value;
    });
    const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
    const count = generations?.length ?? 0;
    const name = [viewer.firstName, viewer.lastName].filter(Boolean).join(' ') || 'Your profile';

    return (
        <div className="page-container pb-20">
            <header className="border-b border-line pb-8 pt-8 sm:pt-14">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-amber-deep">Your profile</p>
                <h1 className="font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink sm:text-5xl">
                    {name}
                </h1>
                <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                    <div className="flex items-baseline gap-2">
                        <dt className="text-muted">Captions posted</dt>
                        <dd className="font-semibold tabular-nums text-ink">{count}</dd>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <dt className="text-muted">Net votes received</dt>
                        <dd className={`font-semibold tabular-nums ${totalScore > 0 ? 'text-up' : totalScore < 0 ? 'text-down' : 'text-ink'}`}>
                            {totalScore > 0 ? `+${totalScore}` : totalScore}
                        </dd>
                    </div>
                </dl>
            </header>

            <div className="grid gap-12 pt-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
                <section aria-labelledby="details-title" className="lg:sticky lg:top-24 lg:self-start">
                    <h2 id="details-title" className="font-display text-2xl text-ink">Profile details</h2>
                    <p className="mt-1 text-sm text-muted">Your name and photo appear next to everything you post.</p>
                    <ProfileForm userId={viewer.id} email={viewer.email} initialFirstName={viewer.firstName ?? ''}
                                 initialLastName={viewer.lastName ?? ''} initialAvatarUrl={viewer.avatarUrl}/>
                </section>

                <section aria-labelledby="captions-title">
                    <div className="flex items-baseline justify-between gap-4">
                        <h2 id="captions-title" className="font-display text-2xl text-ink">Your captions</h2>
                        {count > 0 && (
                            <Link href="/generate"
                                  className="shrink-0 rounded-control text-sm font-semibold text-amber-deep underline-offset-4 hover:underline">
                                Caption another photo
                            </Link>
                        )}
                    </div>
                    {count > 0 ? (
                        <ul className="mt-6 grid gap-6 sm:grid-cols-2">
                            {generations!.map((gen) => (
                                <li key={gen.id}>
                                    <CaptionCard gen={gen} score={scores[gen.id] ?? 0}
                                                 userVote={myVotes[gen.id] ?? 0} isLoggedIn/>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="mt-6 flex flex-col items-center rounded-card border border-dashed border-line-strong px-6 py-14 text-center">
                            <p className="font-display text-xl text-ink">Nothing posted yet</p>
                            <p className="mt-2 max-w-sm text-sm text-muted">
                                Upload a photo, see what the AI writes, and find out if the community agrees.
                            </p>
                            <Link href="/generate"
                                  className="mt-6 inline-flex h-11 items-center rounded-control bg-amber px-5 text-sm font-semibold text-ink transition-colors hover:bg-amber-strong">
                                Caption your first photo
                            </Link>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
