'use client';
import {useEffect, useId, useRef, useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import Avatar, {initialsFor} from './avatar';
import type {Viewer} from './lib/viewer';

const items = [
    {href: '/', label: 'Feed', icon: 'M3.5 5.5h13M3.5 10h13M3.5 14.5h8'},
    {href: '/generate', label: 'Generate', icon: 'M10 4.5v11M4.5 10h11'},
    {href: '/profile', label: 'Your profile', icon: 'M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.5 6.5a5.5 5.5 0 0 1 11 0'},
];

function MenuIcon({d}: { d: string }) {
    return (
        <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-faint group-hover:text-ink group-focus-visible:text-ink"
             aria-hidden="true">
            <path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d={d}/>
        </svg>
    );
}

// The signed-in header is just the avatar. Hovering, clicking or tapping it opens the account menu.
export default function AccountMenu({viewer, onSignOut, signingOut}: {
    viewer: Viewer;
    onSignOut: () => void;
    signingOut: boolean;
}) {
    const pathname = usePathname();
    const menuId = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
    // The menu remembers which page it was opened on, so navigating anywhere closes it.
    const [openOn, setOpenOn] = useState<string | null>(null);
    const open = openOn === pathname;
    const setOpen = (next: boolean) => setOpenOn(next ? pathname : null);
    const name = [viewer.firstName, viewer.lastName].filter(Boolean).join(' ') || viewer.email || 'Your account';

    const menuItems = () => [...(rootRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const focusItem = (index: number) => {
        const all = menuItems();
        all[(index + all.length) % all.length]?.focus();
    };

    // Close when clicking or tapping anywhere outside the menu.
    useEffect(() => {
        if (!open) return;
        const onPointerDown = (e: PointerEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) setOpenOn(null);
        };
        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [open]);
    useEffect(() => () => clearTimeout(closeTimer.current), []);

    // Hover only applies to a real mouse; touch screens open the menu with a tap instead.
    const onPointerEnter = (e: React.PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        clearTimeout(closeTimer.current);
        setOpen(true);
    };
    const onPointerLeave = (e: React.PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        closeTimer.current = setTimeout(() => setOpen(false), 150);
    };

    const onButtonKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            setOpen(true);
            requestAnimationFrame(() => focusItem(e.key === 'ArrowDown' ? 0 : -1));
        }
    };
    const onMenuKeyDown = (e: React.KeyboardEvent) => {
        const all = menuItems();
        const current = all.indexOf(document.activeElement as HTMLElement);
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            focusItem(current + 1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            focusItem(current - 1);
        } else if (e.key === 'Home') {
            e.preventDefault();
            focusItem(0);
        } else if (e.key === 'End') {
            e.preventDefault();
            focusItem(-1);
        } else if (e.key === 'Escape') {
            setOpen(false);
            buttonRef.current?.focus();
        } else if (e.key === 'Tab') {
            setOpen(false);
        }
    };

    const itemClass = 'group flex w-full items-center gap-3 rounded-control px-3 py-2 text-left text-sm font-medium text-ink transition-colors hover:bg-sunken focus-visible:bg-sunken focus-visible:outline-none';

    return (
        <div ref={rootRef} className="relative" onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
            <button ref={buttonRef} type="button" aria-haspopup="menu" aria-expanded={open} aria-controls={menuId}
                    onClick={() => setOpen(!open)} onKeyDown={onButtonKeyDown}
                    className={`flex items-center gap-1 rounded-full p-0.5 transition-shadow hover:ring-2 hover:ring-line-strong ${open ? 'ring-2 ring-line-strong' : ''}`}>
                <span className="sr-only">Account menu for {name}</span>
                <Avatar src={viewer.avatarUrl} initials={initialsFor(viewer.firstName, viewer.lastName, viewer.email)}/>
            </button>

            {/* The pt-2 bridge keeps the menu open while the mouse travels from the avatar into it. */}
            <div className={`absolute right-0 top-full z-30 pt-2 transition duration-150 ease-out ${open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0'}`}>
                <div id={menuId} role="menu" aria-label="Account" onKeyDown={onMenuKeyDown}
                     className="w-60 rounded-card border border-line bg-surface p-1.5 shadow-lift">
                    <div className="border-b border-line px-3 pb-3 pt-2">
                        <p className="truncate text-sm font-semibold text-ink">{name}</p>
                        {viewer.email && <p className="truncate text-xs text-muted">{viewer.email}</p>}
                    </div>
                    <div className="py-1.5">
                        {items.map((item) => {
                            const active = pathname === item.href;
                            return (
                                <Link key={item.href} href={item.href} role="menuitem" tabIndex={open ? 0 : -1}
                                      aria-current={active ? 'page' : undefined}
                                      onClick={() => setOpen(false)}
                                      className={`${itemClass} ${active ? 'bg-amber-soft/60' : ''}`}>
                                    <MenuIcon d={item.icon}/>
                                    {item.label}
                                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber" aria-hidden="true"/>}
                                </Link>
                            );
                        })}
                    </div>
                    <div className="border-t border-line pt-1.5">
                        <button type="button" role="menuitem" tabIndex={open ? 0 : -1} onClick={onSignOut}
                                disabled={signingOut} className={`${itemClass} disabled:opacity-50`}>
                            <MenuIcon d="M8 4H5.5A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8M13 13.5 16.5 10 13 6.5M16.5 10H8"/>
                            {signingOut ? 'Signing out…' : 'Sign out'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
