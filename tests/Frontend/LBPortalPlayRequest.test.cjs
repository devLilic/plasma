const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function createTimerHarness(responses = []) {
    const state = [];
    let stateIndex = 0;
    const effectCallbacks = [];
    const cleanups = [];
    let now = 10_000;
    let nextTimerId = 1;
    const timers = new Map();
    const sent = [];
    const responseQueue = [...responses];
    const originalDateNow = Date.now;
    const originalSetTimeout = global.setTimeout;
    const originalClearTimeout = global.clearTimeout;
    const originalWindow = global.window;
    const originalRoute = global.route;
    const originalFetch = global.fetch;
    Date.now = () => now;
    global.route = name => `/${name}`;
    global.window = global;
    global.setTimeout = (callback, delay = 0) => {
        const id = nextTimerId++;
        timers.set(id, {callback, deadline: now + Math.max(0, Number(delay) || 0)});
        return id;
    };
    global.clearTimeout = id => timers.delete(id);

    const react = {
        useState(initial) {
            const index = stateIndex++;
            if (!(index in state)) state[index] = initial;
            return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
        },
        useRef(initial) {
            const index = stateIndex++;
            if (!(index in state)) state[index] = {current: initial};
            return state[index];
        },
        useEffect(effect) { effectCallbacks.push(effect); },
        useCallback(callback) { return callback; },
    };
    const source = readFileSync(path.resolve(__dirname, '../../resources/js/Components/Articles/useLBPortalController.ts'), 'utf8');
    const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText;
    const module = {exports: {}};
    new Function('require', 'module', 'exports', compiled)(id => id === 'react' ? react : require(id), module, module.exports);
    global.fetch = async (url, options = {}) => {
        if (url === '/lb-portal.connection') return {ok: true, status: 200, json: async () => ({endpoint: 'http://127.0.0.1:47835', accessKey: 'b'.repeat(64), timeoutMs: 5000})};
        const payload = JSON.parse(options.body);
        sent.push(payload);
        const reply = responseQueue.shift();
        if (reply instanceof Error) throw reply;
        if (typeof reply === 'function') return reply(payload);
        return {ok: true, status: 200, json: async () => ({requestId: payload.requestId, execution: reply || {status: 'completed', sectionId: 'section-a', onAir: true}})};
    };
    const render = () => {
        stateIndex = 0;
        return module.exports.useLBPortalController();
    };
    render();
    effectCallbacks.forEach(effect => { const cleanup = effect(); if (cleanup) cleanups.push(cleanup); });
    const cleanup = () => cleanups.forEach(cleanup => cleanup());
    const advance = amount => {
        const end = now + amount;
        while (true) {
            const ready = [...timers.entries()].filter(([, timer]) => timer.deadline <= end).sort((left, right) => left[1].deadline - right[1].deadline)[0];
            if (!ready) break;
            const [id, timer] = ready;
            timers.delete(id);
            now = timer.deadline;
            timer.callback();
        }
        now = end;
    };
    const restore = () => {
        cleanup();
        Date.now = originalDateNow;
        global.setTimeout = originalSetTimeout;
        global.clearTimeout = originalClearTimeout;
        if (originalWindow === undefined) delete global.window; else global.window = originalWindow;
        if (originalRoute === undefined) delete global.route; else global.route = originalRoute;
        if (originalFetch === undefined) delete global.fetch; else global.fetch = originalFetch;
    };
    return {render, state, sent, timers, advance, restore, queue: responseQueue, setNow: value => { now = value; }};
}

const responseFor = (execution, requestId) => ({ok: true, status: 200, json: async () => ({requestId, execution})});
const automatic = (remainingDurationMs, sectionId = 'section-a', status = 'completed') => ({status, sectionId, onAir: true, automaticDurationSeconds: 6, remainingDurationMs});
const mosObject = (key, slug = '05_Titlu') => ({commandId: key, objectKey: key, revision: 'rev-1', slug, editableObjects: [{name: 'Titlu', value: 'Text'}]});
const ready = () => new Promise(resolve => setImmediate(resolve));

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
        useRef(initial) { const index = stateIndex++; if (!(index in state)) state[index] = {current: initial}; return state[index]; },
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
        useRef(initial) { const index = stateIndex++; if (!(index in state)) state[index] = {current: initial}; return state[index]; },
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
        useRef(initial) { const index = stateIndex++; if (!(index in state)) state[index] = {current: initial}; return state[index]; },
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

test('automatic duration countdown expires locally after six seconds without another request', async t => {
    const harness = createTimerHarness([automatic(6000)]); t.after(harness.restore); await ready();
    assert.equal(await harness.render().sendPlay(mosObject('timed')), true);
    assert.equal(harness.state[5].timed.onAir, true);
    harness.advance(5999);
    assert.equal(harness.state[5].timed.onAir, true);
    harness.advance(1);
    assert.equal(harness.state[5].timed.onAir, false);
    assert.equal(harness.state[4], null);
    assert.equal(harness.sent.length, 1);
});

test('noop preserves an existing deadline when server remaining would extend it', async t => {
    const harness = createTimerHarness([automatic(6000), automatic(6000, 'section-a', 'noop')]); t.after(harness.restore); await ready();
    await harness.render().sendPlay(mosObject('first'));
    harness.advance(1000);
    await harness.render().sendPlay(mosObject('replacement'));
    assert.equal(harness.state[5].first.onAir, false);
    assert.equal(harness.state[5].replacement.onAir, true);
    harness.advance(4999);
    assert.equal(harness.state[5].replacement.onAir, true);
    harness.advance(1);
    assert.equal(harness.state[5].replacement.onAir, false);
});

test('noop shortens an existing deadline and transfers expiry ownership to the requested object', async t => {
    const harness = createTimerHarness([automatic(6000), automatic(2000, 'section-a', 'noop')]); t.after(harness.restore); await ready();
    await harness.render().sendPlay(mosObject('first'));
    harness.advance(1000);
    await harness.render().sendPlay(mosObject('second'));
    harness.advance(1999);
    assert.equal(harness.state[5].second.onAir, true);
    harness.advance(1);
    assert.equal(harness.state[5].second.onAir, false);
    assert.equal(harness.state[4], null);
});

test('completed PLAY replaces a same-section timer while another section keeps its own timer', async t => {
    const harness = createTimerHarness([automatic(6000), automatic(6000), automatic(6000, 'section-b')]); t.after(harness.restore); await ready();
    await harness.render().sendPlay(mosObject('first'));
    harness.advance(1000);
    await harness.render().sendPlay(mosObject('replacement'));
    harness.advance(1000);
    await harness.render().sendPlay(mosObject('other-section'));
    harness.advance(4000);
    assert.equal(harness.state[5].replacement.onAir, true);
    assert.equal(harness.state[5]['other-section'].onAir, true);
    harness.advance(1000);
    assert.equal(harness.state[5].replacement.onAir, false);
    assert.equal(harness.state[5]['other-section'].onAir, true);
    harness.advance(1000);
    assert.equal(harness.state[5]['other-section'].onAir, false);
});

test('manual or missing duration metadata does not start a timer', async t => {
    const harness = createTimerHarness([
        {status: 'completed', sectionId: 'section-a', onAir: true},
        {status: 'completed', sectionId: 'section-b', onAir: true, automaticDurationSeconds: 6},
        {status: 'completed', sectionId: 'section-c', onAir: true, automaticDurationSeconds: 6, remainingDurationMs: Infinity},
    ]); t.after(harness.restore); await ready();
    await harness.render().sendPlay(mosObject('manual'));
    await harness.render().sendPlay(mosObject('missing-remaining'));
    await harness.render().sendPlay(mosObject('invalid-remaining'));
    harness.advance(60_000);
    assert.equal(harness.state[5].manual.onAir, true);
    assert.equal(harness.state[5]['missing-remaining'].onAir, true);
    assert.equal(harness.state[5]['invalid-remaining'].onAir, true);
    assert.equal(harness.timers.size, 0);
});

test('zero remaining duration immediately returns the item to Play/default state', async t => {
    const harness = createTimerHarness([automatic(6000, 'section-b'), automatic(0, 'section-a')]); t.after(harness.restore); await ready();
    await harness.render().sendPlay(mosObject('still-active-in-b'));
    await harness.render().sendPlay(mosObject('instant'));
    assert.equal(harness.state[5].instant.onAir, false);
    assert.equal(harness.state[5]['still-active-in-b'].onAir, true);
    assert.equal(harness.state[4], 'still-active-in-b');
    assert.equal(harness.timers.size, 1);
});

test('confirmed Resume cancels the timer and no local expiry sends another command', async t => {
    const harness = createTimerHarness([automatic(6000), {status: 'completed', sectionId: 'section-a', onAir: false}]); t.after(harness.restore); await ready();
    await harness.render().sendPlay(mosObject('resumable'));
    assert.equal(await harness.render().sendPlay(mosObject('resumable'), 'RESUME'), true);
    assert.equal(harness.sent[1].type, 'mos-resume');
    harness.advance(7000);
    assert.equal(harness.state[5].resumable.onAir, false);
    assert.equal(harness.sent.length, 2);
});

test('blocked and mismatched responses preserve the previous timer and playback state', async t => {
    const harness = createTimerHarness([automatic(6000), {status: 'blocked', sectionId: 'section-a', onAir: false}, payload => responseFor(automatic(1000), 'wrong-id')]); t.after(harness.restore); await ready();
    await harness.render().sendPlay(mosObject('active'));
    harness.advance(1000);
    assert.equal(await harness.render().sendPlay(mosObject('blocked')), false);
    assert.equal(await harness.render().sendPlay(mosObject('mismatched')), false);
    assert.equal(harness.state[5].active.onAir, true);
    harness.advance(4999);
    assert.equal(harness.state[5].active.onAir, true);
    harness.advance(1);
    assert.equal(harness.state[5].active.onAir, false);
});

test('unmount clears timers and ignores a late successful response', async t => {
    let resolveRequest;
    const harness = createTimerHarness([automatic(6000), () => new Promise(resolve => { resolveRequest = resolve; })]); t.after(harness.restore); await ready();
    await harness.render().sendPlay(mosObject('before-unmount'));
    const pending = harness.render().sendPlay(mosObject('late'));
    harness.restore();
    resolveRequest(responseFor(automatic(1000), harness.sent[1].requestId));
    assert.equal(await pending, false);
    assert.equal(harness.state[5].late, undefined);
});
