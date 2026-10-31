# Plasma → LB-Portal: PLAY MOS și recepția cererilor

Acest document descrie contractul dintre pagina de operare Plasma și receiverul local din LB-Portal. Înainte de a schimba trimiterea PLAY, autentificarea, adresa sau formatul cererii, citește și documentația pereche din LB-Portal: `docs/CODEX_PLASMA_INGRESS_CONTRACT.md`.

## Scopul etapei curente

Corecția OnAir din 22 octombrie 2026: adaptorul local PLAY/RESUME din LB-Portal folosește valorile destinație compuse de resolver, inclusiv al doilea câmp CSV și separatorul. Maparea `Nume` + `Functie` către `Nume` și `Nume_M` transmite același text complet în ambele câmpuri; regulile care folosesc aceeași coloană primară au parametri interni independenți. Cheia CSV (`02_Nume`) rămâne separată de numele exact al contentului LiveBoard (`PA_02_Nume`, dacă acesta este cel încărcat). Contractul HTTP Plasma și protocolul TCP nu se schimbă. Detalii și verificări în `C:\Projects\LB-Portal\docs\CODEX_ONAIR_CSV.md`.

Verificarea corecției: 92 teste relevante LB-Portal în 15 fișiere trecute, inclusiv ruta IPC înregistrată PLAY/Resume cu controller real în simulare și probele TCP localhost. Probele nu confirmă output video fizic; codul Plasma nu a fost schimbat prin această corecție.

Compilarea TypeScript/Vite și installerul NSIS LB-Portal actualizat au trecut. Împachetarea a necesitat reluare cu accesul necesar după eroarea DNS din sandbox; artefactul este `C:\Projects\LB-Portal\release\0.1.0\LB-Portal-0.1.0-x64.exe`, fără publicare de release sau schimbarea configurației operatorului.

LB-Portal include și zona OnAir pentru consultarea exporturilor csvEditor-PA. Folderul se configurează per proiect, iar citirea celor patru fișiere PA se face prin Refresh explicit, în Electron main. Selectorul unic OnAir alege sursa CSV și proiectul ce poate fi activat; schimbarea selecției singură nu activează runtime-ul. Butonul explicit de activare folosește verificările existente și nu trimite comenzi LiveBoard. Datele CSV sunt păstrate numai în memoria sesiunii. Butoanele locale PLAY/RESUME pentru elementele mapate cer ca proiectul OnAir să fie deja proiectul activ în LB-Portal și folosesc controllerul LiveBoard existent (simulare offline sau TCP LBControl, după modul configurat), fără cereri HTTP către Plasma. Proiectele personalizate aleg în Setări modul **Fișiere CSV** sau **plasma.test**. Cele CSV pot fi operate explicit din OnAir și blochează execuția cererilor Plasma; cele configurate pentru Plasma folosesc aceleași mapări și receiver ca Telejurnal și Retrospectiva. Template-urile CSV sunt chei sursă pentru mapările explicite per proiect. Contractul detaliat este `C:\Projects\LB-Portal\docs\CODEX_ONAIR_CSV.md`. Payloadul, autentificarea, CORS și confirmările HTTP descrise aici rămân neschimbate.

În OnAir, proiectele în modul `plasma.test` indică explicit că sunt controlate din Plasma și nu solicită configurarea unui director CSV. Acest mesaj este doar o diferențiere de interfață; fluxul HTTP Plasma și comenzile TCP LiveBoard nu se schimbă.

OnAir are și mapări salvate per proiect de la tip/template CSV la secțiunile, destinațiile A/B și câmpurile LiveBoard, cu previzualizarea valorilor rezultate. Fila editorului apare doar pentru proiectele LB-Portal în modul Fișiere CSV. O mapare poate uni două câmpuri CSV într-un câmp LiveBoard, folosind separatorul configurat (implicit `, `); dacă unul dintre câmpuri este gol, se transmite celălalt fără separator. Textul sursă este păstrat fără transformări de majuscule/minuscule. Fiecare mapare configurează separat RESUME manual sau durata de ieșire a template-ului; acestea sunt setări OnAir și nu schimbă modelul Telejurnal/MOS. Configurarea/previzualizarea mapărilor nu trimite comenzi; butoanele locale PLAY/RESUME descrise mai sus folosesc mapările validate. Grupurile sunt taburi cu Invitați (Platou) primul; rolul proiectului activ pentru Plasma rămâne cel descris mai jos. Envelope-ul HTTP Plasma și payloadurile sale nu se schimbă.

În OnAir, numărul original CSV este comun supratitlului și titlului, aliniate în același bloc. Bara fixă din stânga ocupă înălțimea viewportului, are Refresh CSV de 48 × 48 px și rămâne accesibilă după derularea listelor lungi. Fiecare element mapat are un buton PLAY/Resume; Resume este disponibil numai dacă template-ul și valorile din bufferul LiveBoard activ corespund elementului respectiv. Aceste acțiuni locale trec prin controllerul existent, respectă mapările și configurarea duratei și nu schimbă contractul HTTP sau ruta Plasma → receiver.

Locațiile și intervențiile telefonice pot avea câte un template implicit configurat în proiectul LB-Portal. Acesta este folosit când rândul CSV nu furnizează un `Template` nevid; un template primit din CSV are prioritate și se păstrează exact. Regula se aplică în catalogul mapărilor și în previzualizarea valorilor, fără modificarea fișierelor sursă ori a contractului HTTP Plasma.

Verificarea extinderii OnAir din 21 octombrie 2026: 141 teste relevante LB-Portal, 45 verificări Electron cu profil temporar, QA renderer la 640/1280/1920 px și build TypeScript/Vite/NSIS trecute. Probele includ surse și mapări per proiect, template-uri implicite, salvare/redeschidere, lipsa comenzilor LiveBoard la import/salvarea metadatelor și păstrarea runtime-ului activ. Documentul OnAir consemnează separat rezultatele inițiale, patru eșecuri ale suitei generale în zone nemodificate, expirarea capturilor native și parametrul de build necesar local pentru eroarea Windows `EPERM` la extragerea Electron. În Plasma s-a actualizat numai documentația pereche.

Plasma trimite grafica selectată ca JSON prin HTTP către LB-Portal; LB-Portal este bridge-ul dintre Plasma și LiveBoard. Receiverul autentifică și înregistrează cererea, rezolvă mapările salvate și execută comanda înainte de răspunsul HTTP. Răspunsul pentru MOS include statusul execuției, starea secțiunii și dacă grafica este ON AIR; consola păstrează raportul detaliat. Pentru comenzile reale către LiveBoard se folosește exclusiv TCP LBControl cu comenzile `LBC_`, după configurare și conectare manuală. Simularea fără socket este doar pentru verificări offline. Confirmarea TCP este acceptarea protocolului, nu confirmarea video. Nu conecta Plasma direct la LiveBoard și nu utiliza OSCon/OSC pentru această integrare.

## Configurare și securitate

LB-Portal are și pagina `Setări → Mapări MOS`, unde se salvează secțiuni cu una sau două destinații LiveBoard și mai multe template-uri Plasma. Fiecare template sursă are propria mapare nume parametru → unul sau mai multe câmpuri pentru fiecare destinație (de exemplu, două rânduri `Titlu` pot mapa valoarea la `Titlu` și `Titlu_M` în ambele template-uri). Parametrii sursă fără câmpuri destinație pot rămâne nemapați și sunt ignorați la PLAY; grafica fără parametri poate avea tabelul gol. Perechea de buffere (de exemplu, `01_Titlu-1` și `01_Titlu-2`) are o pauză RESUME → PLAY de `0, 50, 100, 150, 200, 250, 500, 1000 ms`, implicit `100 ms`. Ieșirea este configurată per sursă: manual prin RESUME sau automat în template-ul LiveBoard, cu durata implicită de 6 secunde.

Setările sunt locale și versionate, păstrate după repornire. Numele se introduc exact; sugestiile Plasma provin din setările salvate și cererile acceptate. Numele LiveBoard sunt manuale și trebuie să identifice contenturi deja încărcate și obiectele lor text. Contractul editorului este `C:\Projects\LB-Portal\docs\CODEX_MOS_MAPPING_EDITOR.md`; payloadul HTTP rămâne același.

Perechea funcționează ca două grupuri complete: prima cerere scrie toate câmpurile configurate în A, așteaptă propagarea și trimite PLAY A. Următoarea scrie întregul set configurat în B fără schimbarea datelor A, așteaptă propagarea, trimite RESUME A, așteaptă pauza configurată și trimite PLAY B. Apoi alternează invers. Pauza de propagare este implicit 250 ms, cu opțiunile `0, 100, 250, 500, 1000`; toate sursele unei secțiuni folosesc aceeași stare A/B. Parametrii care au câmpuri configurate pentru destinația selectată și lipsesc din cerere blochează PLAY înainte de scriere; parametrii fără câmpuri configurate sunt ignorați. RESUME nu folosește mapări de câmp și trimite doar numele template-ului destinație. Cererile PLAY identice cu grafica activă nu retrimit comenzile.

Pentru grafica automată, durata estimează numai ieșirea locală; LB-Portal nu trimite RESUME/STOP la expirare. Ieșirea reală trebuie configurată în template. Consola permite RESUME manual, STOP pentru toate destinațiile secțiunii și resincronizare locală. După o tranziție incertă sau pierderea conexiunii cu grafica activă, PLAY este blocat până la recuperare. Pornirea aplicației nu reconectează și nu reexecută cereri automat.

Resincronizarea locală este disponibilă și cu TCP deconectat și nu trimite comenzi. În starea incertă, consola arată ultimul buffer cunoscut, fără a-l prezenta drept activ confirmat. Pentru un template nemapat sau date MOS invalide, rămân vizibile atât diagnosticul mapării, cât și raportul de execuție blocată; nu se inventează o destinație.

În editorul LB-Portal, salvarea blocată de secțiuni active sau operații în curs este un rezultat operațional tipizat. Interfața afișează instrucțiuni în limba aleasă, păstrează modificările nesalvate și nu raportează succes. Setarea refuzată nu este scrisă sau aplicată; acest caz nu mai generează stack trace pentru handlerul Electron `settings:set`. Erorile reale de programare/stocare rămân raportate. Contractul HTTP Plasma și comenzile LBC nu se modifică prin această corecție.

Corecția a fost verificată la 15 octombrie 2026: 56 de teste relevante LB-Portal și 67 de verificări Electron izolate au trecut. Proba reproduce salvarea blocată, confirmă lipsa excepției `settings:set` și salvarea reușită după STOP; build-ul și installerul actualizat au fost generate cu succes.

Documentele LB-Portal pentru această etapă sunt `docs/CODEX_LIVEBOARD_EXECUTION.md`, `docs/CODEX_LIVEBOARD_PROTOCOL.md` și `docs/LIVEBOARD_MOCK_SERVER.md`. Receiverul simulat este un proces Node separat, pornit cu `npm run mock:liveboard`, pentru verificarea socketului și comenzilor fără o a doua aplicație Electron. Acest calculator nu are LiveBoard; testele simulate nu validează output-ul ClassX, tranzițiile vizuale sau diacriticele pe instalația reală.

- În `Setări → Conexiune LB-Portal`, operatorul configurează adresa IPv4, portul și cheia de acces afișată în consola LB-Portal. Portul receiverului implicit este `47835`.
- Cheia este salvată criptat în setările aplicației Plasma. Endpointul autentificat `lb-portal.connection` este folosit numai de frontendul Plasma pentru a trimite cereri; răspunsul este `no-store`. Nu scrie cheia în loguri, URL-uri, fișiere frontend, payload sau mesaje de stare.
- Receiverul acceptă originul `http://plasma.test` și `https://plasma.test`, autentifică prin `Authorization: Bearer …` și gestionează preflight-ul CORS/Private Network Access. Dacă domeniul Plasma se schimbă, actualizează allowlist-ul din LB-Portal și această documentație în aceeași schimbare.
- PLAY este disponibil numai în modul LIVE, când setările sunt configurate și grafica are template/câmpuri MOS valide. Corecțiile locale nesalvate blochează trimiterea.

## Contractul HTTP

Plasma face `POST http://<IPv4>:<port>/v1/requests` cu `Content-Type: application/json` și bearer key. Pentru `mos-play` și `mos-resume`, LB-Portal așteaptă comanda LiveBoard și răspunde cu același `requestId` plus `execution.status`, `execution.sectionId`, `execution.playbackState`, `execution.onAir`, `execution.confirmation` și `execution.error`. Plasma schimbă grafica în verde/Resume numai la `completed`/`noop` și `onAir=true`; după Resume revine la Play și stilul implicit numai la confirmarea `completed` cu `onAir=false`. Statusul execuției rămâne distinct de recepția HTTP.

În integrarea LIVE, RESUME este oferit doar pentru grafica pe care sesiunea Plasma a confirmat-o ca activă prin răspunsul LB-Portal. O altă grafică MOS din aceeași secțiune rămâne disponibilă pentru PLAY; controllerul pregătește noua destinație, retrage grafica anterioară și pornește noua durată configurată. Starea locală Plasma urmărește grafica confirmată în sesiunea curentă; statusurile MOS inițiale nu pot bloca PLAY-ul altei grafici.

### Durata automată și revenirea MOS la starea implicită

Pentru un `mos-play` automat confirmat (`completed` sau `noop`), răspunsul `execution` include opțional `automaticDurationSeconds` (durata configurată pentru sursa MOS executată) și `remainingDurationMs` (timpul rămas al instanței respective, în milisecunde, minimum zero). Durata provine din maparea executată în LB-Portal; nu se deduce din numele template-ului și nu există o durată specială pentru Nume. Sursele manuale, RESUME și execuțiile blocate/eșuate omit câmpurile.

După validarea răspunsului HTTP, a requestId-ului și a execuției reușite, Plasma menține MOS-ul verde/cu Resume până la expirarea timpului rămas primit. Apoi trece local `onAir` la false, elimină evidențierea ultimei grafici și afișează Play/aspectul implicit. Valoarea zero produce revenirea imediată. Expirarea nu trimite o comandă HTTP, RESUME sau STOP; template-ul LiveBoard execută ieșirea efectivă.

Temporizatoarele sunt independente per secțiune. Un PLAY nou confirmat înlocuiește temporizatorul acelei secțiuni; un `noop` păstrează termenul existent sau îl scurtează după timpul rămas primit. Un RESUME confirmat îl anulează, iar o cerere eșuată păstrează starea și temporizatorul anterior. Callbackurile vechi nu pot închide o grafică nouă. Schimbarea articolului păstrează numărătoarea; demontarea controllerului o curăță și răspunsurile întârziate nu mai actualizează sesiunea închisă.

LB-Portal recalculează timpul rămas și pentru cereri identice ori retrimiterea aceluiași requestId în fereastra existentă de deduplicare, fără repornirea graficii. Pentru o instanță expirată sau înlocuită întoarce zero, inclusiv dacă o grafică ulterioară refolosește bufferul/template-ul. Numărătoarea Plasma începe la primirea răspunsului și estimează starea locală, fără confirmarea video. Răspunsurile fără metadate valide ale duratei păstrează comportamentul anterior. Actualizarea se livrează întâi în LB-Portal, apoi în Plasma; envelope-ul cererii și transporturile existente rămân compatibile.

În răspunsurile din cache, raportul execuției descrie comanda originală; metadatele timpului rămas sunt recalculate separat. Valoarea zero împiedică reactivarea locală a unei grafici expirate sau înlocuite, chiar dacă raportul istoric a înregistrat inițial o stare ON.

Verificarea acestei extensii la 19 octombrie 2026: **75 teste relevante LB-Portal și 25 teste frontend Plasma au trecut**, împreună cu build-urile de producție ale ambelor proiecte și installerul NSIS LB-Portal. Testele acoperă receiverul real prin harness HTTP, controllerul și un TCP mock local, păstrarea timpului rămas la `noop`/replay, durata originală după schimbarea mapării, expirarea fără comenzi, revenirea locală după șase secunde, înlocuirea graficii, secțiuni independente, RESUME, răspunsuri invalide și curățarea temporizatoarelor. Datele sunt fictive și setările operatorului nu au fost accesate; output-ul video pe instalația LiveBoard reală nu este confirmat de aceste probe.

Payloadul `mos-play` curent are forma:

```json
{
  "requestId": "UUID",
  "source": "plasma.test",
  "type": "mos-play",
  "template": "05_Titlu_Ultima_Ora",
  "params": {"Titlu": "Text titlu", "Titlu scurt": "Ultima oră"}
}
```

Pentru a retrage grafică ON AIR, Plasma trimite `type: "mos-resume"` cu `requestId`, `source` și template-ul Plasma în `template`; `params` este omis. Mapările de parametri sunt necesare numai pentru PLAY. LB-Portal rezolvă template-ul sursă la secțiunea salvată, apoi trimite `LBC_RESUMECONTENT` cu doar numele template-ului destinație pentru bufferul activ și include starea confirmată în același răspuns HTTP.

Pentru o grafică fără valori textuale, Plasma trimite același envelope de ingress cu `template`, dar omite complet `params`:

```json
{
  "requestId": "UUID",
  "source": "plasma.test",
  "type": "mos-play",
  "template": "09_impact_emotional"
}
```

`requestId` este UUID v4 generat în browser. Codul folosește `crypto.randomUUID()` când este disponibil; pe originuri locale nesigure precum `http://plasma.test`, unde unele browsere nu expun această metodă, folosește `crypto.getRandomValues()` pentru aceiași 128 de biți și același format.

`template` este `MosObject.slug`. `params` este opțional: Plasma trimite nume–valoare pentru câmpurile cu text și omite cheia la grafica fără valori textuale. `requestId`, `source` și `type` sunt metadate obligatorii pentru validare, confirmare și consolă. Cererea nu conține `sentAt`, datele articolului sau identificatori interni MOS. LB-Portal alege destinația salvată și transformă valorile în settere LBC; nu trimite envelope-ul JSON direct către LiveBoard.

Receiverul păstrează până la 100 de cereri recente în memoria procesului, iar consola LB-Portal afișează ultimele 50. Corpul JSON brut este formatat doar la deschiderea detaliilor. Repornește aplicația pentru a reinițializa istoricul; nu presupune persistență după închiderea Electron. Aceste limite țin de performanța rendererului și nu schimbă contractul HTTP.

Consola afișează secțiunea, template-ul Plasma și mapările fixate la recepție. Raportul de execuție se actualizează separat cu bufferul ales, anterior și următor, ordine, comenzi, răspunsuri și erori. Setările editate ulterior nu schimbă maparea istorică. Parametrii lipsă/suplimentari, template-urile necunoscute și setările indisponibile sunt explicite. HTTP 200 poate fi urmat de execuție blocată/eșuată; confirmarea TCP `Ok` reprezintă acceptarea protocolului, nu observarea video.

## Proiecte în LB-Portal

Proiectele LB-Portal pot configura și interacțiuni între secțiuni: eveniment declanșator, acțiuni ordonate RESUME/STOP/PLAY ori suspendare cu revenire. Exemplu: Nume suspendă Titluri, apoi readuce titlul după durata deja configurată a graficii Nume (6 secunde dacă sursa are 6 secunde). Regula nu adaugă altă durată sau comportament special pentru nume consecutive. Revenirea folosește bufferul și valorile memorate, este anulată la oprire/resincronizare sau stare incertă și apare în jurnal cu identitatea regulii. Acțiunile regulilor nu declanșează recursiv alte reguli; două reguli reciproce „Înainte de PLAY”, fiecare cu RESUME pe cealaltă secțiune, sunt independente și valide. Referința unei reguli la propria secțiune declanșatoare rămâne invalidă. Detaliile sunt în `C:\Projects\LB-Portal\docs\CODEX_SECTION_INTERACTIONS.md`; payloadul și confirmarea HTTP Plasma rămân aceleași.

Secțiunile sunt organizate în proiecte independente create de operator. Instalarea nouă nu are niciun proiect activ sau inclus; se pot crea de la zero secțiunile, mapările și interacțiunile. Fiecare proiect poate fi șters, redenumit și configurat pentru **Fișiere CSV** sau `plasma.test`. Proiectul dorit se alege și activează manual din tabul OnAir al LB-Portal. Proiectele CSV blochează execuția Plasma, deși recepția HTTP rămâne înregistrată. Fără proiect activ, cererea se recepționează dar nu are mapare și nu trimite comenzi LiveBoard. Tabul Consolă afișează starea runtime și diagnosticarea. Selectarea unui proiect în editorul de setări schimbă doar proiectul editat. Payloadul Plasma nu conține un selector de proiect și nu activează automat alt proiect.

Editorul LB-Portal permite reordonarea secțiunilor și duplicarea proiectului într-o copie independentă cu nume editabil. Copia păstrează mapările, timpii și interacțiunile, cu identificatori noi și referințe refăcute; pornește în modul CSV, care poate fi schimbat în `plasma.test`, și nu activează automat alt proiect. Proiectele se pot exporta și importa ca fișiere JSON `.lbproject.json`; importul validează conținutul și atribuie identificatori noi, pentru transfer între calculatoare. Mapările MOS permit repetarea aceluiași parametru Plasma pe rânduri separate, câte un câmp destinație pe rând. Ordinea salvată este folosită în editor și consolă. O salvare care schimbă numai ordinea secțiunilor păstrează grafica activă, bufferele și temporizările și nu trimite comenzi LiveBoard. Contractul HTTP rămâne neschimbat.

Verificare la 19 octombrie 2026: 44 teste unitare relevante LB-Portal, fluxurile noi în rendererul compilat și build-ul TypeScript/Vite/NSIS au trecut. Editorul a fost verificat la 640/1280/1920 px, fără scroll orizontal. Proba Electron generală rămâne oprită de afișarea listei de pași ascunse din raportul de interacțiuni, consemnată în contractul proiectelor LB-Portal; nu reprezintă un PASS complet. Testele folosesc date temporare/fictive, fără instalație LiveBoard reală.

Verificarea modurilor de proiect și mapării pe rânduri — 24 octombrie 2026: **45 teste focalizate LB-Portal și build-ul TypeScript/Vite/NSIS x64 au trecut**. Acoperă rezolvarea cererilor pentru un proiect personalizat în modul `plasma.test`, blocarea proiectului CSV, normalizarea proiectelor salvate anterior și controllerul. Contractul HTTP, autentificarea, CORS și transportul TCP LBC nu s-au schimbat. Detalii și documentația pereche sunt în `C:\Projects\LB-Portal\docs\CODEX_MOS_PROJECTS.md`.

Cu un proiect în modul CSV activ, receiverul înregistrează cererea și confirmă recepția HTTP, dar raportul indică `project-disabled`, fără comenzi LiveBoard sau fallback la alt proiect. Schimbarea proiectului activ cere lipsa operațiilor în curs/coadă și toate secțiunile OFF; activarea nu trimite comenzi. Fiecare proiect are mapări și stare A/B proprii, iar istoricul și deduplicarea păstrează contextul proiectului. Proiectele din configurațiile vechi sunt convertite în proiecte obișnuite editabile; migrarea configurațiilor plate păstrează mapările într-un proiect portabil care poate fi redenumit sau șters. Proiectele în modul CSV pot salva secțiuni fără surse Plasma. Decizia nu schimbă payloadul HTTP, autentificarea, CORS, confirmarea receiverului sau rutarea TCP LBControl.

Contractul complet este `C:\Projects\LB-Portal\docs\CODEX_MOS_PROJECTS.md`. Integrarea ENPS/importul HTM și envelope-ul HTTP nu sunt modificate de organizarea în proiecte.

## Fluxul de implementare

1. `ArticlesList` montează `useLBPortalController` și furnizează starea conexiunii către `MosWorkspace`.
2. `MosWorkspace` validează disponibilitatea PLAY și trimite articolul și obiectul MOS curent; nu trimite drafturi locale nesalvate.
3. `useLBPortalController` citește endpointul și cheia din ruta autentificată, compune JSON-ul și face requestul direct către receiver.
4. LB-Portal validează originul, cheia, metoda, ruta și JSON-ul, apoi returnează `requestId` și înregistrează rezultatul pentru consolă.

## Verificare la modificări

- Pentru schimbări de UI/payload Plasma: rulează `node --test tests/Frontend/MosWorkspace.test.cjs tests/Frontend/LBPortalPlayRequest.test.cjs` și `npm run build`.
- Pentru schimbări de receiver LB-Portal: rulează testele unitare de ingress și `npm run build` în LB-Portal.
- Verificarea live cere receiverul pornit, cheia salvată și IP-ul mașinii LB-Portal configurat în Plasma. Răspunsul pozitiv al unui test simulat nu dovedește conectivitatea rețelei; verifică în consola Electron că cererea PLAY a apărut ca acceptată.
- La orice schimbare de adresă, allowlist, autentificare, schemă JSON, confirmare sau semnificație a câmpurilor, actualizează în aceeași intervenție acest document, indexul [README Codex](README.md), documentația pereche din LB-Portal și testele relevante.

## Verificarea etapei de execuție — 15 octombrie 2026

**Etapa de interacțiuni între secțiuni: 90 teste relevante LB-Portal, 12 teste frontend Plasma și 159 verificări Electron izolate — PASS.** Include revenirea pe exact același buffer de titlu după durata de 6 secunde a sursei Nume, păstrarea câmpurilor, anularea revenirii la STOP/acțiune locală/deconectare și persistența regulilor după restart. Editorul mai larg a fost verificat separat la 640/1280/1920 px, fără scroll orizontal, cu șapte capturi revizuite. Aplicația pornește maximizată, cu DevTools dezactivat. Build-ul TypeScript/Vite/NSIS a trecut. Proba Electron a folosit `--skip-captures`, iar instrumentul headless a generat capturile separat; ambele folosesc date temporare/fictive. Etapele, instrumentele și configurarea exemplului sunt descrise în `C:\Projects\LB-Portal\docs\CODEX_SECTION_INTERACTIONS.md`. Codul Plasma/ENPS/HTM și cererea HTTP nu au fost modificate în această etapă. TCP mock verifică protocolul; animațiile și output-ul video rămân de verificat pe LiveBoard real.

**Etapa ulterioară de proiecte: 68 teste LB-Portal, 11 teste frontend Plasma și 110 verificări Electron izolate — PASS.** Au fost verificate migrarea în Telejurnal, mapările distincte Retrospectiva, selecția manuală, refuzul schimbării cu secțiuni active, blocarea execuției Plasma pentru proiecte independente, contextul istoric și persistența proiectului activ după restart fără replay. Capturile au fost revizuite și build-ul TypeScript/Vite/NSIS a trecut. Codul Plasma/ENPS/HTM nu a fost modificat pentru această etapă; documentația pereche și indexurile sunt actualizate. Detaliile sunt în `C:\Projects\LB-Portal\docs\CODEX_MOS_PROJECTS.md`.

Cele 11 teste frontend ale contractului Plasma și cele 48 de teste relevante LB-Portal au trecut. Verificarea Electron izolată a trecut 61 de verificări, folosind receiverul HTTP real și clientul TCP împotriva unui proces mock, cu setări temporare. Acoperă alternarea completă A/B/A, erori și recuperare, resincronizarea offline și restartul fără replay. Build-ul LB-Portal și installerul NSIS au fost generate cu succes; rezultatele și instrumentele sunt consemnate în `C:\Projects\LB-Portal\docs\CODEX_LIVEBOARD_EXECUTION.md`. Codul integrării ENPS și importului HTM nu a fost schimbat în această finalizare. Compatibilitatea vizuală și diacriticele pe LiveBoard real rămân de verificat pe instalație.


Actualizare 24 octombrie 2026: proiectele LB-Portal pot salva grafici fixe configurate de operator (logo, burtieră cu nume/funcție constante). Acestea apar separat în OnAir și sunt lansate prin IPC local și controllerul LiveBoard, fără sursă Plasma/CSV. Banda de jos rămâne vizibilă pentru fiecare proiect selectat și păstrează butonul **Oprește toate** chiar dacă nu există elemente fixe; butonul este activ numai când proiectul afișat este proiectul LiveBoard activ. El trimite `LBC_STOPCONTENT` către toate destinațiile din toate secțiunile proiectului activ și omite restaurările `after-stop`. Contractul HTTP PLAY, receiverul și rutarea TCP LBControl rămân neschimbate; detalii în `C:\Projects\LB-Portal\docs\CODEX_MOS_PROJECTS.md` și `CODEX_LIVEBOARD_EXECUTION.md`.

OnAir LB-Portal acceptă suplimentar fișierul opțional `{prefix}wait_titles_locations.csv`. Fiecare rând este o singură grafică cu valorile `Titlu` și `Locatie`, partajând un singur `Template`; fișierul lipsește fără să invalideze cele patru CSV-uri standard. Acesta este un format local de OnAir și nu schimbă requestul Plasma, ingress-ul HTTP, autentificarea, CORS sau comenzile LiveBoard; formatul complet este documentat în `C:\Projects\LB-Portal\docs\CODEX_ONAIR_CSV.md`.

Lista de titluri OnAir folosește un scroll vertical limitat la panoul disponibil și păstrează spațiu după ultimul card; derularea la capăt face ultimul titlu complet vizibil deasupra barei fixe de jos. Aceasta este o ajustare de afișare LB-Portal și nu schimbă payloadul sau rutarea Plasma.
