'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';

// A header link that marks itself as the current page for sighted and screen-reader users alike.
export default function NavLink({href, className, activeClassName, children}: {
    href: string;
    className: string;
    activeClassName: string;
    children: React.ReactNode;
}) {
    const active = usePathname() === href;
    return (
        <Link href={href} aria-current={active ? 'page' : undefined} className={`${className} ${active ? activeClassName : ''}`}>
            {children}
        </Link>
    );
}
