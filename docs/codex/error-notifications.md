# Notificări de eroare

Erorile marcate cu `role="alert"` sunt preluate automat de Plasma și afișate ca notificări temporare, stivuite în colțul din dreapta jos. Blocul inline original este ascuns, iar notificarea poate fi închisă manual sau dispare după câteva secunde. Sistemul include atât erorile operaționale, cât și validările formularelor.

Mesajele de stare și succes nu sunt convertite în notificări de eroare.

Pentru ca un mesaj operațional nou să folosească acest sistem, marchează blocul lui cu `role="alert"`. Păstrează mesajul și logica de eroare existente; stratul global se ocupă doar de prezentare.
