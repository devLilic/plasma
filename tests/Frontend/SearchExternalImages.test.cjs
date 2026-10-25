const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = readFileSync(path.resolve(__dirname, '../../resources/js/Components/ExternalImages/SearchExternalImages.tsx'), 'utf8');
const output = ts.transpileModule(source, {compilerOptions: {jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS}}).outputText;
const compiledModule = {exports: {}};
const mockRequire = id => {
    if (id === '@fortawesome/react-fontawesome') return {FontAwesomeIcon: () => null};
    if (id === '@fortawesome/free-brands-svg-icons') return {faGoogle: {}, faYandex: {}};
    return require(id);
};
new Function('require', 'module', 'exports', output)(mockRequire, compiledModule, compiledModule.exports);

test('Google image search URL preserves the existing image filters and encodes the selected term', () => {
    const url = new URL(compiledModule.exports.googleImagesSearchUrl('Știre de test & actualizare'));

    assert.equal(url.origin, 'https://www.google.com');
    assert.equal(url.pathname, '/search');
    assert.equal(url.searchParams.get('q'), 'Știre de test & actualizare');
    assert.equal(url.searchParams.get('tbm'), 'isch');
    assert.equal(url.searchParams.get('tbs'), 'isz:lt,islt:vga,iar:w');
});

test('Google image search opens in a separate tab without an extension bridge', () => {
    const openedTabs = [];
    const originalWindow = global.window;
    global.window = {
        open: (url, target, features) => {
            const opened = {url, target, features};
            openedTabs.push(opened);
            return opened;
        },
    };
    try {
        const opened = compiledModule.exports.openGoogleImagesSearch('test');
        const url = new URL(opened.url);
        assert.equal(url.searchParams.has('plasma_tab'), false);
        assert.deepEqual(openedTabs, [{url: opened.url, target: '_blank', features: 'noopener,noreferrer'}]);
    } finally {
        global.window = originalWindow;
    }
});
