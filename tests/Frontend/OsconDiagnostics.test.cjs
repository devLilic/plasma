const test = require('node:test');
const assert = require('node:assert/strict');

test('OSCon connection hints distinguish network/CORS, authentication and timeout failures', async () => {
    const {osconFailureHint} = await import('../../resources/js/Components/Articles/osconDiagnostics.js');

    const networkHint = osconFailureHint(new TypeError('Failed to fetch'));
    assert.match(networkHint, /API-ul local OSCon nu a răspuns/i);
    assert.match(networkHint, /rulează/i);
    assert.match(networkHint, /activat, confirmat și salvat/i);
    assert.match(networkHint, /originea exactă/i);
    assert.match(networkHint, /bridge oprit și un blocaj CORS/i);
    assert.match(networkHint, /reconectează-te/i);

    const authHint = osconFailureHint({statusCode: 401});
    assert.match(authHint, /token/i);
    assert.doesNotMatch(authHint, /CORS/i);

    const timeoutHint = osconFailureHint({name: 'AbortError'});
    assert.match(timeoutHint, /endpointul și portul/i);
});
