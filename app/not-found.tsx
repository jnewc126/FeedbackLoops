import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="page-container pb-20 pt-16 sm:pt-24">
            <div className="mx-auto max-w-md text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-deep">Page not found</p>
                <h1 className="mt-3 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink sm:text-5xl">
                    This loop goes nowhere
                </h1>
                <p className="mt-4 text-base leading-relaxed text-muted">
                    The page you&apos;re looking for doesn&apos;t exist or has moved.
                </p>
                <Link href="/"
                      className="mt-8 inline-flex h-11 items-center gap-2 rounded-control bg-ink px-5 text-sm font-semibold text-paper transition-colors hover:bg-ink/85">
                    <span aria-hidden="true">←</span> Back to the feed
                </Link>
            </div>
        </div>
    );
}
