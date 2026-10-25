const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const file = path.join(root, 'resources/js/Components/Articles/operatorSelection.ts');
const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText;
const loaded = {exports: {}};
new Function('require', 'module', 'exports', compiled)(require, loaded, loaded.exports);
const {enterLiveMode, leaveLiveMode, selectPlaylistArticle} = loaded.exports;

test('first LIVE entry seeds preview and MOS cursors from the prepared article only', () => {
    const initial = {mode: 'preparation', hasEnteredLive: false, currentArticleId: 12, previewArticleId: 8, mosArticleId: 8};
    assert.deepEqual(enterLiveMode(initial), {
        mode: 'live', hasEnteredLive: true, currentArticleId: 12, previewArticleId: 12, mosArticleId: 12,
    });
});

test('LIVE playlist selection moves the image preview without moving MOS or prepared article', () => {
    const live = {mode: 'live', hasEnteredLive: true, currentArticleId: 12, previewArticleId: 12, mosArticleId: 4};
    assert.deepEqual(selectPlaylistArticle(live, 18), {...live, previewArticleId: 18});
});

test('PREP selection and mode switches preserve independent LIVE cursors after first entry', () => {
    const live = {mode: 'live', hasEnteredLive: true, currentArticleId: 12, previewArticleId: 18, mosArticleId: 4};
    const prep = leaveLiveMode(live);
    const selected = selectPlaylistArticle(prep, 20);
    assert.deepEqual(selected, {...prep, currentArticleId: 20});
    assert.deepEqual(enterLiveMode(selected), {...selected, mode: 'live'});
});

