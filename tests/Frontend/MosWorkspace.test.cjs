const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');

global.route = name => `/${name}`;
const source = readFileSync(path.resolve(__dirname, '../../resources/js/Components/Articles/MosWorkspace.tsx'), 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions: {jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS}}).outputText;
const componentModule = {exports: {}};
const mockRequire = id => {
    if (id === 'axios') return {default: {get: async () => ({data: {data: []}}), patch: async () => ({}), delete: async () => ({})}};
    if (id === '@headlessui/react') return {
        Dialog: ({open, children}) => open ? React.createElement('div', {'data-testid': 'dialog'}, children) : null,
        DialogPanel: ({children, className}) => React.createElement('section', {className}, children),
        DialogTitle: ({children, className}) => React.createElement('h3', {className}, children),
    };
    if (id === '@heroicons/react/24/outline') return Object.fromEntries(['ChevronLeftIcon', 'ChevronRightIcon', 'PencilSquareIcon', 'ArrowPathIcon', 'XMarkIcon', 'PlayIcon', 'StopIcon'].map(name => [name, () => null]));
    if (id === '@/Components/Articles/ArticleMosContent') return {__esModule: true, default: ({objects, action}) => React.createElement('div', {className: 'mos-compact-value-row', 'data-testid': 'mos-values'}, React.createElement('span', null, objects.flatMap(object => object.editableObjects.map(field => field.value)).join(' ')), action)};
    if (id === '@/Components/Articles/mosSequence') return {orderMosSequence: (entries, objects) => entries.length
        ? entries.map((entry, index) => ({...entry, key: `row-${index}`, object: objects.find(object => object.objectKey === entry.object?.objectKey) || entry.object}))
        : objects.map((object, index) => ({kind: 'mos', key: `row-${index}`, object, snippet: ''}))};
    return require(id);
};
new Function('require', 'module', 'exports', compiled)(mockRequire, componentModule, componentModule.exports);

const article = {
    id: 42, playlist_id: 9, playlist_order: 3, title: 'Titlu sursă', subtitle: 'Titlu curent', technical_title: 'MOS_TEST',
    mos_objects: [{
        commandId: 'cmd-1', objectKey: 'obj-1', revision: 'rev-1', slug: '01_Titlu', editable: true,
        editableObjects: [{name: 'TITLU', value: 'Corectat local', fieldKey: 'field-title', isOverridden: true}],
    }],
    mos_timeline: [{kind: 'mos', position: 0, object: {commandId: 'cmd-1', objectKey: 'obj-1', slug: '01_Titlu'}, snippet: 'Fragmentul original'}],
};
const render = props => renderToStaticMarkup(React.createElement(componentModule.exports.MosWorkspace, {article, live: true, ...props}));

test('hiding OSCon controls preserves MOS values, local corrections, snippets and article navigation', () => {
    const html = render({
        showLBPortalControls: false,
    });

    assert.match(html, /Corectat local/);
    assert.match(html, /Editează corecțiile pentru 01_Titlu/);
    assert.match(html, /Fragmentul original/);
    assert.match(html, /Navigare articole MOS/);
    assert.match(html, /Articol MOS anterior/);
    assert.match(html, /Articol MOS următor/);
    assert.doesNotMatch(html, /OSCon|PLAY MOS|Setări/);
});

test('LB-Portal controls explain when settings have not been configured', () => {
    const html = render({lbPortalStatus: 'unconfigured'});
    assert.match(html, /aria-label="PLAY 01_Titlu către LB-Portal"/);
    assert.match(html, /class="mos-playback-icon" disabled=""/);
    assert.match(html, /Configurează IP-ul, portul și cheia LB-Portal/);
});

test('existing graphic PLAY button is enabled in live mode with a configured LB-Portal connection', () => {
    const html = render({live: true, lbPortalStatus: 'ready', onPlay: async () => {}});
    assert.match(html, /<button type="button" class="mos-playback-icon"(?! disabled)/);
    assert.doesNotMatch(html, /PLAY MOS → LB-Portal/);
    assert.doesNotMatch(html, /mos-profile-controls/);
    assert.equal((html.match(/class="mos-playback-icon"/g) || []).length, 1);
});

test('sending PLAY does not add a temporary status row above the MOS list', () => {
    const html = render({commandBusy: true, commandMessage: null, lbPortalStatus: 'ready'});
    assert.doesNotMatch(html, /Cererea se trimite către LB-Portal|role="status"/);
    assert.match(html, /class="mos-sequence"/);
    assert.match(html, /disabled=""/);
});

test('the last graphic accepted by LB-Portal receives the on-air card style', () => {
    const html = render({lastPlayedObjectKey: 'obj-1'});
    assert.match(html, /class="mos-override-card mos-override-card-on-air" data-last-played="true"/);
});

test('preparation-mode PLAY shows one shared alert and never sends the graphic', async () => {
    const objects = [
        {commandId: 'first', objectKey: 'first', slug: '05_Titlu', editableObjects: [{name: 'Titlu', value: 'Primul titlu', role: 'title'}]},
        {commandId: 'second', objectKey: 'second', slug: '06_Nume', editableObjects: [{name: 'Nume', value: 'Ana', role: 'value'}]},
    ];
    const prepArticle = {...article, mos_objects: objects, mos_timeline: []};
    const html = render({article: prepArticle, live: false, lbPortalStatus: 'ready'});
    assert.equal((html.match(/class="mos-playback-icon"/g) || []).length, 2);
    assert.equal((html.match(/Intră în modul LIVE pentru a trimite grafica\./g) || []).length, 0);
    assert.doesNotMatch(html, /class="mos-playback-icon" disabled=""/);

    let notices = 0;
    let sends = 0;
    assert.equal(await componentModule.exports.requestMosPlay(false, objects[0], async () => { sends++; return true; }, () => { notices++; }), false);
    assert.equal(notices, 1);
    assert.equal(sends, 0);
    assert.equal(await componentModule.exports.requestMosPlay(true, objects[0], async () => { sends++; return true; }, () => { notices++; }), true);
    assert.equal(sends, 1);
    assert.equal(notices, 1);
});

test('MOS cards omit graphic order numbers, show name snippets without a label and align square playback controls with values', () => {
    const person = {
        ...article,
        playlist_order: 2,
        mos_objects: [{
            commandId: 'person', objectKey: 'person', revision: 'rev-person', slug: '06_Nume_Ultima_Ora', editable: true,
            editableObjects: [{name: 'Nume', value: 'Ana Șerban', role: 'value', fieldKey: 'name'}],
        }],
        mos_timeline: [{kind: 'mos', position: 1, object: {commandId: 'person', objectKey: 'person', slug: '06_Nume_Ultima_Ora'}, snippet: 'Primele șapte cuvinte spuse de persoană'}],
    };
    const html = render({article: person, showLBPortalControls: false});

    assert.match(html, /#2 Titlu curent/);
    assert.doesNotMatch(html, /mos-sequence-position|>#1<\/span>/);
    assert.doesNotMatch(html, /<textarea|LOCAL|Corecții locale/);
    assert.match(html, /Editează corecțiile pentru 06_Nume_Ultima_Ora/);
    assert.doesNotMatch(html, /Primele 7 cuvinte:/);
    assert.match(html, /Primele șapte cuvinte spuse de persoană/);
    assert.match(html, /class="mos-speech-snippet"/);
    assert.match(html, /class="mos-graphic-tools"[\s\S]*06_Nume_Ultima_Ora[\s\S]*Editează corecțiile pentru 06_Nume_Ultima_Ora/);
    assert.match(html, /class="mos-compact-value-row"[\s\S]*Ana Șerban[\s\S]*class="mos-playback-icon"/);
    assert.match(html, /aria-label="PLAY 06_Nume_Ultima_Ora către LB-Portal"/);
    assert.match(html, /disabled=""/);
    assert.doesNotMatch(html, /Primele șapte cuvinte spuse de persoană…|„Primele șapte cuvinte/);
});

test('active and paused MOS graphics show Stop and Resume states without sending PLAY', () => {
    const objects = ['active', 'paused'].map((playbackState, index) => ({
        commandId: `command-${index}`, objectKey: `object-${index}`, revision: `rev-${index}`, slug: `template-${index}`, editable: false, playbackState,
        editableObjects: [{name: 'Titlu', value: `Titlu ${index}`, role: 'title'}],
    }));
    const activeArticle = {...article, mos_objects: objects, mos_timeline: []};
    const html = render({article: activeArticle, showLBPortalControls: false});

    assert.match(html, /aria-label="STOP template-0 către LB-Portal"/);
    assert.match(html, /aria-label="RESUME template-1 către LB-Portal"/);
});

test('empty graphic-only templates render with PLAY while VOX graphics stay hidden', () => {
    const graphicOnly = {
        commandId: 'impact', objectKey: 'impact', revision: 'rev-impact', slug: '09_impact_emotional', editable: false,
        editableObjects: [{name: 'Titlu', value: '  ', role: 'title'}],
    };
    const graphicArticle = {...article, mos_objects: [graphicOnly], mos_timeline: [{kind: 'mos', position: 1, object: graphicOnly, snippet: ''}]};
    const graphicHtml = render({article: graphicArticle, lbPortalStatus: 'ready', showLBPortalControls: false});

    assert.match(graphicHtml, /class="mos-graphic-only"[^>]*>.*09_impact_emotional.*class="mos-playback-icon"/s);
    assert.match(graphicHtml, /aria-label="PLAY 09_impact_emotional către LB-Portal"/);
    assert.match(graphicHtml, /class="mos-playback-icon"(?! disabled)/);

    const emptyGraphic = {
        commandId: 'vox-graphic', objectKey: 'vox-graphic', slug: '10_Vox', editable: false,
        editableObjects: [{name: 'Nume', value: 'Marta Kos', role: 'value'}],
    };
    const voxArticle = {
        ...article,
        mos_objects: [emptyGraphic],
        mos_timeline: [
            {kind: 'vox', position: 10, count: 2, object: null, snippet: ''},
        ],
    };
    const html = render({article: voxArticle, showLBPortalControls: false});

    assert.match(html, /class="mos-sequence-vox"[^>]*>.*2 VOX-uri/s);
    assert.doesNotMatch(html, /mos-override-card|10_Vox|mos-playback-icon/);
});
