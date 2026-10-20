# Documentația Codex a proiectului Plasma

Acest director descrie comportamente și decizii de proiect care trebuie păstrate la modificări ulterioare. Înainte să schimbi o zonă documentată, citește pagina aferentă și instrucțiunile din [AGENTS.md](../../AGENTS.md).

## Documente

- [Notificări de eroare](error-notifications.md) — erori operaționale și validări afișate ca blocuri temporare în colțul din dreapta jos.

- [Pornirea frontendului în dezvoltare](frontend-development.md) — diagnosticarea scanării lente Vite, dependențele optimizate explicit și măsurătorile cu cache gol/păstrat.

- [PLAY MOS către LB-Portal](lb-portal-mos-play.md) — PLAY și RESUME în LIVE, grafici succesive din aceeași secțiune și starea verde confirmate prin rezultatul LiveBoard în răspunsul HTTP, template-uri fără text, IP/port/cheie și payloadul HTTP (`params` opțional; RESUME folosește numai numele template-ului și nu cere parametri mapați). Include editorul de mapări, inclusiv maparea unui parametru sursă către mai multe câmpuri destinație și ignorarea parametrilor sursă fără destinație, execuția în simulare sau TCP LBC conectat manual, două grupuri complete A/B, pauzele de propagare și RESUME → PLAY, ieșirea manuală/automată, jurnalul comenzilor și recuperarea, inclusiv resincronizare locală offline și rapoarte explicite pentru execuțiile blocate. Salvările restricționate de starea graficii au mesaje localizate și păstrează draftul, fără excepții IPC pentru aceste cazuri așteptate. Documentele LB-Portal explică protocolul, sursele și receiverul TCP simulat; confirmarea TCP rămâne distinctă de output-ul video real.

- [Playlist Pregătire / LIVE](playlist-live.md) — titlu în sidebar, selectorul de regim lângă Refresh playlist în header, drawer-ul playlistului LIVE pe ecrane de maximum 767px cu burger înaintea taburilor, overlay blurat pe întreg viewportul și layout mobil fără spațiu rezervat înaintea Plasma, inserare prin „+” înaintea primului material, preview-ul intro oprit la primul marker OFF standalone inclusiv când apare inline, trei contexte independente, ecran pe lățimea disponibilă, ordonarea primei apariții MOS după ENPS, aparițiile repetate după text, primul titlu înaintea separatorului chiar fără potrivire în text, separatorul elementelor neidentificate și drag & drop salvat per articol, comenzile MOS prin LB-Portal HTTP și transportul TCP LBControl către LiveBoard, corecții locale MOS și contractele de verificare. Acest flux operațional înlocuiește prezentarea cu text integral pe pagina playlistului; datele originale rămân păstrate.

- [Aparițiile MOS/VOX în text](enps-playlist-import.md#aparițiile-mos-și-vox-în-text) — identificare în script, inclusiv STAND UP și nume–funcție fără marcaj SINCRON, template-uri de persoane configurabile în Setări (`02_Nume` implicit) cu potrivire pe nume și suprapunere parțială de minimum 50% pentru funcția/afilierea compusă, grafici unice în ordinea ENPS și sincroane repetate/VOX intercalate după poziția textuală, titluri identice afișate o singură dată, maximum șapte cuvinte după curățarea TITRE/timecode-urilor și metadatelor tehnice de început, inclusiv `Video nr.` împreună cu numărul său; cifrele rostite se păstrează. Include prima replică și gruparea VOX-urilor consecutive, afișate numai ca blocuri galbene fără carduri MOS asociate, inclusiv pentru template-uri cu prefix numeric; lista completată cu graficele lipsă în ordinea ELEMENTE MOS, fără declarații inventate; textul integral în stânga și lista în dreapta.

- [Importul playlisturilor ENPS în Plasma](enps-playlist-import.md) — integrarea ENPS read-only, adaptorul ENPS/HTM, sesiuni și siguranța datelor, BasicContent per element (fără INTRO), recuperarea textului complet când BeginText este trunchiat și eliminarea fragmentelor tehnice fără pierderea continuării, normalizarea în sentence case a titlului scurt pentru template-ul „Ultima Oră”, MOS în card separat sub imagine + intro fără etichete de câmp, roluri generale pentru grafici cu două titluri și titlul scurt afișat cu roșu în același card, delimitarea intro-ului la marcaje, normalizarea spațiilor/newline-urilor și afișarea cuvintelor întregi, excluderi, refresh, starea galben-roșu-verde și verificările necesare.

## Regula de întreținere

[Durata automată MOS](lb-portal-mos-play.md#durata-automată-și-revenirea-mos-la-starea-implicită) este transmisă de LB-Portal prin `automaticDurationSeconds` și `remainingDurationMs`. Plasma revine local din verde/Resume la implicit/Play la expirare, cu temporizatoare per secțiune și păstrarea timpului rămas la PLAY identic. Actualizarea este aditivă și se livrează întâi în LB-Portal, apoi în Plasma.

Verificarea duratei automate, 19 octombrie 2026: **75 teste LB-Portal, 25 teste frontend Plasma și ambele build-uri de producție — PASS**, inclusiv installer NSIS actualizat. Probele folosesc receiverul/controllerul și TCP mock, plus temporizatoare frontend controlate, fără instalație LiveBoard reală.

[Contractul PLAY](lb-portal-mos-play.md#proiecte-în-lb-portal) include interacțiunile configurabile între secțiuni în LB-Portal: suspendare/revenire legată de durata existentă, reguli per proiect și jurnal, reguli reciproce independente când acțiunile lor nu declanșează alte reguli, fără modificarea cererii HTTP Plasma. Contractul detaliat este `C:\Projects\LB-Portal\docs\CODEX_SECTION_INTERACTIONS.md`.

Verificarea etapei de interacțiuni: **90 teste LB-Portal, 12 teste Plasma, 159 verificări Electron și build NSIS — PASS**, cu setări temporare și TCP mock. Editorul la 640/1280/1920 px și consola au fost verificate separat în rendererul compilat, cu șapte capturi revizuite și fără deplasare orizontală. Documentația detaliază instrumentele, pornirea maximizată fără DevTools și verificările rămase pentru instalația LiveBoard reală.

Potrivirea [aparițiilor MOS din text](enps-playlist-import.md#aparițiile-mos-și-vox-în-text) alocă o singură comandă fiecărei intervenții, cu prioritate pentru numele exacte și prefix diplomatic `E.S.` opțional. Comenzile nelocalizate rămân toate la sfârșitul listei, fără fragmente inventate; frontendul respectă timeline-ul și păstrează template-urile fără text.

Organizarea secțiunilor LB-Portal în proiecte este descrisă în [contractul PLAY](lb-portal-mos-play.md#proiecte-în-lb-portal): selecție manuală Telejurnal/Retrospectiva, blocarea execuției Plasma pentru alte proiecte, migrarea mapărilor existente și păstrarea contextului istoric. Documentul detaliat LB-Portal este `C:\Projects\LB-Portal\docs\CODEX_MOS_PROJECTS.md`.

Editorul LB-Portal permite reordonarea salvată a secțiunilor și duplicarea proiectelor în copii independente cu nume editabil, mapări și reguli refăcute pe identificatori noi. Salvarea exclusivă a ordinii păstrează runtime-ul activ; duplicarea nu schimbă proiectul activ.

Extensia editorului din 19 octombrie 2026: 44 teste LB-Portal, verificarea fluxurilor noi/layoutului în renderer și build-ul NSIS au trecut. Limitarea probei Electron generale la afișarea pașilor din raport este documentată separat în contractul proiectelor LB-Portal.

Verificarea etapei de proiecte: 68 teste LB-Portal, 11 teste Plasma, 110 verificări Electron și build NSIS — toate trecute, cu setări temporare și receiver TCP mock.

Documentația și testele sunt parte din contractul funcțional, nu sunt note opționale. Dacă o modificare autorizată schimbă comportamentul descris, actualizează documentul în aceeași schimbare și ajustează testele relevante. Nu șterge o regulă doar pentru că pare redundantă înainte de a verifica traseul complet frontend–backend–persistență.
