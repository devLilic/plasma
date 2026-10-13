const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');

const compile = relativePath => {
    const source = readFileSync(path.resolve(__dirname, relativePath), 'utf8');
    const output = ts.transpileModule(source, {compilerOptions: {jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS}}).outputText;
    const module = {exports: {}};
    new Function('require', 'module', 'exports', output)(require, module, module.exports);
    return module.exports;
};

const {introPreview} = compile('../../resources/js/Utils/editorialText.ts');
const source = readFileSync(path.resolve(__dirname, '../../resources/js/Components/Articles/ArticleWorkspace.tsx'), 'utf8');
const output = ts.transpileModule(source, {compilerOptions: {jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS}}).outputText;
const componentModule = {exports: {}};
const mockRequire = id => {
    if (id === '@/Components/Articles/ArticleTypeBadge') return {__esModule: true, default: ({type}) => React.createElement('span', null, type)};
    if (id === '@/Components/Dialogs/ImageEditor/ImageEditorContent') return {__esModule: true, default: () => React.createElement('div', {'data-image-editor': true})};
    if (id === '@/Components/Articles/AdjacentArticleButton') return {__esModule: true, default: ({article, direction, disabled}) => React.createElement('button', {'data-direction': direction, disabled}, article?.subtitle || (direction === 'previous' ? 'Primul articol' : 'Ultimul articol'))};
    if (id === '@/Components/UI/ImageWithLoader') return {__esModule: true, default: props => React.createElement('div', {className: props.containerClassName}, React.createElement('img', {alt: props.alt, className: props.className}))};
    if (id === '@/Components/Articles/ArticleTextContent' || id === '@/Components/Articles/ArticleMosContent') return {__esModule: true, default: () => React.createElement('div')};
    if (id === '@/Hooks/useActions') return {useActions: () => ({removeBackgroundImage: () => {}})};
    if (id === '@/Utils/editorialText') return {introPreview};
    return require(id);
};
new Function('require', 'module', 'exports', output)(mockRequire, componentModule, componentModule.exports);

test('preparation workspace shows the intro only up to the OFF marker', () => {
    const article = {
        id: 17, playlist_order: 4, article_type: 'OFF', article_types: ['OFF'],
        title: 'MD ȘTIRE', subtitle: 'Știre de test', technical_title: 'MD_STIRE', intro: 'Intro cu informația principală.\nA doua propoziție.\nOFF\nTextul de după marker.',
        image: null, content_sections: [], mos_objects: [],
    };
    const element = componentModule.exports.default({
        article, activeTab: 'image', onTabChange: () => {}, onOpenOnAir: () => {}, onDelete: () => {}, operatorMode: true,
    });
    const html = renderToStaticMarkup(element);

    assert.match(html, /data-operator-intro/);
    assert.match(html, /Intro cu informația principală\. A doua propoziție\./);
    assert.doesNotMatch(html, /Textul de după marker/);
});

test('operator intro stops at an inline OFF marker and leaves OFFICIAL intact', () => {
    assert.equal(
        introPreview('Impact emoțional. OFF Potrivit poliției, text care nu trebuie afișat.'),
        'Impact emoțional.'
    );
    assert.equal(
        introPreview('OFFICIAL nu este un marker. Aici rămâne textul intro.'),
        'OFFICIAL nu este un marker. Aici rămâne textul intro.'
    );
});

test('operator image fills its card and the remove control overlays the image', () => {
    const article = {
        id: 18, playlist_order: 1, article_type: 'INTRO', article_types: ['INTRO'],
        title: 'Material test', subtitle: 'Material test', technical_title: 'MATERIAL_TEST', intro: 'Intro de test.',
        image: {id: 42, url: '/image.jpg', thumbnailUrl: '/thumb.jpg', tags: [{id: 3, title: 'Etichetă test'}]}, content_sections: [], mos_objects: [],
    };
    const element = componentModule.exports.default({
        article, activeTab: 'image', onTabChange: () => {}, onOpenOnAir: () => {}, onDelete: () => {}, operatorMode: true,
    });
    const html = renderToStaticMarkup(element);
    const cardClass = html.match(/class="(relative mx-auto grid max-w-4xl[^"]*)"/);
    const imageClass = html.match(/class="([^"]*w-full overflow-hidden[^"]*)"/);

    assert.ok(cardClass);
    assert.match(cardClass[1], /overflow-hidden/);
    assert.doesNotMatch(cardClass[1], /\bp-4\b/);
    assert.ok(imageClass);
    assert.doesNotMatch(imageClass[1], /rounded-2xl/);
    assert.match(imageClass[1], /\bh-full\b/);
    assert.match(html, /class="h-full w-full object-cover"/);
    assert.match(html, /<div class="article-image-preview relative h-full">[\s\S]*aria-label="Elimină legătura cu imaginea"[\s\S]*?<\/div>/);
    assert.equal((html.match(/h-6 w-px bg-\[#71809a\]\/20/g) || []).length, 0);

    const editorHtml = renderToStaticMarkup(componentModule.exports.default({
        article, activeTab: 'image', onTabChange: () => {}, onOpenOnAir: () => {}, onDelete: () => {},
    }));
    assert.equal((editorHtml.match(/h-6 w-px bg-\[#71809a\]\/20/g) || []).length, 2);
});

test('operator image and intro appear side by side when an article already has an image', () => {
    const article = {
        id: 19, playlist_order: 2, article_type: 'BETA', article_types: ['BETA'],
        title: 'Material test', subtitle: 'Material test', technical_title: 'MATERIAL_TEST', intro: 'Intro în partea dreaptă.',
        image: {id: 42, url: '/image.jpg', thumbnailUrl: '/thumb.jpg', tags: [{id: 3, title: 'Etichetă test'}]}, content_sections: [], mos_objects: [],
    };
    const element = componentModule.exports.default({
        article, activeTab: 'image', onTabChange: () => {}, onOpenOnAir: () => {}, onDelete: () => {}, operatorMode: true,
    });
    const html = renderToStaticMarkup(element);
    assert.match(html, /class="relative mx-auto grid max-w-4xl[^\"]*grid-cols-1 overflow-hidden md:grid-cols-\[minmax\(220px,0\.8fr\)_minmax\(0,1\.2fr\)\]/);
    assert.match(html, /class="article-image-preview relative h-full"/);
    assert.match(html, /absolute inset-x-3 bottom-3 z-10 flex flex-wrap gap-1\.5/);
    assert.match(html, /Etichetă test/);
    assert.match(html, /data-operator-intro="" aria-label="Intro pentru știre"/);
    assert.match(html, /Intro în partea dreaptă\./);
    assert.ok(html.indexOf('class="article-image-preview relative h-full"') < html.indexOf('data-operator-intro=""'));
    assert.equal((html.match(/data-operator-intro/g) || []).length, 1);
});

test('preparation navigation appears after the intro preview and before image source tabs', () => {
    const article = {
        id: 19, playlist_order: 2, article_type: 'BETA', article_types: ['BETA'],
        title: 'Material test', subtitle: 'Material curent', technical_title: 'MATERIAL_TEST', intro: 'Intro pentru articolul curent.',
        image: {id: 42, url: '/image.jpg', thumbnailUrl: '/thumb.jpg', tags: []}, content_sections: [], mos_objects: [],
    };
    const adjacentArticle = {...article, id: 20, playlist_order: 3, subtitle: 'Articol următor'};
    const html = renderToStaticMarkup(componentModule.exports.default({
        article, previousArticle: article, nextArticle: adjacentArticle, activeTab: 'image', onTabChange: () => {},
        onOpenOnAir: () => {}, onDelete: () => {}, operatorMode: true,
    }));

    const introPosition = html.indexOf('Intro pentru articolul curent.');
    const navigationPosition = html.indexOf('data-operator-navigation');
    const tabsPosition = html.indexOf('data-image-editor');
    assert.ok(introPosition >= 0 && navigationPosition > introPosition);
    assert.ok(tabsPosition > navigationPosition);
    assert.match(html, /Articol următor/);
});
