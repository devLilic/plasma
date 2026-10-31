# Playlist Pregătire / LIVE

Pagina playlistului folosește lățimea disponibilă a ecranului. În Pregătire se aleg și se verifică imaginile; în LIVE există trei contexte independente: articolul pregătit pentru imagine, imaginea raportată activă de PlasmaViewer și articolul din panoul MOS. Exemplul operațional este MOS pentru știrea 5, plasma știrii 6 pe ieșire și imaginea știrii 7 în pregătire.

## Meniul playlisturilor zilei

În meniul principal, „Playlisturi” rămâne link direct către lista playlisturilor, iar la hover sau focus afișează playlisturile create în ziua curentă. Lista folosește `created_at` și limitele zilei din fusul orar `app.timezone`; data editorială sau data de lucru ENPS nu schimbă apartenența la zi. În meniul compact, sublista este disponibilă la hover/focus și fiecare titlu deschide pagina playlistului.

Playlisturile zilei sunt încărcate din backend la fiecare pagină autentificată. Astfel, la următoarea navigare apare și playlistul nou creat. Dacă există un singur playlist pentru ziua curentă, submeniul se ascunde numai pe pagina acelui playlist; în celelalte pagini îl afișează ca acces rapid. O sesiune neautentificată nu primește lista.

Pe ecrane mici (`max-width: 767px`), numai în LIVE, playlistul se deschide ca drawer din stânga peste conținut. Butonul burger este în stânga selectorului de surse al imaginii, iar taburile sunt aliniate la dreapta. Drawer-ul este `position: fixed` și nu ocupă un rând în grid, astfel Plasma rămâne imediat sub header. La deschidere, overlay-ul întunecat și blurat acoperă întregul viewport, inclusiv zona de sus; drawer-ul este stratificat deasupra overlay-ului. Închiderea are loc la selectarea unui articol, la atingerea overlay-ului sau cu Escape. La 768px și peste, acest control și drawer-ul mobil sunt ascunse, iar layoutul existent rămâne neschimbat.

Blocul separat „Playlist / operator” nu se mai afișează. Titlul integral al playlistului și numărul materialelor sunt în partea de sus a sidebarului din stânga. Descarcă toate nu se mai afișează pe această pagină. Headerul arată și butoanele de fullscreen/windowed FR2, cu pictograme, grupare și stare activă ca în PlasmaViewer; sunt înaintea selectorului Pregătire / LIVE. Butoanele trimit comenzile `window.fullscreen` existente, iar starea afișată se actualizează din răspunsul PlasmaViewer. În PlasmaViewer FR3 rămâne mereu fullscreen, fără buton de mod separat. Selectorul Pregătire / LIVE și Refresh playlist stau lângă comenzile FR2, în dreapta headerului, lângă selectorul utilizatorului. Distanța dintre header și panouri este de 12 px. Schimbarea regimului folosește aceleași reguli de selecție independente și nu trimite comenzi de ieșire.

Butonul rotund „+” pe marginea de sus a primului material deschide dialogul Material nou la poziția primului articol; este vizibil la hover/focus pe primul rând, la fel ca butoanele „+” dintre materiale, care inserează în continuare după articolul respectiv. Pentru un playlist gol, sidebarul și un „+” vizibil rămân disponibile, cu poziția 1. Lista se derulează separat de titlu și acțiunile sidebarului. Badge-ul INTRO este ascuns numai în sidebar, celelalte badge-uri își păstrează ordinea; datele importate și badge-urile din editor nu sunt modificate. Numerele de ordine folosesc 11 px într-o coloană de 12 px. Panoul MOS și sidebarul sunt aliniate sus cu editorul central; regula sticky MOS are selectorul explicit al gridului pentru a nu fi suprascrisă de poziționarea generică `.ios-card`.

Comenzile MOS din Plasma trec prin HTTP către LB-Portal, care face bridge-ul către LiveBoard prin TCP LBControl (`LBC_`). Plasma nu se conectează direct la LiveBoard. Simularea fără socket din LB-Portal rămâne numai pentru verificări offline; pentru comenzi reale către LiveBoard se folosește conexiunea TCP configurată și pornită manual în LB-Portal. Nu extinde și nu folosi transportul OSCon/OSC pentru acest flux.

## Acțiuni explicite

În LIVE, selectarea unui articol din playlist schimbă preview-ul imaginii. Navigarea MOS schimbă numai articolul din panoul MOS. Alegerea următoarei imagini, editarea, corecțiile locale, navigarea și schimbarea modului nu trimit PLAY/STOP sau SHOW/HIDE. Afișează și Ascunde folosesc rutele PlasmaViewer existente. Conexiunea și implementarea PlasmaViewer au rămas cele existente, conform clarificării utilizatorului; această intervenție nu implementează snapshoturi noi în Viewer și nu garantează păstrarea octeților imaginii după reload.

Panoul MOS oferă **Refresh MOS** pentru articolul selectat, în același rând cu titlul și aliniat la dreapta. Acțiunea citește din ENPS numai BasicContent pentru segmentele acelui articol și actualizează atomic comenzile MOS și cache-ul lor; Text editorial, imaginile și celelalte articole rămân neschimbate. Asocierea folosește snapshotul privat complet, inclusiv INTRO-urile, și ordinea ENPS; dacă asocierea nu este unică după excluderi sau sluguri, refresh-ul este refuzat fără schimbări. Slugurile repetate în story-uri neconsecutive rămân izolate, iar slugurile parțiale sunt potrivite numai ca secvență exactă în interiorul story-ului. Prev/Next sunt pe rândul următor, pe două coloane egale, și afișează titlul tehnic elidat la lățimea disponibilă. Acțiunea nu citește rundown-ul și nu schimbă payloadul sau ruta HTTP Plasma → LB-Portal.

Textul original și sursele importate rămân păstrate. Panoul operațional MOS urmărește ordinea și fragmentele calculate din sursa originală, înaintea aplicării corecțiilor. Importul/refresh-ul ENPS și HTM păstrează contractele din [documentația importului](enps-playlist-import.md).

În zona de Pregătire, cardul „Intro știre” afișează textul intro până la primul marker `OFF` standalone. Markerul și tot textul de după el sunt eliminate din preview, inclusiv când `OFF` apare în mijlocul aceluiași rând; cuvinte precum `OFFICIAL` rămân intacte. Textul sursă nu este modificat.

## Corecții MOS

`playlist_mos_overrides` păstrează corecțiile separat de articole, surse și snapshoturile ENPS. Identitatea obiectului este opacă și derivată din playlist, setul exact de origini database/GUID și identificatorii MOS. Identitatea câmpului folosește numele normalizat unic al câmpului; valorile, ordinea câmpurilor și ID-ul articolului nu intră în identitate. Fără o identitate suficientă, obiectul este doar pentru vizualizare. Câmpurile cu același nume normalizat sunt ambigue și nu se editează.

Schimbarea valorii originale păstrează corecția pe aceeași identitate și semnalează schimbarea sursei. Schimbarea setului de origini, a identității obiectului sau a numelui câmpului lasă corecția veche inactivă. Nu există potrivire aproximativă. Corecțiile fără corespondent sunt listabile și eliminabile. Resetarea unei corecții active se face din obiectul curent.

PATCH și DELETE verifică revizia și răspund cu 409 la intervenții concurente. Obiectele agregate afișează identitățile membrilor și cer explicit aplicarea tuturor aparițiilor; simpla corecție a unei apariții nu se transferă duplicatelor. Salvarea nu schimbă grafica activă; PLAY folosește valorile salvate, nu drafturile nesalvate.

## Ordinea și reordonarea listei MOS

Prima apariție identificată a fiecărei grafici unice urmează ordinea obiectelor MOS din ENPS. Aparițiile repetate și VOX-urile sunt intercalate după pozițiile lor textuale între aceste grafici unice; o apariție repetată poate preceda o grafică unică aflată mai târziu în script. Primul element cu rol de titlu din lista MOS apare la începutul timeline-ului și înaintea separatorului chiar dacă nu poate fi localizat în text. Restaurarea ordinii manuale rearanjează rândurile MOS în sloturile MOS calculate, astfel VOX-ul dintre două sincroane rămâne la locul lui din text. Graficele fără corespondent în text apar la final, sub separatorul „Fără poziție automată / mutate manual”. VOX-urile își păstrează rolul de marcaje galbene, fără carduri MOS suplimentare.

Eticheta template-ului MOS apare la hover sau focus pe card, în colțul din dreapta sus, fără coloană rezervată lângă valori; ea rămâne punctul de prindere pentru drag & drop. Butonul „Editează” apare la hover peste card. În timpul tragerii, o linie albastră indică poziția de inserare, iar separatorul evidențiat arată dacă elementul va fi plasat înainte sau după el. Aparițiile repetate se mută independent. Ordinea se salvează per articol în `article_mos_sequence_orders`, separat de conținutul și corecțiile sursă. Rândurile existente își păstrează poziția după reîncărcare; intrările dispărute sunt ignorate, iar cele noi se adaugă conform ordinii calculate. Mutarea peste separator salvează poziționarea manuală și zona aleasă; cardurile manuale sunt marcate vizibil.

## Verificare

Testele PHP rulează exclusiv cu `APP_ENV=testing`, SQLite în memorie, verificat prin `TestIsolationTest`. Verificările relevante sunt `PlaylistMosOverrideTest`, `ArticleMosTimelineTest`, `ArticleMosSequenceOrderTest`, `EnpsPlaylistImportTest`, `EnpsWebIntegrationTest`, `PlaylistParsingRefreshTest` și `PlasmaViewerIntegrationTest`. Frontend-ul se verifică prin testele Node din `tests/Frontend` și `npm run build`.

Acceptanța comenzilor LiveBoard rămâne manuală pe instalația reală: redarea efectivă, durata animației Person și ieșirea graficii. Testele automate folosesc simularea LB-Portal sau receiverul TCP mock și nu dovedesc output-ul video real.
