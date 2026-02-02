---
slug: top-15-barrierefreiheit-fehler-websites-fixes
title: "Die 15 häufigsten Barrierefreiheits-Fehler – und wie Sie sie einfach beheben"
ogImage: "/ratgeber/og/top-15-barrierefreiheit-fehler-websites-fixes.svg"
---
**Dateiname:** `top-15-barrierefreiheit-fehler-websites-fixes.md`

**Meta Title:** Top 15 Barrierefreiheits-Fehler auf Websites & wie man sie behebt

**Meta Description:** Von fehlenden Alt-Texten bis zu schlechten Kontrasten: Die 15 häufigsten WCAG-Fehler, die Ihre Website für das BFSG angreifbar machen – mit einfachen Fix-Ideen.

---

# Die 15 häufigsten Barrierefreiheits-Fehler – und wie Sie sie einfach beheben

Digitale Barrierefreiheit klingt oft komplex und technisch. Dabei sind es häufig die gleichen, grundlegenden Fehler, die einen Großteil der Barrieren auf Websites ausmachen. Viele davon lassen sich mit etwas Bewusstsein im Redaktions- und Entwicklungsalltag schnell vermeiden oder beheben. Hier sind die Top 15 der häufigsten Sünden nach WCAG – und wie Sie sie angehen können.

### 1. Fehlende Alternativtexte für Bilder
**Problem:** Ein blinder Nutzer mit einem Screenreader "hört" nur "Grafik" oder den Dateinamen. Der Inhalt des Bildes bleibt verborgen.
**Fix-Idee:** Füllen Sie das „Alternativtext“-Feld (kurz `alt`-Text) im CMS mit einer kurzen, prägnisen Beschreibung des Bildinhalts. Ist das Bild rein dekorativ, lassen Sie das Feld leer (`alt=""`), damit der Screenreader es ignoriert.

### 2. Geringer Farbkontrast
**Problem:** Text, der sich farblich kaum vom Hintergrund abhebt, ist für Menschen mit Sehschwäche oder bei schlechten Lichtverhältnissen (z.B. am Handy in der Sonne) unlesbar.
**Fix-Idee:** Nutzen Sie Online-Kontrastprüfer (Stichwort: "Contrast Checker"), um sicherzustellen, dass das Verhältnis zwischen Text- und Hintergrundfarbe mindestens 4.5:1 beträgt.

### 3. Nicht aussagekräftige Link-Texte
**Problem:** Screenreader-Nutzer springen oft von Link zu Link. Eine Liste aus "Hier klicken", "Mehr erfahren" und "Weiterlesen" ist nutzlos, da der Kontext fehlt.
**Fix-Idee:** Der Link-Text sollte das Ziel des Links klar beschreiben. Statt "Mehr erfahren" schreiben Sie "Mehr über unsere Dienstleistungen erfahren".

### 4. Fehlende Formular-Labels
**Problem:** Ohne eine sichtbare und technisch verknüpfte Beschriftung (`<label>`) weiß ein Screenreader-Nutzer nicht, welche Eingabe in einem Formularfeld erwartet wird.
**Fix-Idee:** Stellen Sie sicher, dass jedes `input`, `textarea` und `select`-Feld ein korrekt verknüpftes `<label>`-Element hat. Platzhalter sind kein Ersatz!

### 5. Keine durchgehende Tastaturbedienbarkeit
**Problem:** Interaktive Elemente (Menüs, Buttons, Akkordeons), die nur per Maus bedienbar sind, schließen Menschen mit motorischen Einschränkungen komplett aus.
**Fix-Idee:** Testen Sie es selbst: Legen Sie die Maus weg und versuchen Sie, mit der `Tab`-Taste durch Ihre Seite zu navigieren und alle Funktionen mit `Enter` oder `Leertaste` auszulösen. Alles, was nicht erreichbar ist, muss korrigiert werden.

### 6. Fehlende oder falsche Überschriftenstruktur
**Problem:** Überschriften (`<h1>`, `<h2>`, `<h3>` etc.) werden oft nur zur optischen Gestaltung missbraucht. Für Screenreader-Nutzer sind sie aber das Inhaltsverzeichnis der Seite. Eine unlogische Struktur verwirrt.
**Fix-Idee:** Nutzen Sie nur eine `<h1>` pro Seite für die Hauptüberschrift. Gliedern Sie den restlichen Inhalt logisch mit `<h2>`, `<h3>` usw., ohne Ebenen zu überspringen.

### 7. Videos ohne Untertitel
**Problem:** Gehörlose oder schwerhörige Nutzer können dem Inhalt von Videos ohne textliche Alternative nicht folgen.
**Fix-Idee:** Fügen Sie allen Videos, in denen gesprochen wird, synchronisierte Untertitel hinzu. Plattformen wie YouTube bieten dafür integrierte Werkzeuge.

### 8. Fehlende Sprachangabe im Code
**Problem:** Ist die Sprache der Seite nicht im `<html>`-Tag deklariert (z.B. `<html lang="de">`), weiß ein Screenreader nicht, in welcher Sprache er den Text aussprechen soll, was zu einer unverständlichen Aussprache führt.
**Fix-Idee:** Sorgen Sie dafür, dass das `lang`-Attribut im `<html>`-Tag korrekt gesetzt ist.

### 9. Keine "Tastaturfalle"
**Problem:** Der Nutzer navigiert mit der Tastatur in ein Element (z.B. ein Pop-up oder Cookie-Banner), kommt von dort aber nicht mehr mit `Tab` oder `Esc` weg, ohne die Seite neu zu laden.
**Fix-Idee:** Stellen Sie sicher, dass alle Overlays und Pop-ups auch per Tastatur wieder geschlossen oder übersprungen werden können.

### 10. Inhalte zoomen nicht korrekt
**Problem:** Bei einer Vergrößerung der Seite (Browser-Zoom) auf 200% oder mehr überlappen sich Texte oder Spalten, sodass Inhalte unlesbar werden oder horizontales Scrollen nötig wird.
**Fix-Idee:** Verwenden Sie ein responsives Layout mit relativen Einheiten (wie `rem` oder `%`), das sich flexibel an verschiedene Zoomstufen anpasst.

### 11. Plötzlich aufpoppende Inhalte
**Problem:** Inhalte (z.B. Chat-Fenster, Werbebanner), die ohne Nutzerinteraktion plötzlich erscheinen und den Fokus verschieben, können Screenreader-Nutzer stark desorientieren.
**Fix-Idee:** Vermeiden Sie solche Pop-ups oder stellen Sie sicher, dass sie erst durch eine bewusste Aktion des Nutzers ausgelöst werden.

### 12. Schlecht ausgezeichnete Datentabellen
**Problem:** Komplexe Datentabellen ohne korrekte `<th>` (Tabellenüberschriften) und `scope`-Attribute sind für Screenreader nur eine unstrukturierte Ansammlung von Daten.
**Fix-Idee:** Nutzen Sie Tabellen nur für tabellarische Daten und zeichnen Sie Spalten- und Zeilenüberschriften korrekt aus.

### 13. Nicht pausierbare Slider/Carousels
**Problem:** Sich automatisch bewegende Inhalte können für Menschen mit Leseschwäche oder kognitiven Einschränkungen Stress verursachen, da sie nicht genug Zeit haben, den Inhalt zu erfassen.
**Fix-Idee:** Jeder Slider muss einen klar sichtbaren Pause/Play-Button haben.

### 14. Rein visuelle CAPTCHAs
**Problem:** Bild- oder Puzzle-CAPTCHAs ("Klicken Sie auf alle Ampeln") sind für blinde Nutzer eine unüberwindbare Hürde.
**Fix-Idee:** Bieten Sie immer eine nicht-visuelle Alternative an (z.B. ein Audio-CAPTCHA) oder nutzen Sie moderne, unsichtbare Verfahren wie reCAPTCHA v3.

### 15. Zeitlimits ohne Warnung
**Problem:** Ein Nutzer füllt ein langes Formular aus und wird plötzlich ausgeloggt, weil die Sitzung abgelaufen ist. Alle Eingaben sind verloren.
**Fix-Idee:** Wenn Sitzungen ablaufen, warnen Sie den Nutzer vorab und geben Sie ihm die Möglichkeit, die Sitzung zu verlängern.

---
**[BFSG Check starten]**
---

### Quellen

*   [WebAIM: Introduction to Web Accessibility](https://webaim.org/intro/)
*   [Die 4 Prinzipien der Barrierefreiheit (Aktion Mensch)](https://www.einfach-fuer-alle.de/artikel/wcag-2.0-prinzipien/)
*   [W3C WAI: Easy Checks – A First Review of Web Accessibility](https://www.w3.org/WAI/test-evaluate/preliminary/)

*Hinweis: Dieser Artikel stellt keine Rechtsberatung dar, sondern dient der allgemeinen Information. Für eine verbindliche rechtliche Einschätzung wenden Sie sich bitte an einen spezialisierten Anwalt.*
