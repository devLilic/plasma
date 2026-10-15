# Plasma → LB-Portal: PLAY MOS și recepția cererilor

Acest document descrie contractul dintre pagina de operare Plasma și receiverul local din LB-Portal. Înainte de a schimba trimiterea PLAY, autentificarea, adresa sau formatul cererii, citește și documentația pereche din LB-Portal: `docs/CODEX_PLASMA_INGRESS_CONTRACT.md`.

## Scopul etapei curente

Plasma trimite grafica selectată ca JSON prin HTTP către LB-Portal. Receiverul autentifică și înregistrează cererea, rezolvă mapările salvate și programează execuția separat. LB-Portal simulează implicit comenzile fără socket; modul TCP, configurat și conectat manual, folosește numai comenzile LBControl `LBC_`. Confirmarea HTTP înseamnă recepție, nu execuție reușită sau grafică observată în emisie. OSC nu este transport pentru acest flux.

## Configurare și securitate

LB-Portal are și pagina `Setări → Mapări MOS`, unde se salvează secțiuni cu una sau două destinații LiveBoard și mai multe template-uri Plasma. Fiecare template sursă are propria mapare nume parametru → câmp pentru fiecare destinație; grafica fără parametri poate avea tabelul gol. Perechea de buffere (de exemplu, `01_Titlu-1` și `01_Titlu-2`) are o pauză RESUME → PLAY de `0, 50, 100, 150, 200, 250, 500, 1000 ms`, implicit `100 ms`. Ieșirea este configurată per sursă: manual prin RESUME sau automat în template-ul LiveBoard, cu durata implicită de 6 secunde.

Setările sunt locale și versionate, păstrate după repornire. Numele se introduc exact; sugestiile Plasma provin din setările salvate și cererile acceptate. Numele LiveBoard sunt manuale și trebuie să identifice contenturi deja încărcate și obiectele lor text. Contractul editorului este `C:\Projects\LB-Portal\docs\CODEX_MOS_MAPPING_EDITOR.md`; payloadul HTTP rămâne același.

Perechea funcționează ca două grupuri complete: prima cerere scrie toate câmpurile în A, așteaptă propagarea și trimite PLAY A. Următoarea scrie întregul set în B fără schimbarea datelor A, așteaptă propagarea, trimite RESUME A, așteaptă pauza configurată și trimite PLAY B. Apoi alternează invers. Pauza de propagare este implicit 250 ms, cu opțiunile `0, 100, 250, 500, 1000`; toate sursele unei secțiuni folosesc aceeași stare A/B. Parametrii lipsă blochează înainte de scriere, iar cererile identice cu grafica activă nu retrimit comenzile.

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

Plasma face `POST http://<IPv4>:<port>/v1/requests` cu `Content-Type: application/json` și bearer key. Receiverul confirmă acceptarea cu același `requestId`; interfața marchează cererea ca primită numai când răspunsul HTTP este de succes și ID-ul corespunde.

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

Receiverul păstrează cererile recente în memoria procesului și le arată în consola LB-Portal. Repornește aplicația pentru a reinițializa istoricul; nu presupune persistență după închiderea Electron.

Consola afișează secțiunea, template-ul Plasma și mapările fixate la recepție. Raportul de execuție se actualizează separat cu bufferul ales, anterior și următor, ordine, comenzi, răspunsuri și erori. Setările editate ulterior nu schimbă maparea istorică. Parametrii lipsă/suplimentari, template-urile necunoscute și setările indisponibile sunt explicite. HTTP 200 poate fi urmat de execuție blocată/eșuată; confirmarea TCP `Ok` reprezintă acceptarea protocolului, nu observarea video.

## Proiecte în LB-Portal

Proiectele LB-Portal pot configura și interacțiuni între secțiuni: eveniment declanșator, acțiuni ordonate RESUME/STOP/PLAY ori suspendare cu revenire. Exemplu: Nume suspendă Titluri, apoi readuce titlul după durata deja configurată a graficii Nume (6 secunde dacă sursa are 6 secunde). Regula nu adaugă altă durată sau comportament special pentru nume consecutive. Revenirea folosește bufferul și valorile memorate, este anulată la oprire/resincronizare sau stare incertă și apare în jurnal cu identitatea regulii. Detaliile sunt în `C:\Projects\LB-Portal\docs\CODEX_SECTION_INTERACTIONS.md`; payloadul și confirmarea HTTP Plasma rămân aceleași.

Secțiunile sunt organizate în proiecte independente. Plasma poate executa grafica numai în **Telejurnal** și **Retrospectiva săptămânii**, alese manual ca proiect activ în consola LB-Portal. Selectarea unui proiect în editorul de setări schimbă doar proiectul editat. Payloadul Plasma nu conține un selector de proiect și nu activează automat alt proiect.

Cu un proiect pentru operare directă activ, receiverul înregistrează cererea și confirmă recepția HTTP, dar raportul indică `project-disabled`, fără comenzi LiveBoard sau fallback la Telejurnal. Schimbarea proiectului activ cere lipsa operațiilor în curs/coadă și toate secțiunile OFF; activarea nu trimite comenzi. Fiecare proiect are mapări și stare A/B proprii, iar istoricul și deduplicarea păstrează contextul proiectului. Mapările vechi sunt adaptate în Telejurnal fără pierderea identificatorilor sau valorilor. Proiectele pentru operare directă pot salva secțiuni fără surse Plasma; interfața lor de operare este o etapă ulterioară.

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

**Etapa ulterioară de proiecte: 68 teste LB-Portal, 11 teste frontend Plasma și 110 verificări Electron izolate — PASS.** Au fost verificate migrarea în Telejurnal, mapările distincte Retrospectiva, selecția manuală, refuzul schimbării cu secțiuni active, blocarea execuției Plasma pentru proiecte independente, contextul istoric și persistența proiectului activ după restart fără replay. Capturile au fost revizuite și build-ul TypeScript/Vite/NSIS a trecut. Codul Plasma/ENPS/HTM nu a fost modificat pentru această etapă; documentația pereche și indexurile sunt actualizate. Detaliile sunt în `C:\Projects\LB-Portal\docs\CODEX_MOS_PROJECTS.md`.

Cele 11 teste frontend ale contractului Plasma și cele 48 de teste relevante LB-Portal au trecut. Verificarea Electron izolată a trecut 61 de verificări, folosind receiverul HTTP real și clientul TCP împotriva unui proces mock, cu setări temporare. Acoperă alternarea completă A/B/A, erori și recuperare, resincronizarea offline și restartul fără replay. Build-ul LB-Portal și installerul NSIS au fost generate cu succes; rezultatele și instrumentele sunt consemnate în `C:\Projects\LB-Portal\docs\CODEX_LIVEBOARD_EXECUTION.md`. Codul integrării ENPS și importului HTM nu a fost schimbat în această finalizare. Compatibilitatea vizuală și diacriticele pe LiveBoard real rămân de verificat pe instalație.

