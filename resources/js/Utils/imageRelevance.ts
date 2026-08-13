import {Article, Image} from '@/types';

const normalize = (value: string): string => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const tokens = (value: string): string[] => [...new Set(normalize(value)
    .split(' ')
    .filter(word => word.length > 2 && !['beta', 'fake', 'intro', 'off', 'snc'].includes(word)))];

const relevanceScore = (image: Image, article: Article): number => {
    const terms = [article.title, article.subtitle].map(normalize).filter(Boolean);
    const articleTokens = new Set(terms.flatMap(tokens));

    return image.tags.reduce((total, tag) => {
        const normalizedTag = normalize(tag.title);
        if (!normalizedTag) return total;
        const tagTokens = tokens(normalizedTag);
        const commonWords = tagTokens.filter(word => articleTokens.has(word)).length;
        const phraseMatch = terms.some(term => term.includes(normalizedTag) || normalizedTag.includes(term));

        return total + (phraseMatch ? 100 + tagTokens.length * 10 : 0) + commonWords * 10;
    }, 0);
};

export const rankImagesForArticle = (images: Image[], article?: Article): Image[] => {
    if (!article) return images;

    return [...images].sort((left, right) => {
        const scoreDifference = relevanceScore(right, article) - relevanceScore(left, article);
        return scoreDifference || right.id - left.id;
    });
};
