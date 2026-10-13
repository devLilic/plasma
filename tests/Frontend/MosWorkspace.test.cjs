const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');

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
        showOsconControls: false,
        profiles: [{id: 8, template: '01_Titlu', group: 'principal', params: ['TITLU']}],
        groups: [{id: 'principal', state: 'STOPPED'}], osconStatus: 'connected',
    });

    assert.match(html, /Corectat local/);
    assert.match(html, /Editează corecțiile pentru 01_Titlu/);
    assert.match(html, /Fragmentul original/);
    assert.match(html, /Navigare articole MOS/);
    assert.match(html, /Articol MOS anterior/);
    assert.match(html, /Articol MOS următor/);
    assert.doesNotMatch(html, /Conectează OSCon/);
    assert.doesNotMatch(html, /Profil OSCon|Mapare parametri OSCon|PLAY MOS|STOP profil|01_Titlu · principal/);
});

test('OSCon controls remain enabled by default for standalone MOS workspace use', () => {
    const html = render({osconStatus: 'unchecked'});
    assert.match(html, /Conectează OSCon pentru a citi profilele configurate/);
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
    const html = render({article: person, showOsconControls: false});

    assert.match(html, /#2 Titlu curent/);
    assert.doesNotMatch(html, /mos-sequence-position|>#1<\/span>/);
    assert.doesNotMatch(html, /<textarea|LOCAL|Corecții locale/);
    assert.match(html, /Editează corecțiile pentru 06_Nume_Ultima_Ora/);
    assert.doesNotMatch(html, /Primele 7 cuvinte:/);
    assert.match(html, /Primele șapte cuvinte spuse de persoană/);
    assert.match(html, /class="mos-speech-snippet"/);
    assert.match(html, /class="mos-graphic-tools"[\s\S]*06_Nume_Ultima_Ora[\s\S]*Editează corecțiile pentru 06_Nume_Ultima_Ora/);
    assert.match(html, /class="mos-compact-value-row"[\s\S]*Ana Șerban[\s\S]*class="mos-playback-icon"/);
    assert.match(html, /aria-label="PLAY 06_Nume_Ultima_Ora"/);
    assert.match(html, /disabled=""/);
    assert.doesNotMatch(html, /Primele șapte cuvinte spuse de persoană…|„Primele șapte cuvinte/);
});

test('active and paused MOS graphics present Stop and Resume stubs', () => {
    const objects = ['active', 'paused'].map((playbackState, index) => ({
        commandId: `command-${index}`, objectKey: `object-${index}`, revision: `rev-${index}`, slug: `template-${index}`, editable: false, playbackState,
        editableObjects: [{name: 'Titlu', value: `Titlu ${index}`, role: 'title'}],
    }));
    const activeArticle = {...article, mos_objects: objects, mos_timeline: []};
    const html = render({article: activeArticle, showOsconControls: false});

    assert.match(html, /aria-label="STOP template-0"/);
    assert.match(html, /aria-label="RESUME template-1"/);
});

test('empty MOS graphics from VOX segments are hidden while yellow VOX markers stay visible', () => {
    const emptyGraphic = {
        commandId: 'empty-vox-graphic', objectKey: 'empty-vox-graphic', slug: 'VOX_Graphic', editable: false,
        editableObjects: [{name: 'Nume', value: '   ', role: 'value'}],
    };
    const voxArticle = {
        ...article,
        mos_objects: [emptyGraphic],
        mos_timeline: [
            {kind: 'vox', position: 10, count: 2, object: null, snippet: ''},
            {kind: 'mos', position: null, count: null, object: emptyGraphic, snippet: ''},
        ],
    };
    const html = render({article: voxArticle, showOsconControls: false});

    assert.match(html, /class="mos-sequence-vox"[^>]*>.*2 VOX-uri/s);
    assert.doesNotMatch(html, /mos-override-card|VOX_Graphic|mos-playback-icon/);
});
