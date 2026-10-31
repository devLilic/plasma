const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = readFileSync(path.resolve(__dirname, '../../resources/js/Components/Playlist/enpsPlaylistSearch.ts'), 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText;
const loadedModule = {exports: {}};
new Function('module', 'exports', compiled)(loadedModule, loadedModule.exports);
const {ENPS_PLAYLIST_QUICK_FILTERS, filterEnpsPlaylists} = loadedModule.exports;

test('ENPS quick filters contain the preset search values', () => {
    assert.deepEqual(ENPS_PLAYLIST_QUICK_FILTERS, ['1300', '1900', 'sport', 'weekend', 'Retrospectiva', 'Impact Global']);
});

test('ENPS playlist filtering is case-insensitive and matches titles partially', () => {
    const playlists = [
        {title: 'Jurnal 1300 Chișinău'},
        {title: 'SPORT — ediția de seară'},
        {title: 'Weekend: știri și evenimente'},
        {title: 'Retrospectivă 1900'},
        {title: 'RETROSPECTIVA săptămânii'},
        {title: 'Impact Global - ediția de duminică'},
    ];

    assert.deepEqual(filterEnpsPlaylists(playlists, '  sPoRt '), [playlists[1]]);
    assert.deepEqual(filterEnpsPlaylists(playlists, '1300'), [playlists[0]]);
    assert.deepEqual(filterEnpsPlaylists(playlists, '1900'), [playlists[3]]);
    assert.deepEqual(filterEnpsPlaylists(playlists, 'weekend'), [playlists[2]]);
    assert.deepEqual(filterEnpsPlaylists(playlists, 'Retrospectiva'), [playlists[4]]);
    assert.deepEqual(filterEnpsPlaylists(playlists, 'Impact Global'), [playlists[5]]);
    assert.deepEqual(filterEnpsPlaylists(playlists, '  '), playlists);
});
