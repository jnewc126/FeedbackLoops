// Gemini often wraps its caption in quote marks; the design adds its own emphasis.
export function cleanCaption(caption: string) {
    return caption.trim().replace(/^["“']([\s\S]*)["”']$/, '$1').trim();
}
