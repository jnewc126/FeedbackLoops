import {createClient as createServerClient} from './lib/supabase/server';
import {redirect} from 'next/navigation';
import Link from 'next/link';
import CaptionCard from './caption-card';
import {GoogleIcon, SignInButton} from './auth-button';
import {getViewer} from './lib/viewer';
import {HUMOR_STYLES, HUMOR_STYLE_KEYS, isHumorStyle} from './lib/humor';

export default async function Home({searchParams}: PageProps<'/'>) {
    const {style: styleParam} = await searchParams;
    const style = isHumorStyle(styleParam) ? styleParam : null;
    const supabase = await createServerClient();
    const user = await getViewer();
    if (user && (!user.firstName || !user.lastName)) {
        redirect('/complete-profile');
    }
    let feedQuery = supabase.from('generations').select('id, user_id, image_url, caption, prompt, created_at').order('created_at', {ascending: false});
    // Captions made before humor styles existed have no style, so they only appear under "All".
    if (style) feedQuery = feedQuery.eq('humor_style', style);
    const {data: generations, error: feedError} = await feedQuery;
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
        <section className="flex flex-col gap-4 border-b border-line py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
            <h1 className="font-display text-2xl font-medium leading-tight tracking-tight text-ink sm:text-3xl">
                See if AI can make a funny joke of your picture <span aria-hidden="true" className="text-amber">→</span>
            </h1>
            {/* The header shows a compact copy of this button once it scrolls out of view. */}
            <div id="intro-cta" className="w-full sm:min-w-56 sm:max-w-md sm:flex-1">
                {user ? (
                    <Link href="/generate"
                          className="flex h-14 w-full items-center justify-center gap-2 rounded-card bg-amber px-6 text-base font-semibold whitespace-nowrap lg:text-lg text-ink shadow-sm transition-colors hover:bg-amber-strong">
                        Caption a photo
                    </Link>
                ) : (
                    <SignInButton
                        className="flex h-14 w-full items-center justify-center gap-2.5 rounded-card bg-ink px-6 text-base font-semibold whitespace-nowrap lg:text-lg text-paper transition-colors hover:bg-ink/85">
                        <GoogleIcon/>
                        Sign in to vote and post
                    </SignInButton>
                )}
            </div>
        </section>

        {feedError ? (
            <div role="alert" className="mt-10 rounded-card border border-down/20 bg-down-soft px-5 py-4 text-sm text-down">
                The feed couldn&apos;t be loaded right now. Refresh the page to try again.
            </div>
        ) : (<>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <nav aria-label="Filter by humor style"
                     className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 sm:pb-0">
                    {[{key: null, label: 'All'}, ...HUMOR_STYLE_KEYS.map((key) => ({key, label: HUMOR_STYLES[key].label}))].map(({key, label}) => {
                        const active = style === key;
                        return (
                            <Link key={label} href={key ? `/?style=${key}` : '/'} scroll={false}
                                  aria-current={active ? 'page' : undefined}
                                  className={`inline-flex h-9 shrink-0 items-center rounded-control px-3.5 text-sm font-semibold transition-colors ${active ? 'bg-ink text-paper' : 'text-muted hover:bg-sunken hover:text-ink'}`}>
                                {label}
                            </Link>
                        );
                    })}
                </nav>
                <p className="text-sm text-muted">
                    {generations?.length ?? 0} {generations?.length === 1 ? 'caption' : 'captions'}, newest first
                </p>
            </div>
        </>)}

        {!feedError && generations && generations.length > 0 ? (<>
            <ul className="mt-3 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {generations.map((gen) => (
                    <li key={gen.id}>
                        <CaptionCard gen={gen} author={authorsById.get(gen.user_id)} score={voteCounts[gen.id] ?? 0}
                                     userVote={userVotes[gen.id] ?? 0} isLoggedIn={!!user}/>
                    </li>
                ))}
            </ul>
        </>) : !feedError && style ? (
            <div className="mt-6 flex flex-col items-center rounded-card border border-dashed border-line-strong px-6 py-16 text-center">
                <p className="font-display text-2xl text-ink">No {HUMOR_STYLES[style].label} captions yet</p>
                <p className="mt-2 max-w-sm text-sm text-muted">
                    {user ? 'Caption a photo in this style and it will show up here.' : 'Check back soon, or see all captions.'}
                </p>
                <Link href="/" className="mt-6 text-sm font-semibold text-ink underline decoration-amber decoration-2 underline-offset-4">
                    See all captions
                </Link>
            </div>
        ) : !feedError && (
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
