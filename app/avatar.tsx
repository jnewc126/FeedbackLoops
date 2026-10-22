const sizes = {
    sm: 'h-7 w-7 text-[11px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-28 w-28 text-3xl',
};

export function initialsFor(firstName?: string | null, lastName?: string | null, fallback?: string | null) {
    const letters = `${firstName?.trim()[0] ?? ''}${lastName?.trim()[0] ?? ''}`;
    if (letters) return letters.toUpperCase();
    return fallback?.trim()[0]?.toUpperCase() ?? '';
}

export default function Avatar({src, initials, size = 'md'}: {
    src?: string | null;
    initials: string;
    size?: keyof typeof sizes;
}) {
    if (src) {
        return <img src={src} alt="" className={`${sizes[size]} shrink-0 rounded-full bg-sunken object-cover`}/>;
    }
    return (
        <span aria-hidden="true"
              className={`${sizes[size]} inline-flex shrink-0 items-center justify-center rounded-full bg-amber-soft font-semibold tracking-wide text-amber-deep`}>
            {initials}
        </span>
    );
}
