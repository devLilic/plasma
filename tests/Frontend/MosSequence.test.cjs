const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = path.resolve(__dirname, '../../resources/js/Components/Articles/mosSequence.ts');
const code = ts.transpileModule(fs.readFileSync(source, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText;
const loaded = {exports: {}};
new Function('require', 'module', 'exports', code)(require, loaded, loaded.exports);
const {orderMosSequence} = loaded.exports;
const original = {commandId: 'title', objectKey: 'mos-a', slug: '05_Titlu_Ultima_Ora', editableObjects: [{name: 'Titlu', value: 'Importat', role: 'title'}]};
const locallyCorrected = {...original, editableObjects: [{...original.editableObjects[0], value: 'Corectat local'}]};
const unplaced = {commandId: 'person', objectKey: 'mos-b', slug: '06_Nume_Ultima_Ora', editableObjects: [{name: 'Nume', value: 'Ana', role: 'value'}]};

test('operator MOS sequence follows source order, shows each occurrence, and overlays saved values without a duplicate timeline', () => {
    const sequence = orderMosSequence([
        {kind: 'mos', position: 10, sourceLine: 1, count: null, object: original, snippet: 'Primele șapte cuvinte ale intervenției'},
        {kind: 'vox', position: 20, sourceLine: 4, count: 2, object: null, snippet: ''},
        {kind: 'mos', position: 30, sourceLine: 8, count: null, object: original, snippet: 'A doua intervenție începe cu alte cuvinte'},
    ], [locallyCorrected, unplaced]);
    assert.deepEqual(sequence.map(row => row.kind), ['mos', 'vox', 'mos', 'mos']);
    assert.equal(sequence[0].object.editableObjects[0].value, 'Corectat local');
    assert.equal(sequence[0].snippet, 'Primele șapte cuvinte ale intervenției');
    assert.equal(sequence[2].object.objectKey, 'mos-a');
    assert.equal(sequence[3].object.objectKey, 'mos-b');
    assert.equal(new Set(sequence.map(row => row.key)).size, sequence.length);
});
