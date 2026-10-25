const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');

const source = readFileSync(path.resolve(__dirname, '../../resources/js/Components/Articles/ArticleMosContent.tsx'), 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions: {jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS}}).outputText;
const componentModule = {exports: {}};
new Function('require', 'module', 'exports', compiled)(require, componentModule, componentModule.exports);
const render = objects => renderToStaticMarkup(React.createElement(componentModule.exports.default, {objects}));
const renderCompact = objects => renderToStaticMarkup(React.createElement(componentModule.exports.default, {objects, compact: true}));

test('MOS displays the graphic type and ordered values without field labels', () => {
    const html = render([
        {commandId: 'name', slug: '06_Nume_Ultima_Ora', editableObjects: [{name: 'NUME', value: 'Ana Popescu', role: 'value'}, {name: 'FUNCTIE', value: 'redactor', role: 'value'}]},
        {commandId: 'title', slug: '01_Titlu', editableObjects: [{name: 'TITLU', value: 'Știrea zilei', role: 'title'}]},
    ]);
    const visibleText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    assert.equal(visibleText, 'Elemente MOS 06_Nume_Ultima_Ora Ana Popescu redactor 01_Titlu Știrea zilei');
});

test('MOS omits empty fields and objects without values', () => {
    assert.equal(render([{commandId: 'empty', slug: 'Empty', editableObjects: [{name: 'NUME', value: ' ', role: 'value'}]}]), '');
    const html = render([{commandId: 'name', slug: '06_Nume_Ultima_Ora', editableObjects: [{name: 'NUME', value: 'Ana', role: 'value'}, {name: 'FUNCTIE', value: ' ', role: 'value'}]}]);
    assert.equal(html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(), 'Elemente MOS 06_Nume_Ultima_Ora Ana');
});

test('compact MOS cards omit the repeated template name', () => {
    const html = renderCompact([{commandId: 'title', slug: '05_Titlu_Ultima_Ora', editableObjects: [{name: 'TITLU', value: 'Titlul știrii', role: 'title'}]}]);
    assert.ok(!html.includes('05_Titlu_Ultima_Ora'));
    assert.ok(html.includes('Titlul știrii'));
});

test('MOS values remain escaped text', () => {
    const html = render([{commandId: 'title', slug: '01_Titlu', editableObjects: [{name: 'TITLU', value: '<script>alert(1)</script>', role: 'title'}]}]);
    assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
    assert.ok(!html.includes('<script>'));
});

const displayedFields = html => [...html.matchAll(/<p data-mos-role="([^"]+)" class="([^"]+)">([^<]*)<\/p>/g)]
    .map(([, role, className, value]) => ({role, className, value}));

test('the two titles stay in one graphic card with only the short title in red', () => {
    const html = render([{commandId: 'two-titles', slug: '05_Titlu_Ultima_Ora', editableObjects: [
        {name: 'Titlu', role: 'title', value: 'Titlul obișnuit'},
        {name: 'Titlu scurt', role: 'short_title', value: 'Titlul scurt'},
    ]}]);
    const fields = displayedFields(html);
    assert.deepEqual(fields.map(({role, value}) => ({role, value})), [{role: 'short_title', value: 'Titlul scurt'}, {role: 'title', value: 'Titlul obișnuit'}]);
    assert.ok(fields[0].className.includes('text-[#d62f28]'));
    assert.ok(fields[1].className.includes('text-[#2c3443]'));
    assert.ok(!fields[1].className.includes('text-[#d62f28]'));
    assert.equal((html.match(/class="min-w-0 rounded-xl /g) || []).length, 1);
    assert.equal(html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(), 'Elemente MOS 05_Titlu_Ultima_Ora Titlul scurt Titlul obișnuit');
});

test('roles control color in source order across repeated and other graphic templates', () => {
    const html = render(['05_Titlu_Ultima_Ora', '05_Titlu_Ultima_Ora', 'Alta_Grafica'].map((slug, index) => ({commandId: `command-${index}`, slug, editableObjects: [
        {name: ' TITLU\u00a0  SCURT ', role: 'short_title', value: `Scurt ${index}`},
        {name: ' tItLu ', role: 'title', value: `Obișnuit ${index}`},
        {name: 'Functie', role: 'value', value: 'redactor'},
    ]})));
    const fields = displayedFields(html);
    assert.equal(fields.length, 9);
    for (let index = 0; index < 3; index++) {
        assert.equal(fields[index * 3].value, `Scurt ${index}`);
        assert.ok(fields[index * 3].className.includes('text-[#d62f28]'));
        assert.equal(fields[index * 3 + 1].value, `Obișnuit ${index}`);
        assert.ok(fields[index * 3 + 1].className.includes('text-[#2c3443]'));
        assert.ok(fields[index * 3 + 2].className.includes('text-[#2c3443]'));
    }
});

test('MOS function values use 12px while names and titles retain their existing size', () => {
    const html = renderCompact([{commandId: 'speaker', slug: '06_Nume_Ultima_Ora', editableObjects: [
        {name: 'NUME', role: 'value', value: 'Silvius Stanciu'},
        {name: 'Funcție', role: 'value', value: 'profesor universitar'},
        {name: 'TITLU', role: 'title', value: 'Titlul știrii'},
    ]}]);
    const fields = displayedFields(html);
    assert.ok(fields.find(field => field.value === 'profesor universitar').className.includes('text-[12px]'));
    assert.ok(fields.find(field => field.value === 'Silvius Stanciu').className.includes('text-[14px]'));
    assert.ok(fields.find(field => field.value === 'Titlul știrii').className.includes('text-[14px]'));
});

test('single title graphics and empty short titles keep the ordinary title styling', () => {
    for (const shortTitle of [[], [{name: 'Titlu scurt', role: 'short_title', value: ' '}], [{name: 'Titlu scurt', role: 'short_title', value: ''}]]) {
        const html = render([{commandId: 'title', slug: '01_Titlu', editableObjects: [{name: 'Titlu', role: 'title', value: 'Titlul obișnuit'}, ...shortTitle]}]);
        assert.equal(displayedFields(html).length, 1);
        assert.ok(!html.includes('text-[#d62f28]'));
        assert.ok(html.includes('sm:col-span-2'));
    }
});
