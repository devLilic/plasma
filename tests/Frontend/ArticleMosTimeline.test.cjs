const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const root = path.resolve(__dirname, '../..');
function load(relative) {
    const modulePath = path.join(root, 'resources/js', relative);
    const file = [modulePath + '.tsx', modulePath + '.ts'].find(candidate => fs.existsSync(candidate));
    if (!file) throw new Error(`Unable to resolve ${relative}`);
    const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions: {jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS}}).outputText;
    const mod = {exports: {}};
    const localRequire = name => name === 'react-redux' ? {useDispatch: () => () => {}} : name === '@/Store/article/article.slice' ? {updateTextHighlight: () => {}} : name.startsWith('@/') ? load(name.slice(2)) : require(name);
    new Function('require', 'module', 'exports', compiled)(localRequire, mod, mod.exports);
    return mod.exports;
}
const Timeline = load('Components/Articles/ArticleMosTimeline').default;
const Text = load('Components/Articles/ArticleTextContent').default;
const graphic = {commandId: 'person', slug: '06_Nume_Ultima_Ora', editableObjects: [{name: 'NUME', value: 'ANA ȘERBAN', role: 'value'}, {name: 'FUNCTIE', value: 'reporter', role: 'value'}]};
const entries = [
    {kind: 'mos', position: 10, sourceLine: 1, count: null, object: graphic, snippet: 'Primele șapte cuvinte ale intervenției sunt aici'},
    {kind: 'vox', position: 80, sourceLine: 5, count: 2, object: null, snippet: ''},
    {kind: 'mos', position: 100, sourceLine: 8, count: null, object: graphic, snippet: 'A doua intervenție este aici'},
];
test('timeline retains each occurrence and order, showing seven-word previews and grouped VOX', () => {
    const html = renderToStaticMarkup(React.createElement(Timeline, {entries}));
    assert.deepEqual([...html.matchAll(/data-timeline-kind="(.*?)"/g)].map(match => match[1]), ['mos', 'vox', 'mos']);
    assert.equal((html.match(/ANA ȘERBAN/g) || []).length, 2);
    assert.ok(html.includes('2 VOX-uri'));
    assert.ok(html.includes('„Primele șapte cuvinte ale intervenției sunt aici…”'));
    assert.ok(!html.includes('NUME') && !html.includes('FUNCTIE'));
    assert.ok(html.indexOf('Primele șapte') < html.indexOf('2 VOX-uri') && html.indexOf('2 VOX-uri') < html.indexOf('A doua intervenție'));
});
test('unknown plural VOX does not invent a count; empty timeline explains no matches', () => {
    const html = renderToStaticMarkup(React.createElement(Timeline, {entries: [{...entries[1], count: null}]}));
    assert.ok(html.includes('VOX-uri'));
    assert.ok(!html.includes('1 VOX'));
    assert.ok(renderToStaticMarkup(React.createElement(Timeline, {entries: []})).includes('Niciun element MOS sau VOX identificat'));
});
test('text stays in the left column including full quotes; missing graphics supplied by the API also appear on the right', () => {
    const missing = {...graphic, commandId: 'missing', editableObjects: [{name: 'NUME', value: 'PERSOANĂ ABSENTĂ', role: 'value'}]};
    const article = {id: 1, content_sections: [{type: 'BETA', slug: '', paragraphs: ['Primele cinci cuvinte ale intervenției. Tot restul declarației rămâne aici.', 'A doua intervenție este aici. Continuarea rămâne integrală.']}], mos_timeline: [...entries, {kind: 'mos', position: null, sourceLine: null, count: null, object: missing, snippet: ''}], mos_objects: [graphic, missing]};
    const html = renderToStaticMarkup(React.createElement(Text, {article}));
    const columns = html.indexOf('data-text-mos-columns');
    const left = html.indexOf('data-script-text', columns);
    const right = html.indexOf('aria-label="MOS și VOX', left);
    assert.ok(columns > 0 && left > columns && right > left);
    const leftHtml = html.slice(left, right);
    assert.ok(leftHtml.includes('Tot restul declarației rămâne aici.'));
    assert.ok(leftHtml.includes('Continuarea rămâne integrală.'));
    assert.ok(leftHtml.includes('data-section-index="0" data-paragraph-index="0"'));
    assert.ok(!leftHtml.includes('06_Nume_Ultima_Ora'));
    assert.ok(html.slice(right).includes('PERSOANĂ ABSENTĂ'));
    assert.ok(!html.slice(right).includes('Începutul intervenției nu este indicat'));
    assert.equal((html.match(/data-speech-start/g) || []).length, 2);
});
test('last-hour titles keep the short title red in the same card and snippet text is escaped', () => {
    const object = {...graphic, slug: '05_Titlu_Ultima_Ora', editableObjects: [{name: 'Titlu', role: 'title', value: 'Titlul obișnuit'}, {name: 'Titlu scurt', role: 'short_title', value: 'Titlul scurt'}]};
    const html = renderToStaticMarkup(React.createElement(Timeline, {entries: [{...entries[0], object, snippet: '<script>alert(1)</script>'}]}));
    assert.equal((html.match(/mos-compact-mos-object/g) || []).length, 1);
    assert.ok(html.includes('data-mos-role="short_title" class="min-w-0 whitespace-pre-wrap break-words text-[14px] leading-[1.45] text-[#d62f28]'));
    assert.ok(html.includes('Titlul obișnuit') && html.includes('Titlul scurt'));
    assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
    assert.ok(!html.includes('<script>'));
});
