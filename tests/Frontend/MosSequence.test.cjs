const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = path.resolve(__dirname, '../../resources/js/Components/Articles/mosSequence.ts');
const code = ts.transpileModule(fs.readFileSync(source, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText;
const loaded = {exports: {}};
new Function('require', 'module', 'exports', code)(require, loaded, loaded.exports);
const {orderMosSequence, moveMosSequenceRow} = loaded.exports;
const original = {commandId: 'title', objectKey: 'mos-a', slug: '05_Titlu_Ultima_Ora', editableObjects: [{name: 'Titlu', value: 'Importat', role: 'title'}]};
const locallyCorrected = {...original, editableObjects: [{...original.editableObjects[0], value: 'Corectat local'}]};
const unplaced = {commandId: 'person', objectKey: 'mos-b', slug: '06_Nume_Ultima_Ora', editableObjects: [{name: 'Nume', value: 'Ana', role: 'value'}]};

test('operator MOS sequence follows source order, shows each occurrence, and overlays saved values without a duplicate timeline', () => {
    const sequence = orderMosSequence([
        {kind: 'mos', position: 10, sourceLine: 1, count: null, object: original, snippet: 'Primele șapte cuvinte ale intervenției'},
        {kind: 'vox', position: 20, sourceLine: 4, count: 2, object: null, snippet: ''},
        {kind: 'mos', position: 30, sourceLine: 8, count: null, object: original, snippet: 'A doua intervenție începe cu alte cuvinte'},
        {kind: 'mos', position: null, sourceLine: null, count: null, object: unplaced, snippet: ''},
    ], [locallyCorrected, unplaced]);
    assert.deepEqual(sequence.map(row => row.kind), ['mos', 'vox', 'mos', 'mos']);
    assert.equal(sequence[0].object.editableObjects[0].value, 'Corectat local');
    assert.equal(sequence[0].snippet, 'Primele șapte cuvinte ale intervenției');
    assert.equal(sequence[2].object.objectKey, 'mos-a');
    assert.equal(sequence[3].object.objectKey, 'mos-b');
    assert.equal(new Set(sequence.map(row => row.key)).size, sequence.length);
});

test('repeated speaker commands create only the occurrences selected by the timeline', () => {
    const speakers = Array.from({length: 6}, (_, index) => ({
        commandId: `daniel-${index}`, objectKey: `speaker-${index}`, slug: '06_Nume_Ultima_Ora',
        editableObjects: [{name: 'Nume', value: 'Daniel Voda'}, {name: 'Functie', value: 'Reporter'}],
    }));
    const timeline = speakers.map((object, index) => ({kind: 'mos', position: index * 10, sourceLine: index, count: null, object, snippet: `Intervenția ${index + 1}`}));

    const sequence = orderMosSequence(timeline, speakers);
    assert.equal(sequence.length, 6);
    assert.deepEqual(sequence.map(row => row.snippet), timeline.map(entry => entry.snippet));
});

test('raw speaker equivalents do not multiply a timeline that contains only selected occurrences', () => {
    const speakers = Array.from({length: 6}, (_, index) => ({
        commandId: `cristina-${index}`, objectKey: `cristina-${index}`, slug: '06_Nume_Ultima_Ora',
        editableObjects: [{name: 'Nume', value: 'Cristina'}],
    }));
    const sequence = orderMosSequence([
        {kind: 'mos', position: 5, sourceLine: 0, count: null, object: speakers[0], snippet: 'Prima intervenție'},
        {kind: 'mos', position: 25, sourceLine: 2, count: null, object: speakers[1], snippet: 'A doua intervenție'},
    ], speakers);

    assert.equal(sequence.length, 2);
    assert.deepEqual(sequence.map(row => row.object.objectKey), ['cristina-0', 'cristina-1']);
});

test('objects without object keys and title members already represented by the timeline are not appended', () => {
    const anonymous = {commandId: 'anon', slug: '09_impact', editableObjects: [{name: 'Titlu', value: ''}]};
    const title = {commandId: 'title-group', objectKey: 'title-group', memberObjectKeys: ['title-a', 'title-b'], slug: '05_Titlu', editableObjects: [{name: 'Titlu', value: 'Titlu comun', role: 'title'}]};
    const titleMembers = [
        {commandId: 'title-a', objectKey: 'title-a', slug: '05_Titlu', editableObjects: [{name: 'Titlu', value: 'Titlu comun', role: 'title'}]},
        {commandId: 'title-b', objectKey: 'title-b', slug: '05_Titlu', editableObjects: [{name: 'Titlu', value: 'Titlu comun', role: 'title'}]},
    ];

    assert.equal(orderMosSequence([{kind: 'mos', position: 1, sourceLine: 0, count: null, object: anonymous, snippet: ''}], [anonymous]).length, 1);
    assert.equal(orderMosSequence([{kind: 'mos', position: 2, sourceLine: 1, count: null, object: title, snippet: ''}], titleMembers).length, 1);
});

test('distinct empty source commands with the same graphic slug both remain available', () => {
    const first = {commandId: 'empty-first', slug: '09_impact', editableObjects: [{name: 'Titlu', value: ''}]};
    const second = {commandId: 'empty-second', slug: '09_impact', editableObjects: [{name: 'Titlu', value: ''}]};
    const sequence = orderMosSequence([], [first, second]);

    assert.deepEqual(sequence.map(row => row.object.commandId), ['empty-first', 'empty-second']);
});

test('a backend-completed source command at the timeline tail is retained', () => {
    const located = {commandId: 'located', objectKey: 'located', slug: '05_Titlu', editableObjects: [{name: 'Titlu', value: 'Titlu'},]};
    const completed = {commandId: 'unlocated', objectKey: 'unlocated', slug: '09_impact', editableObjects: [{name: 'Titlu', value: 'Grafică unică'}]};
    const sequence = orderMosSequence([
        {kind: 'mos', position: 4, sourceLine: 0, count: null, object: located, snippet: ''},
        {kind: 'mos', position: null, sourceLine: null, count: null, object: completed, snippet: ''},
    ], [located, completed]);

    assert.deepEqual(sequence.map(row => row.object.commandId), ['located', 'unlocated']);
    assert.equal(sequence[1].object.slug, '09_impact');
});

test('ambiguous command IDs do not overlay the timeline with an arbitrary raw object', () => {
    const timelineObject = {commandId: 'collision', slug: 'source', editableObjects: [{name: 'Titlu', value: 'From timeline'}]};
    const objects = [
        {commandId: 'collision', slug: 'first', editableObjects: [{name: 'Titlu', value: 'First'}]},
        {commandId: 'collision', slug: 'second', editableObjects: [{name: 'Titlu', value: 'Second'}]},
    ];
    const sequence = orderMosSequence([{kind: 'mos', position: 1, sourceLine: 0, count: null, object: timelineObject, snippet: ''}], objects);

    assert.equal(sequence[0].object.slug, 'source');
    assert.equal(sequence[0].object.editableObjects[0].value, 'From timeline');
});

test('VOX templates stay excluded while backend-completed and graphic-only templates remain available', () => {
    const vox = {commandId: 'vox', slug: '10_Vox', editableObjects: [{name: 'Nume', value: 'Marta Kos'}]};
    const missing = {commandId: 'missing', objectKey: 'missing', slug: '06_Nume', editableObjects: [{name: 'Nume', value: 'Ana'}]};
    const graphicOnly = {commandId: 'empty', objectKey: 'empty', slug: '09_impact', editableObjects: [{name: 'Titlu', value: '  ', role: 'title'}]};
    const sequence = orderMosSequence([
        {kind: 'vox', position: 1, sourceLine: 0, count: 1, object: null, snippet: ''},
        {kind: 'mos', position: null, sourceLine: null, count: null, object: missing, snippet: ''},
    ], [vox, missing, graphicOnly]);

    assert.deepEqual(sequence.map(row => row.kind), ['vox', 'mos', 'mos']);
    assert.deepEqual(sequence.slice(1).map(row => row.object.commandId), ['missing', 'empty']);
    assert.deepEqual(orderMosSequence([], [vox, missing, graphicOnly]).map(row => row.object.commandId), ['empty']);
});

test('an omitted legacy timeline still falls back to the original MOS objects', () => {
    const sequence = orderMosSequence(undefined, [original, unplaced]);
    assert.deepEqual(sequence.map(row => row.object.commandId), ['title', 'person']);
});

test('repeated graphic occurrences have stable independent keys and saved order reconciles against changed source rows', () => {
    const repeated = {commandId: 'speaker', objectKey: 'speaker-key', slug: '02_Nume', editableObjects: [{name: 'Nume', value: 'Ion'}]};
    const another = {commandId: 'other', objectKey: 'other-key', slug: '02_Nume', editableObjects: [{name: 'Nume', value: 'Elena'}]};
    const timeline = [
        {kind: 'mos', position: 1, sourceLine: 0, count: null, object: repeated, snippet: 'Ion 1'},
        {kind: 'mos', position: 2, sourceLine: 1, count: null, object: another, snippet: 'Elena 1'},
        {kind: 'mos', position: 3, sourceLine: 2, count: null, object: repeated, snippet: 'Ion 2'},
    ];
    const sequence = orderMosSequence(timeline, [repeated, another]);

    assert.deepEqual(sequence.map(row => row.key), ['mos:speaker-key:1', 'mos:other-key:1', 'mos:speaker-key:2']);
    const restored = orderMosSequence(timeline.slice(0, 2), [repeated, another], ['mos:speaker-key:2', 'stale-entry', 'mos:other-key:1']);
    assert.deepEqual(restored.map(row => row.key), ['mos:other-key:1', 'mos:speaker-key:1']);
});

test('dragging one repeated MOS occurrence across the divider marks only that occurrence manually positioned', () => {
    const repeated = {commandId: 'speaker', objectKey: 'speaker-key', slug: '02_Nume', editableObjects: [{name: 'Nume', value: 'Ion'}]};
    const entries = [
        {kind: 'mos', position: 1, sourceLine: 0, count: null, object: repeated, snippet: 'Ion 1'},
        {kind: 'mos', position: null, sourceLine: null, count: null, object: repeated, snippet: ''},
        {kind: 'mos', position: 3, sourceLine: 2, count: null, object: repeated, snippet: 'Ion 2'},
    ];
    const sequence = orderMosSequence(entries, [repeated]);
    const moved = moveMosSequenceRow(sequence, 'mos:speaker-key:2', 'mos:speaker-key:1', 'before');

    assert.deepEqual(moved.map(row => row.key), ['mos:speaker-key:2', 'mos:speaker-key:1', 'mos:speaker-key:3']);
    assert.equal(moved[0].zone, 'before');
    assert.equal(moved[0].manuallyPositioned, true);
    assert.equal(moved[1].manuallyPositioned, false);
});
