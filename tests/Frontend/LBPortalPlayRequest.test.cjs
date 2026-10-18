const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

test('MOS PLAY sends template and editable values when randomUUID is unavailable', async t => {
    const state = [];
    let stateIndex = 0;
    let connectionEffect;
    const react = {
        useState(initial) {
            const index = stateIndex++;
            if (!(index in state)) state[index] = initial;
            return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
        },
        useEffect(effect) { connectionEffect = effect; },
        useCallback(callback) { return callback; },
    };
    const source = readFileSync(path.resolve(__dirname, '../../resources/js/Components/Articles/useLBPortalController.ts'), 'utf8');
    const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText;
    const module = {exports: {}};
    const mockRequire = id => id === 'react' ? react : require(id);
    new Function('require', 'module', 'exports', compiled)(mockRequire, module, module.exports);

    const originalCrypto = Object.getOwnPropertyDescriptor(global, 'crypto');
    Object.defineProperty(global, 'crypto', {configurable: true, value: {getRandomValues: bytes => { bytes.forEach((_, index) => { bytes[index] = index; }); return bytes; }}});
    t.after(() => {
        if (originalCrypto) Object.defineProperty(global, 'crypto', originalCrypto);
        else delete global.crypto;
    });

    global.route = name => `/${name}`;
    global.window = global;
    const sent = [];
    global.fetch = async (url, options = {}) => {
        if (url === '/lb-portal.connection') return {ok: true, status: 200, json: async () => ({endpoint: 'http://192.168.1.50:47835', accessKey: 'a'.repeat(64), timeoutMs: 5000})};
        const payload = JSON.parse(options.body);
        sent.push({url, options, payload});
        return {ok: true, status: 200, json: async () => ({requestId: payload.requestId, execution: {status: 'completed', sectionId: 'section-a', onAir: true}})};
    };

    stateIndex = 0;
    module.exports.useLBPortalController();
    connectionEffect();
    await new Promise(resolve => setImmediate(resolve));
    stateIndex = 0;
    const controller = module.exports.useLBPortalController();
    const object = {commandId: 'cmd-1', objectKey: 'mos-1', revision: 'rev-3', slug: '05_Titlu', editableObjects: [
        {name: 'Titlu', type: 'text', role: 'title', value: 'Titlu corectat'},
        {name: 'Titlu scurt', type: 'text', role: 'short_title', value: 'Scurt'},
    ]};
    const accepted = await controller.sendPlay(object);

    assert.equal(sent.length, 1);
    assert.equal(sent[0].url, 'http://192.168.1.50:47835/v1/requests');
    assert.equal(sent[0].options.headers.Authorization, `Bearer ${'a'.repeat(64)}`);
    assert.match(sent[0].payload.requestId, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    assert.equal(sent[0].payload.type, 'mos-play');
    assert.equal(sent[0].payload.template, '05_Titlu');
    assert.deepEqual(sent[0].payload.params, {'Titlu': 'Titlu corectat', 'Titlu scurt': 'Scurt'});
    assert.deepEqual(Object.keys(sent[0].payload).sort(), ['params', 'requestId', 'source', 'template', 'type']);
    assert.equal('sentAt' in sent[0].payload, false);
    assert.equal('fields' in sent[0].payload, false);
    assert.equal('article' in sent[0].payload, false);
    assert.equal('mos' in sent[0].payload, false);
    assert.equal(accepted, true);
    assert.equal(state[3], null);
    assert.equal(state[4], 'mos-1');
    assert.doesNotMatch(JSON.stringify(state), /PLAY trimis/);
});

test('graphic-only MOS PLAY omits params when there are no text values', async t => {
    const state = [];
    let stateIndex = 0;
    let connectionEffect;
    const react = {
        useState(initial) { const index = stateIndex++; if (!(index in state)) state[index] = initial; return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }]; },
        useEffect(effect) { connectionEffect = effect; },
        useCallback(callback) { return callback; },
    };
    const source = readFileSync(path.resolve(__dirname, '../../resources/js/Components/Articles/useLBPortalController.ts'), 'utf8');
    const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText;
    const module = {exports: {}};
    new Function('require', 'module', 'exports', compiled)((id) => id === 'react' ? react : require(id), module, module.exports);
    global.route = name => `/${name}`;
    global.window = global;
    const sent = [];
    global.fetch = async (url, options = {}) => {
        if (url === '/lb-portal.connection') return {ok: true, status: 200, json: async () => ({endpoint: 'http://192.168.1.50:47835', accessKey: 'a'.repeat(64), timeoutMs: 5000})};
        const payload = JSON.parse(options.body); sent.push(payload);
        return {ok: true, status: 200, json: async () => ({requestId: payload.requestId, execution: {status: 'completed', sectionId: 'section-a', onAir: true}})};
    };
    stateIndex = 0; module.exports.useLBPortalController(); connectionEffect();
    await new Promise(resolve => setImmediate(resolve));
    stateIndex = 0;
    const accepted = await module.exports.useLBPortalController().sendPlay({commandId: 'graphic-only', slug: '09_impact_emotional', editableObjects: [{name: 'Titlu', value: '  '}]});
    assert.equal(accepted, true);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].template, '09_impact_emotional');
    assert.deepEqual(Object.keys(sent[0]).sort(), ['requestId', 'source', 'template', 'type']);
    assert.equal(state[4], 'graphic-only');
});

test('MOS Resume sends mos-resume and clears the local on-air state only after LiveBoard confirms OFF', async t => {
    const state = []; let stateIndex = 0; let connectionEffect;
    const react = {
        useState(initial) { const index = stateIndex++; if (!(index in state)) state[index] = initial; return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }]; },
        useEffect(effect) { connectionEffect = effect; }, useCallback(callback) { return callback; },
    };
    const source = readFileSync(path.resolve(__dirname, '../../resources/js/Components/Articles/useLBPortalController.ts'), 'utf8');
    const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText;
    const module = {exports: {}};
    new Function('require', 'module', 'exports', compiled)(id => id === 'react' ? react : require(id), module, module.exports);
    global.route = name => `/${name}`; global.window = global;
    const sent = [];
    global.fetch = async (url, options = {}) => {
        if (url === '/lb-portal.connection') return {ok: true, status: 200, json: async () => ({endpoint: 'http://192.168.1.50:47835', accessKey: 'a'.repeat(64), timeoutMs: 5000})};
        const payload = JSON.parse(options.body); sent.push(payload);
        return {ok: true, status: 200, json: async () => ({requestId: payload.requestId, execution: {status: 'completed', sectionId: 'section-a', onAir: false}})};
    };
    stateIndex = 0; module.exports.useLBPortalController(); connectionEffect(); await new Promise(resolve => setImmediate(resolve));
    stateIndex = 0; const controller = module.exports.useLBPortalController();
    const accepted = await controller.sendPlay({commandId: 'cmd-1', objectKey: 'mos-1', slug: '02_Nume', editableObjects: [{name: 'Text', value: 'Ana'}]}, 'RESUME');
    assert.equal(accepted, true);
    assert.equal(sent[0].type, 'mos-resume');
    assert.equal(sent[0].template, '02_Nume');
    assert.deepEqual(Object.keys(sent[0]).sort(), ['requestId', 'source', 'template', 'type']);
    assert.deepEqual(state[5], { 'mos-1': {onAir: false, sectionId: 'section-a'} });
    assert.equal(state[4], null);
});
