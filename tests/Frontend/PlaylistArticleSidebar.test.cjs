const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');

const source = readFileSync(path.resolve(__dirname, '../../resources/js/Components/Articles/PlaylistArticleSidebar.tsx'), 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions: {jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS}}).outputText;
const componentModule = {exports: {}};
const mockRequire = id => {
    if (id === '@/Components/Articles/ArticleTypeBadge') return {__esModule: true, default: ({type}) => React.createElement('span', null, type)};
    if (id === '@/Components/UI/ImageWithLoader') return {__esModule: true, default: () => React.createElement('img')};
    return require(id);
};
new Function('require', 'module', 'exports', compiled)(mockRequire, componentModule, componentModule.exports);

const findElement = (node, predicate) => {
    if (Array.isArray(node)) {
        for (const child of node) {
            const found = findElement(child, predicate);
            if (found) return found;
        }
        return null;
    }
    if (!node || typeof node !== 'object') return null;
    if (predicate(node)) return node;
    const children = node.props?.children;
    for (const child of Array.isArray(children) ? children : [children]) {
        const found = findElement(child, predicate);
        if (found) return found;
    }
    return null;
};

test('sidebar keeps badges in order, hides INTRO and places first insertion beside the first row', () => {
    const article = {id: 17, playlist_order: 1, article_type: 'BETA', article_types: ['INTRO', 'BETA', 'OFF'], title: 'Știrea întâi', technical_title: '01_BETA', subtitle: 'Știrea întâi', enps_marker_color: 'green'};
    let firstInsertions = 0;
    const afterInsertions = [];
    const mosSelections = [];
    const props = {
        articles: [article], playlistTitle: 'Playlist cu un titlu editorial foarte lung pentru verificarea împachetării în bara laterală',
        currentId: 17, onSelect: () => {}, onSelectMos: id => mosSelections.push(id), onPreview: () => {}, onAddFirst: () => firstInsertions++, onAddAfter: item => afterInsertions.push(item),
    };
    const element = componentModule.exports.default(props);
    const html = renderToStaticMarkup(element);
    assert.ok(html.includes(props.playlistTitle));
    assert.ok(html.includes('Conținut aprobat în ENPS'));
    assert.ok(!html.includes('INTRO'));
    assert.ok(html.indexOf('BETA') < html.indexOf('OFF'));
    assert.match(html, /playlist-sidebar-list[^\"]*pb-3 pt-3/);

    const firstButton = findElement(element, node => node.type === 'button' && node.props['aria-label'] === 'Adaugă material la începutul playlistului');
    const afterButton = findElement(element, node => node.type === 'button' && node.props['aria-label'] === 'Adaugă material după Știrea întâi');
    const mosButton = findElement(element, node => node.type === 'button' && node.props['aria-label'] === 'Selectează MOS pentru Știrea întâi');
    assert.ok(firstButton);
    assert.ok(afterButton);
    assert.ok(mosButton);
    assert.equal(mosButton.props['aria-pressed'], false);
    assert.match(firstButton.props.className, /absolute -top-2\.5 left-5/);
    assert.match(firstButton.props.className, /hidden .*group-hover:flex group-focus-within:flex/);
    assert.equal((html.match(/aria-label="Adaugă material la începutul playlistului"/g) || []).length, 1);
    firstButton.props.onClick();
    afterButton.props.onClick();
    mosButton.props.onClick();
    assert.equal(firstInsertions, 1);
    assert.deepEqual(afterInsertions, [article]);
    assert.deepEqual(mosSelections, [17]);
});

test('first insertion action remains available for an empty playlist', () => {
    let firstInsertions = 0;
    const element = componentModule.exports.default({
        articles: [], playlistTitle: 'Playlist gol', currentId: 0, onSelect: () => {}, onSelectMos: () => {}, onPreview: () => {},
        onAddFirst: () => firstInsertions++, onAddAfter: () => {},
    });
    const button = findElement(element, node => node.type === 'button' && node.props['aria-label'] === 'Adaugă material la începutul playlistului');
    assert.ok(button);
    assert.match(button.props.className, /flex h-7 w-7/);
    button.props.onClick();
    assert.equal(firstInsertions, 1);
});

test('active playlist badges use concise Plasma and MOS labels', () => {
    const element = componentModule.exports.default({
        articles: [{id: 17, playlist_order: 1, article_type: 'BETA', article_types: ['BETA'], title: 'Știrea întâi', technical_title: '01_BETA', subtitle: 'Știrea întâi'}],
        playlistTitle: 'Playlist', currentId: 17, previewId: 17, viewerActiveArticleId: 17, mosArticleId: 17,
        onSelect: () => {}, onSelectMos: () => {}, onPreview: () => {}, onAddFirst: () => {}, onAddAfter: () => {},
    });
    const html = renderToStaticMarkup(element);
    assert.match(html, />Plasma<\/span>/);
    assert.match(html, />MOS<\/span>/);
    assert.doesNotMatch(html, />Preview<\/span>/);
    assert.doesNotMatch(html, />(?:Plasma|MOS) activ<\/span>/);
});
