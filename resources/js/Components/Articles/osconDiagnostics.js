export function osconFailureHint(reason) {
    const status = typeof reason?.statusCode === 'number' ? reason.statusCode : null;
    if (reason?.name === 'AbortError') {
        return 'Bridge-ul nu a răspuns în intervalul configurat. Verifică dacă OSCon rulează și dacă endpointul și portul din Setări OSCon sunt corecte.';
    }
    if (status === 401 || status === 403) {
        return 'Bridge-ul răspunde, dar a respins autentificarea. Verifică tokenul salvat în Profil → Setări OSCon.';
    }
    if (status !== null && status >= 500) {
        return `Bridge-ul a răspuns cu HTTP ${status}. Verifică procesul și jurnalul OSCon.`;
    }
    if (reason?.name === 'TypeError') {
        return 'API-ul local OSCon nu a răspuns. Verifică dacă OSCon rulează, dacă API-ul este activat, confirmat și salvat în Setări OSCon și dacă originea exactă a acestei instanțe Plasma este permisă. Browserul nu poate distinge între bridge oprit și un blocaj CORS; reconectează-te după verificări.';
    }
    const message = typeof reason?.message === 'string' ? reason.message : '';
    if (message.includes('Setările OSCon nu sunt disponibile')) {
        return 'Activează și confirmă conexiunea, apoi salvează endpointul și tokenul în Profil → Setări OSCon.';
    }
    return 'Verifică endpointul, tokenul și compatibilitatea bridge-ului în Profil → Setări OSCon.';
}
