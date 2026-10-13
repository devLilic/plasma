# Playlist Pregătire / LIVE și OSCon

Pagina playlistului folosește lățimea disponibilă a ecranului. În Pregătire se aleg și se verifică imaginile; în LIVE există trei contexte independente: articolul pregătit pentru imagine, imaginea raportată activă de PlasmaViewer și articolul din panoul MOS. Exemplul operațional este MOS pentru știrea 5, plasma știrii 6 pe ieșire și imaginea știrii 7 în pregătire.

Blocul separat „Playlist / operator” nu se mai afișează. Titlul integral al playlistului și numărul materialelor sunt în partea de sus a sidebarului din stânga. Descarcă toate nu se mai afișează pe această pagină. Headerul arată și butoanele de fullscreen/windowed FR2, cu pictograme, grupare și stare activă ca în PlasmaViewer; sunt înaintea selectorului Pregătire / LIVE. Butoanele trimit comenzile `window.fullscreen` existente, iar starea afișată se actualizează din răspunsul PlasmaViewer. În PlasmaViewer FR3 rămâne mereu fullscreen, fără buton de mod separat. Selectorul Pregătire / LIVE și Refresh playlist stau lângă comenzile FR2, în dreapta headerului, lângă selectorul utilizatorului. Distanța dintre header și panouri este de 12 px. Schimbarea regimului folosește aceleași reguli de selecție independente și nu trimite comenzi de ieșire.

Butonul rotund „+” pe marginea de sus a primului material deschide dialogul Material nou la poziția primului articol; este vizibil la hover/focus pe primul rând, la fel ca butoanele „+” dintre materiale, care inserează în continuare după articolul respectiv. Pentru un playlist gol, sidebarul și un „+” vizibil rămân disponibile, cu poziția 1. Lista se derulează separat de titlu și acțiunile sidebarului. Badge-ul INTRO este ascuns numai în sidebar, celelalte badge-uri își păstrează ordinea; datele importate și badge-urile din editor nu sunt modificate. Numerele de ordine folosesc 11 px într-o coloană de 12 px. Panoul MOS și sidebarul sunt aliniate sus cu editorul central; regula sticky MOS are selectorul explicit al gridului pentru a nu fi suprascrisă de poziționarea generică `.ios-card`.

Interacțiunea OSC pentru titre este retrasă din pagina playlistului: bara OSCon, profilele, maparea, PLAY/STOP MOS și mesajele de conectare sunt ascunse. Pagina nu mai inițializează controllerul OSCon. Grafica MOS, navigarea și corecțiile locale rămân disponibile. Direcția cerută este conectarea TCP la LiveBoard; acea conexiune nu este implementată prin această schimbare. Secțiunile OSCon de mai jos documentează implementarea păstrată în cod, fără acces din pagina playlistului.

## Acțiuni explicite

În LIVE, selectarea unui articol din playlist schimbă preview-ul imaginii. Navigarea MOS schimbă numai articolul din panoul MOS. Alegerea următoarei imagini, editarea, corecțiile locale, navigarea și schimbarea modului nu trimit PLAY/STOP sau SHOW/HIDE. Afișează și Ascunde folosesc rutele PlasmaViewer existente. Conexiunea și implementarea PlasmaViewer au rămas cele existente, conform clarificării utilizatorului; această intervenție nu implementează snapshoturi noi în Viewer și nu garantează păstrarea octeților imaginii după reload.

Textul original și sursele importate rămân păstrate. Panoul operațional MOS urmărește ordinea și fragmentele calculate din sursa originală, înaintea aplicării corecțiilor. Importul/refresh-ul ENPS și HTM păstrează contractele din [documentația importului](enps-playlist-import.md).

În zona de Pregătire, cardul „Intro știre” afișează textul intro până la primul marker `OFF` standalone. Markerul și tot textul de după el sunt eliminate din preview, inclusiv când `OFF` apare în mijlocul aceluiași rând; cuvinte precum `OFFICIAL` rămân intacte. Textul sursă nu este modificat.

## Conexiunea OSCon

Operatorul apasă Conectează OSCon. Setările globale sunt disponibile în profil, pentru utilizatorii autentificați: endpoint HTTP/HTTPS și token. Tokenul este criptat prin Laravel Crypt în ApplicationSetting; formularul nu primește valoarea salvată. Un token gol păstrează valoarea existentă, iar eliminarea se cere explicit. Ruta autentificată `oscon.connection` răspunde cu `Cache-Control: private, no-store`. Browserul păstrează tokenul numai în memorie, fără localStorage sau sessionStorage.

Browserul verifică identitatea `oscon`, versiunea protocolului, readiness și capabilitățile MOS, apoi citește profilele și grupurile. Starea serviciului și starea locală a graficii sunt distincte. După o comandă cu rezultat incert se cere verificarea stării; nu există retry automat al comenzii. Confirmarea UDP/OSC este numai locală și nu dovedește imaginea de pe ieșirea LiveBoard.

## Corecții MOS

`playlist_mos_overrides` păstrează corecțiile separat de articole, surse și snapshoturile ENPS. Identitatea obiectului este opacă și derivată din playlist, setul exact de origini database/GUID și identificatorii MOS. Identitatea câmpului folosește numele normalizat unic al câmpului; valorile, ordinea câmpurilor și ID-ul articolului nu intră în identitate. Fără o identitate suficientă, obiectul este doar pentru vizualizare. Câmpurile cu același nume normalizat sunt ambigue și nu se editează.

Schimbarea valorii originale păstrează corecția pe aceeași identitate și semnalează schimbarea sursei. Schimbarea setului de origini, a identității obiectului sau a numelui câmpului lasă corecția veche inactivă. Nu există potrivire aproximativă. Corecțiile fără corespondent sunt listabile și eliminabile. Resetarea unei corecții active se face din obiectul curent.

PATCH și DELETE verifică revizia și răspund cu 409 la intervenții concurente. Obiectele agregate afișează identitățile membrilor și cer explicit aplicarea tuturor aparițiilor; simpla corecție a unei apariții nu se transferă duplicatelor. Salvarea nu schimbă grafica activă; PLAY folosește valorile salvate, nu drafturile nesalvate.

## Verificare

Testele PHP rulează exclusiv cu `APP_ENV=testing`, SQLite în memorie, verificat prin `TestIsolationTest`. Verificările relevante sunt `PlaylistMosOverrideTest`, `ArticleMosTimelineTest`, `OSConConnectionSettingsTest`, `EnpsPlaylistImportTest`, `EnpsWebIntegrationTest`, `PlaylistParsingRefreshTest` și `PlasmaViewerIntegrationTest`. Frontend-ul se verifică prin testele Node din `tests/Frontend` și `npm run build`.

Acceptanța pe stația LiveBoard rămâne manuală: redarea efectivă, durata animației Person, revenirea titlului, STOP profil și STOP grup. Testele automate folosesc transporturi simulate și nu trimit OSC către ieșirea reală.
