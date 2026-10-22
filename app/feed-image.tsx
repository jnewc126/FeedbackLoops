'use client';
import {useState} from 'react';

export default function FeedImage({src, alt}: { src: string; alt: string }) {
    const [failed, setFailed] = useState(false);
    if (failed) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-sunken text-faint">
                <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
                    <path fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                          d="M4 16l4.5-4.5a2 2 0 0 1 2.8 0L16 16m-2-2 1.5-1.5a2 2 0 0 1 2.8 0L20 14M4 6h16v12H4zM3 3l18 18"/>
                </svg>
                <span className="text-xs font-medium">Photo couldn&apos;t load</span>
            </div>
        );
    }
    return (
        <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)}
             className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"/>
    );
}
