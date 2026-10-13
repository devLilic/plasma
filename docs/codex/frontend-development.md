# Pornirea frontendului în dezvoltare

`npm run dev` pornește serverul Vite și transformă modulele la cerere; nu rulează TypeScript (`tsc`) sau buildul de producție. `npm run build` rulează separat `tsc && vite build`.

## Întârzierea la prima pornire

Configurația implicită Vite scana dependențele din entrypointul Inertia și din paginile referite prin `import.meta.glob`. La măsurarea locală din 12 octombrie 2026, scanarea cu cache gol a durat circa 31 secunde. Configurarea serverului în sine a fost mult mai rapidă; întârzierea continua după mesajul de readiness.

`vite.config.js` folosește acum `optimizeDeps.noDiscovery: true` și include explicit toate cele 18 dependențe identificate de optimizerul existent, inclusiv intrările React, bibliotecile UI și helperul Inertia. Aceasta evită scanarea întregului arbore de pagini la pornire și precompilează dependențele cunoscute. Lista trebuie actualizată când se adaugă o dependență de browser care necesită optimizare, în special un pachet CommonJS.

Comparația a folosit același proiect și configurație, cache-uri goale separate și `transformRequest` în același proces Vite pentru `app.tsx`, `app.css` și `PlaylistShowPage.tsx`. Timpul total măsurat pentru pornire, scanare și cele trei transformări a scăzut de la aproximativ 62 la 36 secunde (circa 42%). Cu cache păstrat, configurarea serverului a durat circa 174 ms și toate cele trei transformări au reușit. Timpii includ operațiile locale de fișiere și compilarea CSS și pot varia; nu reprezintă timpul integral de încărcare a unei pagini în browser.

Prima pornire după schimbarea configurației poate reface cache-ul. Păstrarea cache-ului Vite permite reutilizarea dependențelor optimizate. Nu este necesară ștergerea `node_modules` sau dezactivarea protecțiilor sistemului pentru această modificare.
