import Link from 'next/link';
import AuthButton from './auth-button';
import NavLink from './nav-link';
import HeaderCta from './header-cta';
import {getViewer} from './lib/viewer';

export function BrandMark({className = 'h-6 w-6'}: { className?: string }) {
    // A loop that doesn't quite close, with the amber dot as the next round of feedback.
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
            <path d="M19.5 12a7.5 7.5 0 1 1-3.2-6.15" fill="none" stroke="currentColor" strokeWidth="2.4"
                  strokeLinecap="round"/>
            <circle cx="19.2" cy="6.6" r="2.4" className="fill-amber"/>
        </svg>
    );
}

export default async function SiteHeader() {
    const viewer = await getViewer();
    return (
        <header className="sticky top-0 z-20 border-b border-line/80 bg-paper/90 backdrop-blur-md">
            <div className="page-container flex h-16 items-center justify-between gap-3">
                <Link href="/" className="flex items-center gap-2 rounded-control text-ink">
                    <BrandMark/>
                    <span className="font-display text-lg font-semibold tracking-tight sm:text-xl">Can AI be Funny?</span>
                </Link>
                <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
                    {!viewer && (
                        <NavLink href="/" activeClassName="text-ink underline decoration-amber decoration-2 underline-offset-[6px]"
                                 className="hidden rounded-control px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink sm:block">
                            Feed
                        </NavLink>
                    )}
                    {viewer && <HeaderCta/>}
                    <AuthButton viewer={viewer}/>
                </nav>
            </div>
        </header>
    );
}
