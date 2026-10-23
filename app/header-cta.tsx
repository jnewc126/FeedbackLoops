'use client';
import {useEffect, useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';

// A compact "Caption a photo" button that slides into the header once the
// homepage's own button (#intro-cta) has scrolled out of view.
export default function HeaderCta() {
    const pathname = usePathname();
    // Remembers which page the button was hidden on, so navigating away resets it.
    const [hiddenOn, setHiddenOn] = useState<string | null>(null);
    const show = hiddenOn === pathname;
    useEffect(() => {
        const target = document.getElementById('intro-cta');
        if (!target) return;
        // Treat the area under the 64px sticky header as off-screen.
        const observer = new IntersectionObserver(([entry]) => setHiddenOn(entry.isIntersecting ? null : pathname), {rootMargin: '-64px 0px 0px 0px'});
        observer.observe(target);
        return () => observer.disconnect();
    }, [pathname]);
    if (!show) return null;
    return (
        <Link href="/generate" aria-label="Caption a photo"
              className="inline-flex h-9 animate-[cta-in_200ms_ease-out] items-center gap-1.5 rounded-control bg-amber px-2.5 text-sm font-semibold text-ink shadow-sm transition-colors hover:bg-amber-strong sm:px-4">
            <svg viewBox="0 0 20 20" className="h-4 w-4 sm:hidden" aria-hidden="true">
                <path fill="currentColor" d="M10 4a1 1 0 0 1 1 1v4h4a1 1 0 1 1 0 2h-4v4a1 1 0 1 1-2 0v-4H5a1 1 0 1 1 0-2h4V5a1 1 0 0 1 1-1Z"/>
            </svg>
            <span className="hidden sm:inline">Caption a photo</span>
        </Link>
    );
}
