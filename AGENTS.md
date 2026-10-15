# Instrucțiuni pentru agenți și chaturi Codex

## Protejarea integrării playlisturilor

Integrarea directă ENPS, importul HTM, refresh-ul playlisturilor și regulile editorului pentru conținutul importat formează un flux coordonat și au fost cerute explicit de utilizator. Tratează-le ca zonă protejată:

- Nu rescrie, elimina, simplifica sau înlocui acest comportament ca efect secundar al unui task fără legătură.
- Înainte de orice schimbare care atinge fluxul, citește [documentația Codex ENPS](docs/codex/enps-playlist-import.md) și verifică testele asociate.
- Modifică zona numai când solicitarea utilizatorului acoperă integrarea ori când schimbarea este direct necesară pentru obiectivul cerut. Păstrează contractele enumerate mai jos și adaugă/actualizează testele și documentația în aceeași intervenție.
- Dacă taskul curent este fără legătură, lasă fișierele și modificările existente intacte. Nu face cleanup, renaming, migrare de arhitectură sau revert în această zonă.
- Dacă găsești schimbări necomise ori intervenții în curs în aceste fișiere, inspectează-le înainte de editare și păstrează-le. Nu suprascrie munca altui agent/chat; restrânge schimbarea la liniile necesare și semnalează suprapunerea în raportul final.
- O solicitare explicită ulterioară a utilizatorului poate autoriza schimbarea acestei zone; aceste instrucțiuni nu blochează cererea utilizatorului.

### Fișiere în aria protejată

- ENPS și adaptare: `app/Services/Enps/**`, `app/Services/Playlists/EnpsPlaylistAdapter.php`, `PlaylistImporter.php`, `PlaylistSourceStorage.php`, `PlaylistTitleExclusions.php`.
- HTTP și rutare: `app/Http/Controllers/EnpsPlaylistImportController.php`, `EnpsTestController.php`, `PlaylistsController.php`, `routes/web.php`.
- Configurație și date: `config/services.php`, `.env.example`, `app/Models/Article.php`, `app/Http/Resources/ArticleResource.php`, migrațiile `*enps*` și `*marker_color*`.
- UI și tipuri: `resources/js/Components/Playlist/EnpsPlaylistImportDialog.tsx`, `resources/js/Pages/Playlist/PlaylistPage.tsx`, `PlaylistShowPage.tsx`, `resources/js/Components/Articles/PlaylistArticleSidebar.tsx`, `ArticleWorkspace.tsx`, `ArticleTextContent.tsx`, `resources/js/types/index.d.ts`.
- Verificări și documentație: `tests/Feature/EnpsPlaylistImportTest.php`, `EnpsWebIntegrationTest.php`, `PlaylistParsingRefreshTest.php`, `docs/codex/**`.

### Contracte care trebuie păstrate

1. Pagina `/playlists` nu contactează ENPS automat; conectarea și catalogul se cer explicit din modal.
2. HTM rămâne o metodă de import și refresh funcțională.
3. ENPS este accesat numai din backend; parola, tokenurile și cookie-urile nu ajung în browser/loguri. Snapshotul este privat și nu conține sesiunea sau credențialele.
4. `RundownContent?returnText=true` este sursa pentru `CollectionScripts`, `ListData.Title`, `BeginText` și `Approved`. Rândurile structurale goale nu trebuie să invalideze story-urile valide.
5. Story-urile se grupează doar când sunt consecutive, după ordinea `ScriptOrder`; badge-urile urmează ordinea segmentelor din playlist.
6. Filtrele „Titluri excluse” se aplică după gruparea story-ului la import și refresh. Refresh-ul ENPS recitește sursa, poate reautentifica la sesiune lipsă/expirată, păstrează imaginile potrivite și nu pierde datele/snapshotul vechi dacă operația eșuează.
7. Markerul vizual ENPS este separat de badge-urile editoriale: galben = fără conținut, roșu = conținut neaprobat, verde = tot conținutul aprobat. Rândurile fără conținut nu schimbă aprobarea story-ului.
8. Corecția naturală a newline-urilor și împachetarea fără ruperea cuvintelor sunt cerințe încă deschise consemnate în documentație; nu afirma că sunt rezolvate fără implementare și verificare în parser și UI.

### Verificări necesare la modificarea zonei

Rulează testele care corespund schimbării dintre `EnpsPlaylistImportTest`, `EnpsWebIntegrationTest` și `PlaylistParsingRefreshTest`. Pentru modificări frontend rulează `npm run build`. Dacă se schimbă un comportament documentat, actualizează [indexul și documentația Codex](docs/codex/README.md) în aceeași intervenție.

## Integrarea Plasma cu LB-Portal

PLAY-ul MOS și receiverul HTTP LB-Portal formează un contract comun între două repo-uri. Înainte de orice modificare la payload, URL, autentificare, CORS, setări, confirmarea receiverului sau viitoarea rutare spre LiveBoard, citește [documentația PLAY MOS → LB-Portal](docs/codex/lb-portal-mos-play.md) și documentul pereche `C:\Projects\LB-Portal\docs\CODEX_PLASMA_INGRESS_CONTRACT.md`.

După fiecare modificare cu impact funcțional, consemnează în aceeași intervenție decizia și efectul în documentația Codex Plasma și LB-Portal, actualizează indexurile ambelor proiecte și ajustează testele contractului. Păstrează distincția dintre recepția HTTP demonstrativă și etapa viitoare de trimitere TCP LiveBoard; nu reintroduce OSCon/OSC ca transport pentru această integrare.
