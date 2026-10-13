# Importul playlisturilor ENPS în Plasma

Acest document este referința funcțională pentru integrarea ENPS, importul HTM compatibil, refresh-ul playlisturilor și marcajele vizuale ENPS. Citește-l înainte de orice schimbare în aceste zone. Regulile pentru agenți și fișierele protejate sunt în [AGENTS.md](../../AGENTS.md).

## Scop și limite

Un playlist ENPS importat devine o copie locală, editabilă în Plasma. Nu există sincronizare automată după import. Sincronizarea se face numai când utilizatorul apasă **Refresh playlist**. Importul local HTM rămâne disponibil ca alternativă și își păstrează parserul și ruta existente.

## Interfață și flux

Pagina playlistului are acum fluxul operațional [Pregătire / LIVE și OSCon](playlist-live-oscon.md). Descrierile de mai jos ale vizualizării istorice cu text integral și carduri MOS separate documentează parserul și componentele de bază; interfața operațională separă preview-ul imaginii de articolul MOS, păstrând ordinea și fragmentele calculate din sursa originală.

- Pagina `/playlists` nu inițiază conexiuni ENPS la încărcare.
- Acțiunea principală este **Importă din ENPS**. Opțiunea de import HTM rămâne secundară și disponibilă.
- Conectarea ENPS și citirea catalogului au loc numai în modalul de import, deschis explicit de utilizator. Lista poate fi căutată și reîncărcată.
- Acțiunile ENPS și HTM stau compact pe același rând când spațiul permite; ENPS are vizual prioritate, HTM rămâne alternativa secundară.
- Fiecare rând de catalog afișează titlul și dedesubt data/ora fără prefixul „Data și ora:”, cu contrast suficient. Valoarea `workAt` este derivată din câmpurile de dată/oră ale înregistrării ENPS, cu fallback la data/ora dintre parantezele pătrate din titlu; este interpretată în `ENPS_WEB_TIMEZONE` (implicit `Europe/Chisinau`).
- Selectarea unui playlist nou începe importul. Modalul arată progresul; erorile operaționale apar în notificarea globală din colțul din dreapta jos, iar modalul rămâne disponibil pentru o nouă încercare. La succes se închide și aplicația deschide `/playlists/{id}`.
- Pentru o sursă deja importată sunt disponibile deschiderea copiei locale sau importarea unei copii noi.
- Pagina playlistului afișează titlul playlistului în editor, lista articolelor și butonul **Refresh playlist**. Butonul folosește ruta compatibilă existentă `playlists.refresh-parsing`.

## Configurare și securitate

Valorile de conectare se configurează numai în `.env` local. `.env.example` trebuie să conțină doar exemple, niciodată credențiale reale.

```dotenv
ENPS_WEB_URL=http://95.65.10.186:8808/enpswebaccess3/
ENPS_WEB_USERNAME=
ENPS_WEB_PASSWORD=
ENPS_WEB_DOMAIN=
ENPS_WEB_TIMEZONE=Europe/Chisinau
ENPS_WEB_TIMEOUT=20
```

După schimbarea configurării, se poate rula `php artisan config:clear` dacă aplicația folosește config cache. Domeniul poate fi dedus din numele utilizatorului.

Cererile ENPS se fac exclusiv din backend. Tokenurile și cookie-urile sunt păstrate criptat în sesiunea Laravel; parola, tokenurile și răspunsul brut nu se expun browserului și nu se scriu în loguri. Sesiunea lipsă sau expirată este refăcută la acțiunea explicită: catalogul se poate reconecta, iar **Refresh playlist** verifică sesiunea și se autentifică din nou dacă lipsește ori a expirat. Nu se face autentificare automată doar prin deschiderea paginii `/playlists`.

## Contractul ENPS și adaptorul

Integrarea ENPS este **read-only pentru conținut**: Plasma citește sursa, fără să trimită modificări de titlu, text, grafică sau playlist către ENPS. Apelurile existente de autentificare și citire a catalogului rămân parte din acest flux. Editările locale din Plasma nu se sincronizează înapoi în ENPS.

Catalogul folosește `POST /api/Lists`. Conținutul playlistului folosește `GET /api/RundownContent` cu `returnText=true`, identificat prin baza de date, cale și GUID. Răspunsul relevant este `CollectionScripts`. În fiecare rând, datele folosite sunt în principal:

- `RecordPointer.ListData.Title`: slugul tehnic, de regulă cu segmentul la final;
- `RecordPointer.ListData.BeginText`: conținutul editorial și marcajele de secțiune;
- `RecordPointer.ListData.Approved` sau `RecordPointer.ObjectProperties[FieldName=Approved].FieldValue`: starea de aprobare;
- `RecordPointer.ObjectProperties[FieldName=Text].FieldValue` și `LinkedRecords` / `ObjectLinks.LinkedRecords`: surse suplimentare pentru a stabili dacă rândul are conținut;
- `ScriptOrder`: ordinea ENPS.

La importul unui playlist și la **Refresh playlist**, backendul cere și `GET /api/BasicContent?database=...&path=...&guid=...&hitHighlightTerm=` pentru fiecare înregistrare adresabilă din `CollectionScripts`, **cu excepția segmentelor INTRO/INTO**. Se preiau BETA/OFF/SNC/LIVE și celelalte segmente, inclusiv elementele care vor fi excluse din editor. INTRO este recunoscut după sufixul slugului sau segmentul explicit ENPS și nu produce cereri BasicContent. Identitatea provine din `RecordPointer.ListData`/`ObjectProperties`; baza și calea folosesc sursa playlistului ca fallback. GUID-ul elementului este obligatoriu, iar GUID-ul din răspunsul BasicContent trebuie să corespundă cererii. Referințele repetate la aceeași înregistrare folosesc un singur apel în acea operație, dar se păstrează toate aparițiile în playlist. Tokenurile și cookie-urile se actualizează între cereri, exclusiv în backend.

`RundownContent` rămâne sursa titlului, rezumatului editorial `BeginText`, ordinii și aprobării. `BeginText` poate fi limitat de ENPS la 1.000 de caractere, inclusiv în mijlocul unui cuvânt. Pentru segmentele fără INTRO, adaptorul folosește continuarea din `BasicContent.ObjectProperties[FieldName=Text].FieldValue` numai dacă textul complet este mai lung și începe cu întregul rezumat, după normalizarea spațiilor. Un text diferit, absent sau invalid nu înlocuiește rezumatul; un rezumat gol rămâne gol. INTRO continuă să folosească sursa RundownContent. `BasicContent.ListData.BeginText` nu este folosit pentru recuperare, deoarece poate fi limitat la fel. Catalogul și pagina diagnostică `/enps-test` nu cer BasicContent doar pentru afișarea story-urilor.

Rândurile structurale fără înregistrare/GUID sunt omise de la cererile BasicContent și nu invalidează story-urile valide. `Guid=0` și GUID-ul UUID complet nul sunt tratate ca lipsă de identificator: ENPS poate întoarce o altă înregistrare dacă se cere BasicContent cu `guid=0`. Rândurile fără `ListData` ori titlu sunt ignorate de adaptor, iar `BeginText` absent, nul sau gol este acceptat ca text gol. Un răspuns fără `CollectionScripts` valid, fără niciun articol importabil, un element cu titlu dar fără GUID sau un răspuns BasicContent invalid reprezintă eroare, nu import parțial.

### Datele MOS din BasicContent

`ObjectProperties[FieldName=TextCommands].FieldValue` este un dicționar indexat după ID-ul comenzii din HTML (`ObjectProperties.Text`). Fiecare valoare poate conține un XML MOS învelit în paranteze pătrate. Valorile grafice sunt în `mosExternalMetadata/mosPayload/editableObject`, în câmpurile `name` și `value`, de exemplu `Titlu`, `NUME`, `Functie`. Numele/funcțiile repetate rămân blocuri separate, identificate prin `commandId`, `itemId`, `objectId`, `mosId` și `slug`.

`EnpsBasicContent` extrage aceste câmpuri în `mos_objects`, normalizând spațiile NBSP din XML, inclusiv cele dintre atribute. Nu încarcă entități externe; comenzile XML neparsabile nu produc obiecte extrase, dar rămân păstrate în BasicContent pentru inspecție. Exemplul real din `tests/Fixtures/enps/basic-content.json` conține un titlu și patru blocuri nume–funcție; numai thumbnail-urile base64 sunt eliminate din fixture. La import, răspunsul stocat își păstrează thumbnail-urile. Valorile sunt agregate pe story de `EnpsPlaylistAdapter`, în ordinea segmentelor consecutive. Comenzile identice partajate între segmentele aceluiași story apar o singură dată; story-urile neconsecutive și comenzile cu ID-uri distincte rămân separate. Migrarea `2026_10_03_150000_add_mos_objects_to_articles_table.php` adaugă `articles.mos_objects`, actualizat la import/refresh. `ArticleResource` trimite doar `commandId`, `slug` (tipul graficii) și `editableObjects`, fără XML, thumbnail-uri, căi sau antete. Componenta `ArticleMosContent` afișează tipul graficii și valorile într-un card separat, sub întregul bloc imagine + intro (sau sub cardul intro când lipsește imaginea), înaintea editorului imaginii. În „Tot textul”, textul integral este în coloana din stânga, iar lista MOS/VOX completată cu toate graficele afișabile este în coloana din dreapta, prin `ArticleMosTimeline`. Textul MOS este redat ca text React, fără HTML executabil; valorile nu sunt trunchiate. Elementele fără valori editabile nu afișează un card gol.

Fiecare obiect MOS afișează numai tipul graficii (`slug`, de exemplu `06_Nume_Ultima_Ora`) și valorile editabile, în ordinea din sursă. Etichetele câmpurilor (`TITLU`, `NUME`, `FUNCTIE` sau alte nume) nu se afișează. Numele câmpurilor rămân în date pentru extragere și stilizare; această regulă de afișare se aplică tuturor vizualizărilor care folosesc `ArticleMosContent`.

Grafica `05_Titlu_Ultima_Ora` poate conține câmpurile `Titlu` și `Titlu scurt`. Acestea sunt tratate general, în orice știre/playlist și inclusiv în alte grafici cu aceleași câmpuri. `EnpsBasicContent::editableRole` identifică rolul după numele câmpului, normalizând majusculele și secvențele de spații Unicode (inclusiv NBSP), fără a folosi poziția, textul valorii sau ID-ul știrii. `ArticleResource` adaugă `role` la fiecare element din `mos_objects[].editableObjects[]`: `title` pentru `Titlu`, `short_title` pentru `Titlu scurt`, `value` pentru celelalte câmpuri. Tipul TypeScript `MosEditableObject` include acest rol obligatoriu. Clasificarea se face la serializare, inclusiv pentru datele deja salvate; JSON-ul din baza de date și snapshoturile rămân neschimbate, fără migrare sau reimport.

La importul/refresh-ul comenzii cu slugul `05_Titlu_Ultima_Ora`, numai valoarea `Titlu scurt` este normalizată în sentence case Unicode: trece prin majuscule și apoi litere mici, cu prima literă păstrată majusculă. Astfel, `ULTIMA ORĂ` sau `Ultima orĂ` devine `Ultima oră`. Titlul principal și câmpurile din alte grafici rămân neschimbate. Datele existente primesc corecția la următorul refresh ENPS.

Cele două valori rămân în același card sub denumirea graficii, în ordinea sursei și pe rânduri separate. Titlul obișnuit păstrează culoarea `#2c3443`; numai câmpul cu rolul `short_title` are text roșu `#d62f28`. Nu se adaugă etichete vizibile, butoane de copiere sau editare. Câmpurile goale sunt omise ca înainte; un titlu scurt lipsă/gol nu produce un rând suplimentar. Regula se aplică tuturor vizualizărilor prin componenta comună `ArticleMosContent`.

Verificarea în browser cu componenta efectivă, CSS-ul compilat și datele serializate ale articolului existent confirmă culorile, ordinea și același card la 1100 și 390 px. Serializarea nu modifică datele stocate și nu cere ENPS.

### Aparițiile MOS și VOX în text

`ArticleMosTimeline` scanează textul complet al elementelor BasicContent deja salvate în `playlist_enps_items`, selectate după playlist și slugurile articolului, în ordinea sursei. Comenzile MOS din HTML nu sunt text de căutare. Sursele identice sunt scanate o singură dată. Dacă nu există Text salvat, se folosește textul secțiunilor articolului, fără apel ENPS și fără inventarea marcajelor șterse anterior. Scanarea nu rescrie articolul, imaginile, evidențierile sau sursa. Declarațiile rămân integral la locul lor în coloana de text; nu se extrag în blocuri noi de sincron.

API-ul adaugă `mos_timeline`: apariții `mos`/`vox`, poziția în octeți UTF-8 și rândul din sursa de scanare, obiectul MOS afișabil, fragmentul de început și numărul de VOX-uri, când este cunoscut. Aparițiile găsite urmează pozițiile din text, indiferent de ordinea obiectelor MOS. La serializare, `forArticle` completează lista cu orice grafică afișabilă din `mos_objects` care nu este deja reprezentată. Elementele lipsă de la începutul listei „ELEMENTE MOS” sunt puse înaintea tuturor aparițiilor, cele de la sfârșit după toate aparițiile, iar cele din mijloc înaintea primei apariții a următoarei grafici cunoscute din ordinea MOS. Elementele lipsă consecutive își păstrează ordinea. Aparițiile găsite în text, inclusiv VOX și sincroanele repetate, nu se reordonează. Dacă nu există nicio grafică găsită, graficele se adaugă în ordinea MOS înaintea eventualelor VOX-uri. Pentru o grafică adăugată, `position` și `sourceLine` sunt `null`, iar `snippet` este gol: nu se inventează o poziție sau o declarație și nu se afișează mesajul despre începutul intervenției. Creditele și graficele cu alte câmpuri sunt incluse prin aceeași regulă. Elementele fără valori afișabile sunt omise, iar titlurile identice continuă să fie reprezentate o singură dată după conținut, indiferent de ID. Pentru grafici de titlu se caută numai câmpul cu rolul `title`; titlul scurt nu produce potriviri, dar rămâne afișat cu roșu în același card. Potrivirea ignoră majusculele, diacriticele, punctuația și NBSP. Pentru numele persoanelor se acceptă și ordinea inversată a cuvintelor sau o singură literă diferită într-un cuvânt de minimum cinci litere.

Numele se caută în identificările `SINCRON`, `SNC`, `PRIN TELEFON`, `STAND UP` ori într-un rând separat de nume. STAND UP este un sincron. O simplă menționare în narațiune nu adaugă un card. Fiecare sincron identificat produce o intrare, inclusiv intervențiile repetate ale aceleiași persoane. Titlurile cu același conținut apar o singură dată, la prima poziție găsită, indiferent de ID-ul comenzii MOS sau de repetările din script. Comparația folosește valorile titlului obișnuit și ale titlului scurt, normalizate; un titlu scurt diferit păstrează o grafică distinctă. Cardul păstrează numai tipul graficii și valorile fără etichete de câmp; dedesubt apar primele maximum șapte cuvinte ale intervenției, după funcție/nume și curățarea tehnică. Fragmentul se oprește înaintea următorului marcaj de bloc sau intervenție; lipsa declarației nu împrumută textul altui vorbitor.

Marcajele VOX consecutive pot fi grupate în listă, fără a traversa un marcaj TEXT/INTRO/BETA/OFF/LIVE sau o altă intervenție. `VOX 1` și `VOX 2` reprezintă două apariții, nu trei; numerele pot fi identificatori. Un marker colectiv `VOXURI` fără număr apare ca „VOX-uri”, fără un număr presupus. Numărul explicit din `VOXURI 3` sau `VOX x3` este respectat. Pe ecrane înguste coloanele se așază una sub alta, cu textul înaintea listei.

În fragmentul de început al sincronului se elimină metadatele de producție dinaintea replicii: căi/identificatori media, `TITRE`, `TC` (inclusiv precedat de ID media sau fără timecode după marcaj), perechea inițială ID media + timecode fără etichetă (`8488 03:40`, `8489 02 53` ori ID și timecode pe rânduri separate, ca `8526` urmat de `00:16-00:45`), `T C`, `T.C.`, prefixul `Video nr` cu variantele sale de punctuație și intervalele marcate cu `TC`, inclusiv cele separate prin cratimă, puncte de suspensie sau elipsă (`00:59 … 01:14`). Numerele rostite după aceste prefixe rămân în fragment și se numără între primele șapte cuvinte; de exemplu, „Eu aveam fix 60 de ani” păstrează `60`, iar „Este necesar să avem 2 donatori în 2026” își păstrează ambele numere. Pentru `SNC: FLORENTIN PARMETIER` urmat de `TITRE 27:49–28:00:` și declarația „Aș spune că apropierea de Uniunea Europeană va ajuta”, fragmentul începe cu „Aș spune că apropierea de Uniunea Europeană”. Această regulă privește numai fragmentul din lista MOS; cifrele din textul integral nu se modifică.

Un rând de identificare fără SINCRON/SNC este recunoscut și când numai numele este scris cu majuscule, iar funcția are litere normale (`OLEG OZEROV, ambasadorul ...`). Numele cu litere mixte este acceptat când restul rândului corespunde funcției MOS. Rândurile de narațiune de tip „... spune/declară ...” și creditele `REPORTER:`, `Imagine:`, `Montaj:` nu sunt intervenții. Fragmentul se oprește și înaintea următoarei persoane identificate fără marcaj, astfel încât un sincron gol/scurt să nu preia cuvintele celuilalt vorbitor.

Textul dintre paranteze (inclusiv note fără etichetă și paranteze imbricate) și referințele de fișiere cu spații nu intră în fragment. Prima replică se păstrează chiar dacă este o întrebare. Pentru `TITRE: (montaj: insist să punem cu întrebarea noastră) - Atunci, vă rog să menționați, ...`, fragmentul începe cu „Atunci vă rog să menționați”. Fixture-ul real `tests/Fixtures/enps/unmarked-sync.json` verifică cele două intervenții ale lui Oleg Ozerov în „AMBASADOR RUS CONVOCAT”, în ordinea sursei: „Atunci vă rog să menționați în mod” și „Nu știu Vorbiți despre situații ipotetice puțin”. Regula este generală și nu depinde de persoană, știre sau playlist; textul complet, inclusiv întrebarea și parantezele, rămâne la locul lui.

Acoperire: `ArticleMosTimelineTest` verifică sursa reală cu titlu, standup, VOX și sincron, repetarea persoanelor, lipsa potrivirilor în narațiune, titlul obișnuit, deduplicarea titlurilor fără eliminarea sincroanelor repetate, gruparea VOX, curățarea celor șapte cuvinte, serializarea fără mutații/cereri și confidențialitatea. `tests/Frontend/ArticleMosTimeline.test.cjs` verifică lista și coloanele, păstrarea declarațiilor și evidențierilor, afișarea graficilor negăsite fără fragmente de sincron inventate, culorile și escaparea textului.

Verificarea în browser a componentei efective cu CSS-ul compilat și datele articolelor existente confirmă cele două coloane la 1100/820 px și așezarea succesivă la 390 px, fără overflow. Cele zece paragrafe ale știrii cu dronele, inclusiv ultima frază, rămân în coloana de text. Lista este titlu → standup Gabriela Suleac → VOX-uri → sincron Anatolie Nosatîi. Grafica reală `05_Titlu_Ultima_Ora` apare o singură dată, cu ambele valori în același card și titlul scurt roșu. Verificarea serializării confirmă că datele articolelor nu sunt modificate.

`EnpsPlaylistAdapter` convertește ENPS în modelul comun de articole folosit și de importul HTM:

1. Sortează după `ScriptOrder` și grupează numai rândurile consecutive cu același nume de story. Astfel păstrează ordinea playlistului și nu unește story-uri separate.
2. Separă sufixul de segment din slug; segmentele recunoscute includ `INTRO`/`INTO`, `BETA`, `OFF`, `LIVE`, `SNC`, `SINCRON`, `AMB`, `TEASE`, `FAKE` și `TEXT`. Tipurile și badge-urile păstrează ordinea primei apariții în playlist.
3. Folosește `TITLU:`/`TITLE:` din `BeginText` pentru titlul editorial, iar slugul fără segment pentru numele tehnic și potrivirea imaginilor.
4. Împarte textul pe marcaje de secțiune (`INTRO`, `OFF`, `BETA` etc.) la început de rând: etichetă izolată, etichetă cu două puncte sau etichetă majusculă urmată de spațiu și text (`OFF Text...`). Când nu există marcaje, textul este atribuit secțiunii `INTRO`. Textul fără etichetă înaintea primului OFF/BETA/LIVE rămâne intro și se oprește la acel marcaj; un preambul tehnic înaintea unui INTRO explicit este eliminat. Cuvinte precum `OFFICIAL` sau menționarea LIVE în interiorul unei fraze nu sunt marcaje. Dacă există un segment sursă INTRO cu text, se preferă intro-ul lui față de variantele repetate în sursele BETA/OFF. Antetele nu devin conținut; paragrafele identice din aceeași secțiune sunt eliminate fără a reordona textul rămas.
5. Elimină metadatele tehnice recognoscibile (căi, identificatori, timecode-uri și rânduri placeholder), păstrând declarațiile și toate paragrafele ulterioare. Curățarea nu oprește parsarea la primul detaliu tehnic.
6. Aplică lista curentă **Titluri excluse** după gruparea tuturor segmentelor story-ului. Un termen găsit în titlul tehnic elimină articolul întreg. Setarea nu modifică retroactiv playlisturile deja importate; se aplică la import și la refresh.

Titlul tehnic rămâne pentru identificare, deduplicare și matching. În interfața articolelor se preferă titlul/subtitlul editorial; prefixele tehnice ENPS `MD` și `RO` nu trebuie adăugate ca detalii vizibile în titlul editorial extras. Dacă sursa nu conține `TITLU:`/`TITLE:`, se folosește fallback-ul existent al articolului.

### Starea galbenă, roșie și verde

Fiecare articol ENPS poate avea o bară verticală de 3 px înaintea rândului în sidebar. Culoarea este calculată din toate rândurile ENPS grupate în story:

| Culoare | Semnificație în Plasma | Regulă |
|---|---|---|
| Galben | Rând creat, fără conținut | Niciun rând din grup nu are text în `BeginText`/`ObjectProperties.Text` și nu are înregistrări legate. |
| Roșu | Are conținut, dar nu este aprobat | Există conținut, iar cel puțin un rând cu conținut nu are `Approved=true`. |
| Verde | Conținut aprobat | Există conținut și toate rândurile cu conținut au `Approved=true`. |

Rândurile goale nu afectează aprobarea unui grup dacă alt segment conține text sau media. Pentru playlisturi ENPS vechi, după introducerea câmpului de culoare, **Refresh playlist** recitește sursa și completează culoarea. Articolele HTM/manuale nu au stare ENPS și folosesc stilul neutru.

## Sursa, snapshotul și persistența

Playlistul salvează tipul sursei și identificatorii ENPS (`database`, `path`, `guid`), iar un snapshot privat permite o nouă parsare fără să fie necesară o captură manuală a răspunsului. Snapshotul păstrează datele necesare reimportului, inclusiv `Title`, `BeginText`, GUID și `Approved` (cu indicatori interni pentru conținut/aprobare), precum și BasicContent și identitatea fiecărui element. `EnpsBasicContent::forStorage` păstrează câmpurile înregistrării și elimină câmpurile de sesiune/credențiale, fără antetele HTTP. Snapshotul este șters la ștergerea playlistului. Imaginile asociate articolelor sunt relații locale și se păstrează la refresh când story-ul poate fi potrivit cu articolul existent.

Migrarea `2026_10_03_140000_create_playlist_enps_items_table.php` creează `playlist_enps_items`. Relația `Playlist::enpsItems()` păstrează fiecare apariție preluată (fără INTRO) în ordinea ENPS, independent de gruparea articolelor și filtrele editorului: poziție, ScriptOrder, slug, baza/calea/GUID-ul sursei, `basic_content` (JSON în longText, pentru thumbnail-uri mari) și `mos_objects`. Payloadurile și identificatorii sunt ascunși la serializarea modelului și nu sunt trimiși implicit în browser. Ștergerea playlistului elimină aceste rânduri prin cheia externă cu cascade.

Importul și refresh-ul preiau toate răspunsurile BasicContent eligibile (fără INTRO), validează și parsează datele înainte de modificarea playlistului. Persistența articolelor, înlocuirea tuturor rândurilor `playlist_enps_items` și înlocuirea snapshotului sunt coordonate în aceeași tranzacție astfel încât un răspuns ENPS invalid sau o eroare la salvare să nu lase date parțiale; la refresh, datele și snapshotul vechi rămân intacte. La refresh, articolele ENPS dispărute sau excluse sunt eliminate din playlistul sincronizat, iar elementele sursă dispărute sunt eliminate din `playlist_enps_items`.

Migrarea `2026_10_03_130000_add_enps_marker_color_to_articles_table.php` adaugă `articles.enps_marker_color`, nullable, cu `yellow`, `red`, `green` pentru sursele ENPS. Nu stocați culorile în `article_types`: badge-urile de segment și starea ENPS au semnificații diferite.

## Refresh playlist

Ordinea operației este: verificarea/autentificarea ENPS, recitirea `RundownContent` și a tuturor BasicContent eligibile (fără INTRO), parsarea și gruparea în ordinea ENPS, potrivirea articolelor existente și păstrarea imaginilor, apoi aplicarea filtrelor curente **Titluri excluse** înainte de sincronizarea finală. Expirarea sesiunii inclusiv în timpul preluării BasicContent permite o reautentificare și reluarea preluării complete. Playlisturile vechi primesc datele BasicContent la următorul refresh explicit, fără apeluri ENPS automate sau backfill la migrare.

- ENPS: recitește textul și starea curentă din sursă. Înlocuiește editările locale de titlu/text/ordine cu versiunea ENPS, adaugă story-uri noi, elimină story-urile dispărute și aplică excluderile actuale.
- HTM: reparsare locală din fișierul sursă stocat, fără cerere ENPS.
- Dacă ENPS nu răspunde, sesiunea nu poate fi reînnoită, parserul respinge răspunsul sau salvarea eșuează, playlistul și snapshotul anterior rămân disponibile. Utilizatorul poate relua acțiunea după remedierea problemei.
- Pentru erorile interne neașteptate, logul conține numai ID-ul playlistului, etapa (`connection`, `source`, `parsing`, `snapshot`, `persistence`) și clasa excepției. Nu se loghează mesajul brut, SQL-ul, răspunsul ENPS sau sesiunea. Mesajul generic din interfață nu identifică singur cauza; înainte de diagnosticare, verificați și că migrările MOS sunt aplicate în baza folosită de aplicație.

În lista editorului, denumirea completă a playlistului este afișată sus în sidebarul din stânga, ca utilizatorul să poată identifica playlistul editat. Pregătire / LIVE și Refresh playlist sunt grupate în dreapta headerului, lângă selectorul utilizatorului. Lista articolelor preferă numele editorial și arată badge-urile pe fiecare story în ordinea în care segmentele au apărut în ENPS; slugul tehnic servește ca fallback și pentru asocierea sursei.

## Reguli pentru editarea textului

Textul HTML complet din BasicContent este extras cu DOM, păstrând delimitările de rând și paragraf, fără a încărca resurse externe. Comenzile MOS și elementele `head`, `script`, `style`, `template` nu devin text editorial. Valorile MOS se extrag separat din TextCommands, prin mecanismul existent.

Curățarea elimină rândurile de producție majuscule `STAND UP`, `BRUT`, `VOXURI` și `AMBIANȚĂ`. Identificatorii media de minimum trei cifre, cu sau fără descriere, se elimină numai în contextul unei intervenții și când următorul rând începe cu un timecode. Marcajele explicite `T.C.`/`TIMECODE`, intervalele lor și indicațiile „musca” se elimină de la începutul declarației; timpul de intrare/ieșire al unei intervenții se elimină fără a pierde cuvintele dintre ele. Identificările `Sincron ...` și `Prin telefon: ...` rămân în text, la fel ca orele editoriale din fraze (`7:45 - 8:00`) și anii. URL-urile și căile de fișiere se elimină ca fragmente, păstrând textul și punctuația care urmează. Rândurile de conținut `TEXT` rămân secțiuni conform regulilor existente.

Fixture-ul `tests/Fixtures/enps/truncated-beta.json` reproduce sursa reală „DRONE SI RACHETE MOLDOVA”: rezumatul BETA se oprește la 1.000 de caractere, la „8074 drona ha”, iar Text din BasicContent conține continuarea până la „își modernizează armata.” Testele verifică recuperarea integrală, eliminarea fragmentelor tehnice, păstrarea declarațiilor/orelor editoriale și importul/refresh-ul cu imaginea existentă păstrată. Această recuperare se aplică general oricărui segment eligibil, fără condiții legate de știre sau playlist. Componenta React `ArticleTextContent`, redată cu CSS-ul compilat și datele serializate ale știrii existente, a fost verificată în browser la 1100 și 390 px: toate cele zece paragrafe sunt în pagină, inclusiv cele trei intervenții și ultima frază; paragrafele nu sunt trunchiate și nu au overflow orizontal.

`BeginText` poate conține newline-uri Windows (`CRLF`), newline-uri (`LF`/`CR`) ori reprezentări escapate literal (`\\r\\n`, `\\n`, `\\r`), precum și marcaje HTML de rând (`<br>`, `</p>`). Parserul le normalizează la newline înainte de împărțirea pe secțiuni, inclusiv separatorii Unicode U+2028/U+2029. Spațiile inseparabile U+00A0/U+202F/U+2007 devin spații obișnuite; soft hyphen U+00AD, zero-width space U+200B și BOM U+FEFF sunt eliminate. Rândurile editoriale consecutive se unesc cu un spațiu într-un paragraf; rândurile goale, metadatele și marcajele de secțiune păstrează delimitările. Titlurile `TITLU:`/`TITLE:` sunt extrase, iar rândurile cu acești marcatori nu sunt afișate ca text de secțiune.

Editorul afișează secțiunile structurate separat, permite evidențierea fragmentelor și limitează intro-ul din vizualizarea imaginii la șase rânduri. Intro-ul și paragrafele din „Tot textul” folosesc `whitespace-normal`, `break-normal`, fără despărțire automată în silabe sau `overflow-wrap:anywhere`: cuvintele care nu încap trec integral pe rândul următor. Utilitarul `editorialText.ts` normalizează spațiile și caracterele de control și pentru importurile deja salvate; `introPreview` oprește afișarea înaintea primului marcaj de bloc, înainte să unească rândurile. Această corecție de afișare nu rescrie datele existente; următorul refresh ENPS actualizează secțiunile salvate prin parser. Validarea evidențierilor compară textul după aceeași normalizare a spațiilor/controlului, astfel încât evidențierea unui import vechi să funcționeze și să respingă în continuare modificarea cuvintelor.

Corecția a fost verificată cu textul real „MAIA LA HELSINKI” din snapshotul local, păstrat fără modificarea NBSP/CRLF în `tests/Fixtures/enps/maia-helsinki.json`. Testele parserului verifică intro-ul exact, separarea OFF fără două puncte, toate marcajele și delimitările paragrafelor. Componentele React efective, redate într-o pagină temporară cu CSS-ul compilat și datele reale, au fost verificate în browser la 1100, 820 și 390 px: niciun cuvânt din intro nu ocupă două rânduri, iar MOS este un card separat sub intro în modurile cu imagine, fără imagine și „Tot textul”. Verificarea vizuală folosește componentele și datele; nu presupune o sesiune autentificată în browserul utilizatorului.

## Fișiere de referință

| Responsabilitate | Fișiere principale |
|---|---|
| Client, sesiune și contract ENPS, extragere MOS | `app/Services/Enps/EnpsWebClient.php`, `EnpsWebSession.php`, `EnpsWebException.php`, `EnpsBasicContent.php` |
| Persistență BasicContent pe element | `app/Models/PlaylistEnpsItem.php`, `app/Services/Playlists/EnpsPlaylistItems.php`, migrarea `create_playlist_enps_items` |
| Adaptare ENPS, import comun, snapshot, excluderi | `app/Services/Playlists/EnpsPlaylistAdapter.php`, `PlaylistImporter.php`, `PlaylistSourceStorage.php`, `PlaylistTitleExclusions.php` |
| Rutare și acțiuni backend | `app/Http/Controllers/EnpsPlaylistImportController.php`, `PlaylistsController.php`, `EnpsTestController.php`, `routes/web.php` |
| Configurare și model/persistență stare | `config/services.php`, `.env.example`, `app/Models/Article.php`, `app/Http/Resources/ArticleResource.php`, migrarea ENPS marker |
| Import modal și pagina editorului | `resources/js/Components/Playlist/EnpsPlaylistImportDialog.tsx`, `resources/js/Pages/Playlist/PlaylistPage.tsx`, `PlaylistShowPage.tsx` |
| Rânduri și text articol | `resources/js/Components/Articles/PlaylistArticleSidebar.tsx`, `ArticleWorkspace.tsx`, `ArticleTextContent.tsx`, `ArticleMosContent.tsx`, `resources/js/types/index.d.ts` |
| Acoperire automată | `tests/Feature/EnpsPlaylistImportTest.php`, `EnpsPlaylistBasicContentTest.php`, `EnpsWebIntegrationTest.php`, `PlaylistParsingRefreshTest.php` |

## Verificare

Rulează testele relevante după orice schimbare a acestui flux și compilarea frontendului după schimbări de interfață:

```powershell
php artisan test --filter=EnpsPlaylistImportTest
php artisan test --filter=EnpsPlaylistBasicContentTest
php artisan test --filter=EnpsWebIntegrationTest
php artisan test --filter=PlaylistParsingRefreshTest
php artisan test --filter=ArticleTextHighlightTest
php artisan test --filter=ArticleMosTimelineTest
node --test tests/Frontend/ArticleMosContent.test.cjs
node --test tests/Frontend/ArticleMosTimeline.test.cjs
npm run build
```

Testele verifică importul cu rânduri goale, ordinea story-urilor și badge-urilor, parsarea secțiunilor, culorile calculate din conținut și `Approved`, filtrele de titlu, duplicatele, autentificarea/reautentificarea inclusiv în BasicContent, tokenurile, rollback-ul, păstrarea imaginilor și compatibilitatea HTM. Testele BasicContent verifică separat toate elementele eligibile, excluderea INTRO și preluarea elementelor filtrate în editor, valorile MOS din exemplul real, reînnoirea și eliminarea elementelor, confidențialitatea, erorile parțiale HTTP și rollback-ul după ștergerea rândurilor vechi. Fixture-ul real `tests/Fixtures/enps/two-titles-basic-content.json` păstrează comanda MOS cu două titluri, fără thumbnail-ul base64. Testele verifică rolurile la serializarea datelor vechi în mai multe playlisturi și grafici, ordinea inversată, normalizarea spațiilor/majusculelor și absența mutațiilor/cererilor ENPS la afișare. Testele frontend verifică același card pentru ambele titluri, culoarea roșie exclusiv pentru titlul scurt, valori independente și câmpuri goale, fără etichete vizibile.
