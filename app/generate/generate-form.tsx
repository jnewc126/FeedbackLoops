'use client';
import {useEffect, useId, useRef, useState} from 'react';
import Link from 'next/link';
import {cleanCaption} from '../lib/caption';
import {prepareImage} from '../lib/prepare-image';
import {HUMOR_STYLES, HUMOR_STYLE_KEYS, type HumorStyle} from '../lib/humor';

type Status = 'idle' | 'ready' | 'generating' | 'done';

function PhotoIcon({className}: { className: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
            <path fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  d="M4 16.5 8.5 12a2 2 0 0 1 2.8 0l4.7 4.7m-2-2 1.3-1.3a2 2 0 0 1 2.8 0L20 15.3M5.5 19.5h13a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5h-13A1.5 1.5 0 0 0 4 6v12a1.5 1.5 0 0 0 1.5 1.5ZM14.5 9h.01"/>
        </svg>
    );
}

export default function GenerateForm() {
    const inputId = useId();
    const errorId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [status, setStatus] = useState<Status>('idle');
    const [preparing, setPreparing] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [error, setError] = useState('');
    const [caption, setCaption] = useState('');
    const [style, setStyle] = useState<HumorStyle>('light');

    // Release the old preview's memory whenever it changes or the page unmounts.
    useEffect(() => {
        if (!preview) return;
        return () => URL.revokeObjectURL(preview);
    }, [preview]);

    const choose = async (selected: File | undefined) => {
        if (!selected) return;
        setError('');
        setCaption('');
        if (!selected.type.startsWith('image/')) {
            setError('That file isn’t a photo. Choose a JPG, PNG or WebP image.');
            return;
        }
        setPreparing(true);
        try {
            const prepared = await prepareImage(selected);
            setFile(prepared);
            setPreview(URL.createObjectURL(prepared));
            setStatus('ready');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'That photo couldn’t be opened.');
        } finally {
            setPreparing(false);
        }
    };

    const reset = () => {
        setFile(null);
        setPreview(null);
        setCaption('');
        setError('');
        setStatus('idle');
        if (inputRef.current) inputRef.current.value = '';
    };

    const generate = async () => {
        if (!file) return;
        setStatus('generating');
        setError('');
        const formData = new FormData();
        formData.append('image', file);
        formData.append('style', style);
        try {
            const res = await fetch('/api/generate', {method: 'POST', body: formData});
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(res.status === 401
                    ? 'Your session expired. Sign in again to post.'
                    : json.error ?? 'Something went wrong. Try again in a moment.');
                setStatus('ready');
                return;
            }
            setCaption(cleanCaption(json.generation.caption ?? ''));
            setStatus('done');
        } catch {
            setError('Couldn’t reach the server. Check your connection and try again.');
            setStatus('ready');
        }
    };

    const fileInput = (
        <input ref={inputRef} id={inputId} type="file" accept="image/*" className="sr-only"
               aria-describedby={error ? errorId : undefined}
               disabled={preparing || status === 'generating'}
               onChange={(e) => choose(e.target.files?.[0])}/>
    );

    const stylePicker = (
        <fieldset className="mb-4" disabled={status === 'generating'}>
            <legend className="sr-only">Humor style</legend>
            <div className="grid grid-cols-3 gap-1 rounded-card border border-line bg-surface p-1">
                {HUMOR_STYLE_KEYS.map((key) => (
                    <label key={key}
                           className={`flex h-11 cursor-pointer items-center justify-center rounded-control px-2 text-center text-sm font-semibold transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-amber ${style === key ? 'bg-ink text-paper' : 'text-muted hover:bg-sunken hover:text-ink'}`}>
                        <input type="radio" name="humor-style" value={key} checked={style === key}
                               onChange={() => setStyle(key)} className="sr-only"/>
                        {HUMOR_STYLES[key].label}
                    </label>
                ))}
            </div>
        </fieldset>
    );

    return (
        <section aria-label="Caption workspace" className="min-w-0">
            {!preview && stylePicker}
            {!preview ? (
                <label htmlFor={inputId}
                       onDragOver={(e) => {
                           e.preventDefault();
                           setDragging(true);
                       }}
                       onDragLeave={() => setDragging(false)}
                       onDrop={(e) => {
                           e.preventDefault();
                           setDragging(false);
                           choose(e.dataTransfer.files?.[0]);
                       }}
                       className={`flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed px-6 text-center transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-amber ${dragging ? 'border-amber bg-amber-soft' : 'border-line-strong bg-surface hover:border-faint hover:bg-sunken/50'}`}>
                    {fileInput}
                    <span
                        className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${dragging ? 'bg-surface text-amber-deep' : 'bg-sunken text-muted'}`}>
                        <PhotoIcon className="h-7 w-7"/>
                    </span>
                    <span className="font-display text-xl text-ink sm:text-2xl">
                        {preparing ? 'Getting your photo ready…' : dragging ? 'Drop it here' : 'Add a photo'}
                    </span>
                    <span className="mt-2 text-sm text-muted">
                        <span className="hidden sm:inline">Drag it here, or </span>
                        <span className="font-semibold text-ink underline decoration-amber decoration-2 underline-offset-4">
                            <span className="sm:hidden">Tap to choose</span>
                            <span className="hidden sm:inline">choose</span> one from your device
                        </span>
                    </span>
                    <span className="mt-5 text-xs text-muted">JPG, PNG or WebP. Large photos are resized automatically.</span>
                </label>
            ) : (
                <figure className="m-0">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-sunken ring-1 ring-line">
                        <img src={preview} alt="Your selected photo"
                             className={`h-full w-full object-cover transition-[filter,opacity] duration-500 ${status === 'generating' ? 'opacity-70 saturate-50' : ''}`}/>
                        {status === 'generating' && (
                            <div role="status" className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-ink/75 px-4 py-3 text-sm font-medium text-paper backdrop-blur-sm">
                                <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-paper/30 border-t-amber"
                                      aria-hidden="true"/>
                                Gemini is studying your photo…
                            </div>
                        )}
                    </div>

                    {status === 'done' ? (
                        <figcaption className="pt-5">
                            <blockquote className="font-display text-2xl leading-snug text-ink sm:text-3xl">
                                {caption}
                            </blockquote>
                            <p role="status" className="mt-4 flex items-center gap-2 text-sm text-up">
                                <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                                    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                          strokeLinejoin="round" d="m5 10.5 3.2 3L15 6.5"/>
                                </svg>
                                Posted to the community feed
                            </p>
                            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                <Link href="/"
                                      className="inline-flex h-11 items-center justify-center gap-2 rounded-control bg-amber px-5 text-sm font-semibold text-ink shadow-sm transition-colors hover:bg-amber-strong">
                                    See it in the feed <span aria-hidden="true">→</span>
                                </Link>
                                <button type="button" onClick={reset}
                                        className="inline-flex h-11 items-center justify-center rounded-control border border-line-strong bg-surface px-5 text-sm font-semibold text-ink transition-colors hover:border-faint">
                                    Caption another photo
                                </button>
                            </div>
                        </figcaption>
                    ) : (
                        <div className="pt-5">
                        {stylePicker}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                {fileInput}
                                <p className="truncate text-sm font-medium text-ink">{file?.name}</p>
                                <label htmlFor={inputId}
                                       className={`text-sm text-muted underline decoration-line-strong underline-offset-4 transition-colors focus-within:outline-2 focus-within:outline-amber ${status === 'generating' ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:text-ink hover:decoration-ink'}`}>
                                    Choose a different photo
                                </label>
                            </div>
                            <button type="button" onClick={generate} disabled={status === 'generating'}
                                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-control bg-amber px-5 text-sm font-semibold text-ink shadow-sm transition-colors hover:bg-amber-strong disabled:cursor-wait disabled:opacity-60">
                                {status === 'generating' ? 'Writing caption…' : 'Write a caption'}
                            </button>
                        </div>
                        </div>
                    )}
                </figure>
            )}

            {error && (
                <p id={errorId} role="alert"
                   className="mt-4 rounded-control border border-down/20 bg-down-soft px-4 py-3 text-sm text-down">
                    {error}
                </p>
            )}
        </section>
    );
}
