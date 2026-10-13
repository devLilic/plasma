const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');

const source = readFileSync(path.resolve(__dirname, '../../resources/js/Components/Articles/LiveImageStage.tsx'), 'utf8');
const output = ts.transpileModule(source, {compilerOptions: {jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS}}).outputText;
const componentModule = {exports: {}};
const mockRequire = id => {
    if (id === '@/Components/UI/ImageWithLoader') return {__esModule: true, default: props => React.createElement('span', {className: `image-loader-frame ${props.containerClassName}`}, React.createElement('img', {src: props.src, alt: props.alt, className: props.className, style: props.style}))};
    if (id === '@/Components/Dialogs/ImageEditor/ImageEditorContent') return {__esModule: true, default: props => props.plasmaContent ?? React.createElement('div')};
    if (id === '@/Components/Articles/AdjacentArticleButton') return {__esModule: true, default: ({article, direction, disabled}) => {
        const title = article?.subtitle || article?.title || article?.technical_title || '';
        const thumbnail = article?.image?.thumbnailUrl ? React.createElement('span', {className: 'live-adjacent-thumbnail'}, React.createElement('span', {className: 'image-loader-frame'}, React.createElement('img', {src: article.image.thumbnailUrl, alt: ''}))) : null;
        return React.createElement('button', {type: 'button', className: `live-adjacent-article ${direction}`, disabled: disabled || !article, 'aria-label': `${direction === 'previous' ? 'Articol precedent' : 'Articol următor'}${title ? `: ${title}` : ''}`},
            direction === 'previous' && thumbnail,
            React.createElement('span', {className: 'live-adjacent-copy'}, React.createElement('small', null, direction === 'previous' ? 'PREV' : 'NEXT'), React.createElement('strong', null, article ? `#${article.playlist_order} ${title}` : direction === 'previous' ? 'Primul articol' : 'Ultimul articol')),
            direction === 'next' && thumbnail
        );
    }};
    if (id === '@/Utils/editorialText') return {introPreview: text => text};
    if (id === '@/Hooks/useActions') return {useActions: () => ({removeBackgroundImage: () => {}})};
    if (id === '@heroicons/react/24/outline') return {ArrowPathIcon: () => null, ChevronLeftIcon: () => null, ChevronRightIcon: () => null, EyeSlashIcon: () => null, PhotoIcon: () => null, SignalIcon: () => null};
    return require(id);
};
new Function('require', 'module', 'exports', output)(mockRequire, componentModule, componentModule.exports);

const renderStage = (active, zoom = 1, panX = 0, panY = 0, flipX = false) => renderToStaticMarkup(componentModule.exports.LiveImageStage({
    article: {id: 7, playlist_order: 2, title: 'Material', subtitle: 'Material', technical_title: 'MATERIAL', image: {id: 19, url: '/image.jpg'}},
    previousArticle: {id: 6, playlist_order: 1, title: 'Articol precedent', subtitle: 'Articol precedent', technical_title: 'PREVIOUS', image: {thumbnailUrl: '/previous-thumb.jpg'}},
    nextArticle: {id: 8, playlist_order: 3, title: 'Articol următor', subtitle: 'Articol următor', technical_title: 'NEXT', image: {thumbnailUrl: '/next-thumb.jpg'}},
    previousDisabled: true, nextDisabled: true, onPrevious: () => {}, onNext: () => {},
    viewer: active ? {visible: true, activeImage: {articleId: 7, imageId: 19, title: 'Material', url: '/image.jpg'}, transform: {}, error: null} : null,
    viewerBusy: false, viewerError: null, onRefreshViewer: () => {}, onShow: () => {}, onShowDefault: () => {}, onHide: () => {},
    transform: {brightness: 100, contrast: 100, saturation: 100, zoom, panX, panY, flipX}, onTransformChange: () => {},
}));

const renderStageWithoutImage = () => renderToStaticMarkup(componentModule.exports.LiveImageStage({
    article: {id: 7, playlist_order: 2, title: 'Material', subtitle: 'Material', technical_title: 'MATERIAL', intro: 'Primele detalii ale materialului.', image: null},
    previousDisabled: true, nextDisabled: true, onPrevious: () => {}, onNext: () => {},
    viewer: {visible: false, activeImage: null, defaultImage: {name: 'Studio.jpg', url: 'plasma-viewer-background://current/image?v=1'}, fr3: {transform: {brightness: 100, contrast: 100, saturation: 100, zoom: 1, panX: 0, panY: 0, flipX: false}}, transform: {}, error: null},
    viewerBusy: false, viewerError: null, onRefreshViewer: () => {}, onShow: () => {}, onShowDefault: () => {}, onHide: () => {},
    transform: {brightness: 100, contrast: 100, saturation: 100, zoom: 1, panX: 0, panY: 0, flipX: false}, onTransformChange: () => {},
}));

const getControl = (markup, label) => {
    const labelPosition = markup.indexOf(`>${label}</span>`);
    const start = markup.lastIndexOf('<label', labelPosition);
    const end = markup.indexOf('</label>', labelPosition) + '</label>'.length;
    return markup.slice(start, end);
};

test('places show and hide controls over the preview image according to on-air state', () => {
    const inactive = renderStage(false);
    const active = renderStage(true);

    assert.match(inactive, /class="live-preview-overlay-button"[^>]*>Afișează/);
    assert.match(active, /class="live-preview-overlay-button is-active"[^>]*>Ascunde imaginea/);
    assert.match(inactive, /aria-label="Răstoarnă imaginea pe orizontală"[^>]*><svg/);
    assert.doesNotMatch(inactive, /Afișează explicit|Ascunde explicit/);
    assert.doesNotMatch(inactive, /PREVIEW · NESENT|<span>Material<\/span>/);
    assert.match(inactive, /<h2 title="Material">#2 Material<\/h2>/);
    assert.match(inactive, /class="live-preview-layout"/);
    assert.match(inactive, /aria-label="Articol precedent: Articol precedent"/);
    assert.match(inactive, /aria-label="Articol următor: Articol următor"/);
    assert.match(inactive, /src="\/previous-thumb.jpg"/);
    assert.match(inactive, /src="\/next-thumb.jpg"/);
    const previousCard = inactive.indexOf('class="live-adjacent-article previous"');
    const nextCard = inactive.indexOf('class="live-adjacent-article next"');
    assert.ok(inactive.indexOf('src="/previous-thumb.jpg"', previousCard) < inactive.indexOf('#1 Articol precedent', previousCard));
    assert.ok(inactive.indexOf('#3 Articol următor', nextCard) < inactive.indexOf('src="/next-thumb.jpg"', nextCard));
    assert.doesNotMatch(inactive, /<button type="button" disabled="">PREV|<button type="button" disabled="">NEXT/);
    assert.match(inactive, /<div class="live-preview-adjustments"><div class="live-preview-adjustments-content">/);
    assert.doesNotMatch(inactive, /<details|Ajustări imagine/);
    assert.match(inactive, /class="live-transform-grid"/);
    assert.ok(inactive.includes('class="live-preview-image-wrap aspect-video bg-[#e9edf5]"'));
    assert.match(inactive, /class="live-preview-pan-transform" style="transform:translate\(0%, 0%\) scale\(1\)"/);
    assert.ok(inactive.indexOf('Poziție Y') < inactive.indexOf('Resetează transformarea'));

    const positions = ['Luminozitate', 'Contrast', 'Saturație', 'Zoom', 'Poziție X', 'Poziție Y'].map(label => inactive.indexOf(label));
    assert.ok(positions.every(position => position >= 0));
    assert.deepEqual(positions, [...positions].sort((left, right) => left - right));

    for (const label of ['Poziție X', 'Poziție Y']) {
        const control = getControl(inactive, label);
        assert.match(control, /class="live-transform-control is-disabled"/);
        assert.match(control, /disabled=""/);
        assert.doesNotMatch(control, /Mărește Zoom pentru a activa poziția/);
    }

    const zoomed = renderStage(false, 1.1);
    for (const label of ['Poziție X', 'Poziție Y']) {
        const control = getControl(zoomed, label);
        assert.match(control, /min="-5" max="5" step="0.05"/);
        assert.doesNotMatch(control, /disabled=/);
    }

    const flippedAndPanned = renderStage(false, 1.1, 5, -5, true);
    assert.match(flippedAndPanned, /class="live-preview-pan-transform" style="transform:translate\(5%, -5%\) scale\(1\.1\)"/);
    assert.match(flippedAndPanned, /class="absolute inset-0 block h-full w-full origin-center object-contain" style="filter:brightness\(100%\) contrast\(100%\) saturate\(100%\);transform:scaleX\(-1\)"/);
});

test('uses the PlasmaViewer default image for a playlist item without an assigned image', () => {
    const markup = renderStageWithoutImage();

    assert.match(markup, /src="\/plasma-viewer\/default-image"/);
    assert.match(markup, /alt="Imagine implicită PlasmaViewer: Studio\.jpg"/);
    assert.match(markup, /Imagine implicită PlasmaViewer · Studio\.jpg/);
    assert.match(markup, /class="live-preview-overlay-button"[^>]*>.*Afișează imaginea implicită/s);
    assert.match(markup, /aria-label="Intro pentru știre"/);
    assert.match(markup, /INTRO ȘTIRE/);
    assert.match(markup, /Primele detalii ale materialului\./);
    assert.doesNotMatch(markup, /live-transform-control/);
});
