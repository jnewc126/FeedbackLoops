import type {Metadata} from 'next';
import {redirect} from 'next/navigation';
import Link from 'next/link';
import {GoogleIcon, SignInButton} from '../auth-button';
import {getViewer} from '../lib/viewer';
import GenerateForm from './generate-form';

export const metadata: Metadata = {
    title: 'Caption a photo',
};

const steps = [
    {title: 'Add a photo', body: 'Anything with a story in it: a pet, a street scene, a questionable lunch.'},
    {title: 'Gemini writes a caption', body: 'Google’s model looks at the photo and tries to be funny in under 20 words.'},
    {title: 'The community votes', body: 'Your photo goes into the public feed, where people decide if the caption landed.'},
];

export default async function GeneratePage() {
    const viewer = await getViewer();
    if (viewer && (!viewer.firstName || !viewer.lastName)) {
        redirect('/complete-profile');
    }
    return (
        <div className="page-container pb-20">
            <div className="grid gap-10 pt-8 sm:pt-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
                <section aria-labelledby="generate-title" className="lg:pt-2">
                    <Link href="/"
                          className="-ml-1 mb-6 inline-flex items-center gap-1 rounded-control px-1 text-sm font-medium text-muted transition-colors hover:text-ink">
                        <span aria-hidden="true">←</span> Back to the feed
                    </Link>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-amber-deep">New caption</p>
                    <h1 id="generate-title"
                        className="font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink sm:text-5xl">
                        Caption a photo
                    </h1>
                    <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
                        Upload a photo and see what the AI makes of it. Then let everyone else be the judge.
                    </p>
                    <ol className="mt-10 hidden max-w-md border-t border-line lg:block">
                        {steps.map((step, i) => (
                            <li key={step.title} className="flex gap-4 border-b border-line py-5">
                                <span
                                    className="w-4 shrink-0 font-display text-lg leading-6 text-amber-deep tabular-nums">{i + 1}</span>
                                <div>
                                    <p className="text-sm font-semibold text-ink">{step.title}</p>
                                    <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </section>

                {viewer ? (
                    <GenerateForm/>
                ) : (
                    <section aria-label="Sign in required"
                             className="flex flex-col items-center justify-center self-start rounded-card border border-dashed lg:aspect-[4/3] border-line-strong bg-surface px-6 py-16 text-center">
                        <p className="font-display text-2xl text-ink">Sign in to caption a photo</p>
                        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
                            Posting needs an account so your photos and votes are yours. Browsing the feed stays open to
                            everyone.
                        </p>
                        <SignInButton
                            className="mt-6 inline-flex h-11 items-center gap-2 rounded-control bg-ink px-5 text-sm font-semibold text-paper transition-colors hover:bg-ink/85">
                            <GoogleIcon/>
                            Sign in with Google
                        </SignInButton>
                    </section>
                )}
            </div>
        </div>
    );
}
