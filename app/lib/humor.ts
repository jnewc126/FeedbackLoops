// The three caption styles. The key is what's stored in generations.humor_style.
export const HUMOR_STYLES = {
    dark: {
        label: 'Dark Humor',
        prompt: 'Write a darkly funny caption for this photo: deadpan, morbid or cynical, the kind of bleak one-liner a stand-up comedian would tell. Keep it witty rather than cruel: no slurs, no real tragedies, and never mock the people in the photo for who they are.',
    },
    light: {
        label: 'Light Hearted',
        prompt: 'Write a wholesome, light-hearted caption for this photo that would make anyone smile.',
    },
    punny: {
        label: 'Punny',
        prompt: 'Write a caption for this photo built around a clever pun or wordplay on what is in it. Groan-worthy is good.',
    },
} as const;

export type HumorStyle = keyof typeof HUMOR_STYLES;

export const HUMOR_STYLE_KEYS = Object.keys(HUMOR_STYLES) as HumorStyle[];

export function isHumorStyle(value: unknown): value is HumorStyle {
    return typeof value === 'string' && value in HUMOR_STYLES;
}

export function captionPrompt(style: HumorStyle) {
    return `${HUMOR_STYLES[style].prompt} Keep it under 20 words. Reply with only the caption.`;
}
