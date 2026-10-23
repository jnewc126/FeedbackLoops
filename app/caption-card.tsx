import VoteButtons from './vote-buttons';
import FeedImage from './feed-image';
import Avatar, {initialsFor} from './avatar';
import {cleanCaption} from './lib/caption';

const relativeTime = new Intl.RelativeTimeFormat('en', {numeric: 'auto'});
const fullDate = new Intl.DateTimeFormat('en', {dateStyle: 'medium', timeStyle: 'short'});

function timeAgo(iso: string) {
    const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
    const steps: [Intl.RelativeTimeFormatUnit, number][] = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
    for (const [unit, size] of steps) {
        if (Math.abs(seconds) >= size) return relativeTime.format(Math.round(seconds / size), unit);
    }
    return 'just now';
}

export type CaptionAuthor = { first_name: string | null; last_name: string | null; avatar_url: string | null };

// One photo and its AI caption, as shown in the feed and on the profile page.
export default function CaptionCard({gen, author, score, userVote, isLoggedIn}: {
    gen: { id: string; image_url: string; caption: string | null; created_at: string };
    author?: CaptionAuthor;
    score: number;
    userVote: number;
    isLoggedIn: boolean;
}) {
    const authorName = author ? [author.first_name, author.last_name].filter(Boolean).join(' ') : '';
    return (
        <article className="flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface shadow-sm transition-shadow hover:shadow-lift">
            <a href={gen.image_url} target="_blank" rel="noopener noreferrer"
               aria-label="Open full-size photo in a new tab"
               className="group block aspect-[3/2] overflow-hidden border-b border-line bg-sunken">
                <FeedImage src={gen.image_url}
                           alt={authorName ? `Photo submitted by ${authorName}` : 'Submitted photo'}/>
            </a>
            <div className="flex flex-1 flex-col p-4 sm:p-5">
                <blockquote className="font-display text-xl leading-snug text-ink">
                    {cleanCaption(gen.caption ?? '')}
                </blockquote>
                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                    <div className="flex min-w-0 items-center gap-2.5">
                        {authorName && (
                            <Avatar src={author?.avatar_url} size="md"
                                    initials={initialsFor(author?.first_name, author?.last_name)}/>
                        )}
                        <div className="min-w-0 leading-tight">
                            {authorName && (
                                <p className="truncate text-sm font-medium text-ink">{authorName}</p>
                            )}
                            <time dateTime={gen.created_at} title={fullDate.format(new Date(gen.created_at))}
                                  className="text-xs text-muted">
                                {timeAgo(gen.created_at)}
                            </time>
                        </div>
                    </div>
                    <VoteButtons generationId={gen.id} initialCount={score}
                                 initialUserVote={userVote} isLoggedIn={isLoggedIn}/>
                </div>
            </div>
        </article>
    );
}
