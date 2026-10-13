/** Make ENPS spacing behave like ordinary editorial text, including old imports. */
export function normalizeEditorialText(text: string): string {
    return text.replace(/\\r\\n|\\n|\\r|\r\n|\r/g, '\n')
        .replace(/[\u00a0\u202f\u2007]/g, ' ')
        .replace(/[\u00ad\u200b\ufeff]/g, '')
        .replace(/[\u2028\u2029]/g, '\n');
}

export function introPreview(text: string): string {
    const normalized = normalizeEditorialText(text);
    const offIndex = normalized.search(/\bOFF\b/i);
    const introText = offIndex < 0 ? normalized : normalized.slice(0, offIndex);
    const lines = introText.split('\n');
    const boundary = lines.findIndex(line => {
        const label = line.trim();
        return /^(?:BETA|OFF|LIVE|SNC|SINCRON|AMB|TEASE|FAKE|TEXT)[ \t]*(?::|$)/i.test(label)
            || /^(?:BETA|OFF|LIVE|SNC|SINCRON|AMB|TEASE|FAKE|TEXT)[ \t]+/.test(label);
    });
    return lines.slice(0, boundary < 0 ? undefined : boundary).join(' ').replace(/\s+/g, ' ').trim();
}
