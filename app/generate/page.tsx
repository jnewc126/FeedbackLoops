import type {Metadata} from 'next';
import {redirect} from 'next/navigation';
import Link from 'next/link';
import {GoogleIcon, SignInButton} from '../auth-button';
import {getViewer} from '../lib/viewer';
import GenerateForm from './generate-form';

export const metadata: Metadata = {
    title: 'Caption a photo',
};


export default async function GeneratePage() {
    const viewer = await getViewer();
    if (viewer && (!viewer.firstName || !viewer.lastName)) {
        redirect('/complete-profile');
    }
    return (
        <div className="page-container pb-20">
            <div className="mx-auto max-w-2xl pt-8 sm:pt-12">
                <Link href="/"
                      className="-ml-1 mb-4 inline-flex items-center gap-1 rounded-control px-1 text-sm font-medium text-muted transition-colors hover:text-ink">
                    <span aria-hidden="true">←</span> Back to the feed
                </Link>
                <h1 className="mb-6 font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
                    Caption a photo
                </h1>
                {viewer ? (
                    <GenerateForm/>
                ) : (
                    <section aria-label="Sign in required"
                             className="flex flex-col items-center justify-center rounded-card border border-dashed border-line-strong bg-surface px-6 py-16 text-center">
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
