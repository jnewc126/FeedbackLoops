import {createClient as createServerClient} from './lib/supabase/server';
import {redirect} from 'next/navigation';
import Link from 'next/link';
import CaptionCard from './caption-card';
import {GoogleIcon, SignInButton} from './auth-button';
import {getViewer} from './lib/viewer';

export default async function Home() {
    const supabase = await createServerClient();
    const user = await getViewer();
    if (user && (!user.firstName || !user.lastName)) {
        redirect('/complete-profile');
    }
    const {data: generations, error: feedError} = await supabase.from('generations').select('id, user_id, image_url, caption, prompt, created_at').order('created_at', {ascending: false});
    const {data: votes} = await supabase.from('votes').select('generation_id, user_id, value');
    // Author names are best-effort: if profiles aren't readable, cards simply omit the byline.
    const authorIds = [...new Set(generations?.map((g) => g.user_id).filter(Boolean) ?? [])];
    const {data: authors} = authorIds.length > 0
        ? await supabase.from('profiles').select('id, first_name, last_name, avatar_url').in('id', authorIds)
        : {data: []};
    const authorsById = new Map(authors?.map((a) => [a.id, a]) ?? []);
    const voteCounts: Record<string, number> = {};
    const userVotes: Record<string, number> = {};
    votes?.forEach((v) => {
        voteCounts[v.generation_id] = (voteCounts[v.generation_id] ?? 0) + v.value;
        if (user && v.user_id === user.id) {
            userVotes[v.generation_id] = v.value;
        }
    });
    return (<div className="page-container pb-20">
        <section className="flex flex-col gap-6 border-b border-line pb-8 pt-8 sm:flex-row sm:items-end sm:justify-between sm:pt-14">
            <div className="max-w-xl">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-amber-deep">Community caption feed</p>
                <h1 className="font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink sm:text-5xl">
                    Does the AI get the joke?
                </h1>
                <p className="mt-4 text-base leading-relaxed text-muted">
                    Google Gemini captions every photo here. You vote on whether the caption lands.
                </p>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                {user ? (
                    <Link href="/generate"
                          className="inline-flex h-11 items-center gap-2 rounded-control bg-amber px-5 text-sm font-semibold text-ink shadow-sm transition-colors hover:bg-amber-strong">
                        Caption a photo
                        <span aria-hidden="true">→</span>
                    </Link>
                ) : (<>
                    <SignInButton
                        className="inline-flex h-11 items-center gap-2 rounded-control bg-ink px-5 text-sm font-semibold text-paper transition-colors hover:bg-ink/85">
                        <GoogleIcon/>
                        Sign in to vote and post
                    </SignInButton>
                    <p className="text-xs text-muted">Browsing is open to everyone.</p>
                </>)}
            </div>
        </section>

        {feedError ? (
            <div role="alert" className="mt-10 rounded-card border border-down/20 bg-down-soft px-5 py-4 text-sm text-down">
                The feed couldn&apos;t be loaded right now. Refresh the page to try again.
            </div>
        ) : generations && generations.length > 0 ? (<>
            <p className="mt-6 text-sm text-muted">
                {generations.length} {generations.length === 1 ? 'caption' : 'captions'}, newest first
            </p>
            <ul className="mt-5 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {generations.map((gen) => (
                    <li key={gen.id}>
                        <CaptionCard gen={gen} author={authorsById.get(gen.user_id)} score={voteCounts[gen.id] ?? 0}
                                     userVote={userVotes[gen.id] ?? 0} isLoggedIn={!!user}/>
                    </li>
                ))}
            </ul>
        </>) : (
            <div className="mt-10 flex flex-col items-center rounded-card border border-dashed border-line-strong px-6 py-16 text-center">
                <p className="font-display text-2xl text-ink">The feed is empty</p>
                <p className="mt-2 max-w-sm text-sm text-muted">
                    No one has captioned a photo yet. {user ? 'Yours could be the first.' : 'Sign in to post the first one.'}
                </p>
                {user && (
                    <Link href="/generate"
                          className="mt-6 inline-flex h-11 items-center rounded-control bg-amber px-5 text-sm font-semibold text-ink transition-colors hover:bg-amber-strong">
                        Caption a photo
                    </Link>
                )}
            </div>
        )}
    </div>);
}
