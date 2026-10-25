const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');

global.route = name => `/${name}`;
const source = readFileSync(path.resolve(__dirname, '../../resources/js/Components/Articles/LiveImageStage.tsx'), 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions: {jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS}}).outputText;
const componentModule = {exports: {}};
const mockRequire = id => {
    if (id === '@heroicons/react/24/outline') return Object.fromEntries(['ArrowPathIcon', 'EyeSlashIcon', 'SignalIcon'].map(name => [name, () => null]));
    if (id === '@/Components/UI/ImageWithLoader') return {__esModule: true, default: () => React.createElement('img')};
    if (id === '@/Components/Dialogs/ImageEditor/ImageEditorContent') return {__esModule: true, default: ({plasmaContent, internetContent}) => React.createElement(React.Fragment, null,
        React.createElement('section', {'data-testid': 'plasma'}, plasmaContent),
        React.createElement('section', {'data-testid': 'internet'}, internetContent))};
    if (id === '@/Components/Articles/AdjacentArticleButton') return {__esModule: true, default: () => null};
    if (id === '@/Utils/editorialText') return {introPreview: text => text.replace(/^INTRO\s*/i, '')};
    return require(id);
};
new Function('require', 'module', 'exports', compiled)(mockRequire, componentModule, componentModule.exports);

test('LIVE story intro is added to Internet while PlasmaViewer preview remains unchanged', () => {
    const article = {
        id: 7, playlist_order: 2, title: 'Știre', subtitle: 'Subiect', technical_title: 'SUBIECT',
        intro: 'INTRO Deficitul comercial a crescut în primele luni ale anului.',
        image: {id: 3, url: '/image', thumbnailUrl: '/thumbnail', tags: []},
    };
    const html = renderToStaticMarkup(React.createElement(componentModule.exports.LiveImageStage, {
        article, previousDisabled: true, nextDisabled: true, onPrevious: () => {}, onNext: () => {},
        viewer: null, viewerBusy: false, viewerError: null, onRefreshViewer: () => {}, onShow: () => {},
        onShowDefault: () => {}, onHide: () => {}, transform: {brightness: 100, contrast: 100, saturation: 100, zoom: 1, panX: 0, panY: 0, flipX: false}, onTransformChange: () => {},
    }));
    const plasma = html.split('<section data-testid="plasma">')[1].split('</section>')[0];
    const internet = html.split('<section data-testid="internet">')[1].split('</section>')[0];
    assert.doesNotMatch(plasma, /INTRO ȘTIRE|Deficitul comercial/);
    assert.match(internet, /INTRO ȘTIRE/);
    assert.match(internet, /Deficitul comercial a crescut în primele luni ale anului\./);
});
