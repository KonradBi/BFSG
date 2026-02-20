---
slug: bfsg-website-testen-automatisch-manuell
title: 'Website auf BFSG-Konformität prüfen: Automatische vs. manuelle Tests'
ogImage: /ratgeber/og/bfsg-website-testen-automatisch-manuell.png
ogImageAlt: >-
  Illustration zum Ratgeber: Website auf BFSG-Konformität prüfen: Automatische
  vs. manuelle Tests
---
**Dateiname:** `bfsg-website-testen-automatisch-manuell.md`

**Meta Title:** BFSG-Check: Website richtig prüfen (automatisch vs. manuell)

**Meta Description:** Wie testen Sie Ihre Website auf BFSG-Konformität? Erfahren Sie die Stärken und Schwächen von automatisierten und manuellen Tests für eine valide Analyse.

---

# Website auf BFSG-Konformität prüfen: Automatische vs. manuelle Tests

Das Barrierefreiheitsstärkungsgesetz (BFSG) rückt näher und damit die Notwendigkeit, die eigene Website auf Konformität zu prüfen. Doch wie geht man dabei am besten vor? Die beiden gängigsten Methoden sind automatisierte und manuelle Tests. Beide haben ihre Berechtigung, aber nur in Kombination führen sie zu einem verlässlichen Ergebnis. Wir erklären die Unterschiede, Vor- und Nachteile.

## Die Grundlage: Was wird überhaupt geprüft?

Bevor man testet, muss man wissen, wonach man sucht. Das BFSG verlangt die Einhaltung der Norm **EN 301 549**. Für Websites bedeutet das in der Praxis die Erfüllung der **Web Content Accessibility Guidelines (WCAG) 2.1, Level AA**. Diese Richtlinien basieren auf vier fundamentalen Prinzipien:

1.  **Wahrnehmbar:** Inhalte müssen für alle Sinne zugänglich sein (z.B. durch Alternativtexte für Bilder).
2.  **Bedienbar:** Die Navigation und Interaktion müssen für jeden möglich sein (z.B. rein per Tastatur).
3.  **Verständlich:** Inhalte und Bedienung müssen klar und vorhersehbar sein.
4.  **Robust:** Die Website muss mit verschiedenen Technologien, insbesondere assistiven Technologien wie Screenreadern, zuverlässig funktionieren.

Ein Test muss also prüfen, inwieweit diese Prinzipien und die dahinterliegenden Erfolgskriterien erfüllt sind.

## Automatisierte Tests: Der schnelle erste Check

Automatisierte Tests sind Software-Tools, die den Code einer Website scannen und auf bekannte Barrierefreiheitsprobleme überprüfen. Sie existieren als Browser-Erweiterungen, Online-Scanner oder in Entwicklertools integrierte Funktionen.

**Vorteile:**
*   **Geschwindigkeit:** Ein Scan dauert oft nur wenige Sekunden oder Minuten.
*   **Kosteneffizienz:** Viele Basis-Tools sind kostenlos oder preiswert.
*   **Gute Fehlererkennung für "Low-Hanging Fruits":** Sie finden zuverlässig Probleme wie:
    *   Fehlende Alternativtexte bei Bildern.
    *   Zu geringe Farbkontraste zwischen Text und Hintergrund.
    *   Fehlende `labels` bei Formularfeldern.
    *   Fehler in der Überschriftenhierarchie (z.B. eine `<h3>` folgt auf eine `<h1>`).

**Nachteile und Grenzen:**
*   **Geringe Abdeckung:** Automatisierte Tools können nur etwa 30-40 % aller WCAG-Kriterien prüfen.
*   **Kein Kontextverständnis:** Ein Tool kann erkennen, *ob* ein Alternativtext vorhanden ist, aber nicht, *ob er sinnvoll* ist. Ein `alt="bild"` ist technisch korrekt, aber für einen blinden Nutzer nutzlos.
*   **Keine Prüfung der Nutzererfahrung:** Ob eine Website logisch per Tastatur navigierbar ist oder ob ein Screenreader die Inhalte in einer verständlichen Reihenfolge vorliest, kann nur ein Mensch beurteilen.
*   **Gefahr von Fehlalarmen:** Manchmal werden Probleme gemeldet, die in der Praxis keine sind (False Positives).

**Fazit:** Automatisierte Tests sind ein hervorragender Ausgangspunkt, um eine erste Fehlerliste zu erstellen und offensichtliche Mängel schnell zu identifizieren. Sie ersetzen aber niemals eine manuelle Prüfung.

## Manuelle Tests: Der unverzichtbare Tiefen-Audit

Manuelle Tests werden von Experten durchgeführt, die sich in die Lage von Nutzern mit verschiedenen Einschränkungen versetzen. Sie nutzen dabei oft dieselben assistiven Technologien.

**Methoden umfassen typischerweise:**
*   **Tastaturbedienbarkeit:** Lässt sich die gesamte Website, inklusive aller Menüs, Formulare und Buttons, ausschließlich mit der `Tab`-, `Shift+Tab`-, `Enter`- und `Leertaste` bedienen? Gibt es eine "Tastaturfalle", aus der man nicht mehr entkommt?
*   **Screenreader-Test:** Ein Experte navigiert mit einem Screenreader (wie NVDA, JAWS oder VoiceOver) durch die Seite. Werden alle Inhalte korrekt vorgelesen? Ist die Reihenfolge logisch? Sind interaktive Elemente als solche erkennbar?
*   **Zoom-Test:** Was passiert, wenn die Seite auf 200 % oder 400 % vergrößert wird? Überlagern sich Inhalte? Muss horizontal gescrollt werden, um Text zu lesen?
*   **Logik- und Prozessprüfung:** Ist ein Kauf- oder Buchungsprozess von Anfang bis Ende verständlich und durchführbar?

**Vorteile:**
*   **Vollständige Abdeckung:** Nur so können alle WCAG-Kriterien geprüft werden.
*   **Fokus auf die echte Nutzererfahrung:** Findet Barrieren, die im Code nicht sichtbar sind.
*   **Identifikation komplexer Probleme:** Deckt Mängel in der Interaktionslogik und im Nutzerfluss auf.
*   **Rechtssicherheit:** Ein fundierter manueller Prüfbericht ist die einzig verlässliche Grundlage für eine Konformitätserklärung nach BFSG.

**Nachteile:**
*   **Kosten- und Zeitaufwand:** Eine manuelle Prüfung ist deutlich aufwendiger als ein automatischer Scan.
*   **Erfordert Expertise:** Der Prüfer muss die WCAG-Richtlinien und den Umgang mit assistiven Technologien exzellent beherrschen.

## Die beste Strategie: Eine Kombination aus beidem

Für ein aussagekräftiges und effizientes Ergebnis ist die Kombination beider Ansätze ideal.

1.  **Phase 1 (Automatisiert):** Starten Sie mit einem automatisierten Scan (z.B. über den Lighthouse-Report in den Chrome DevTools). Beheben Sie alle dort gefundenen einfachen Fehler.
2.  **Phase 2 (Manuell):** Führen Sie grundlegende manuelle Tests selbst durch. Navigieren Sie einmal komplett nur mit der Tastatur durch Ihre Seite. Vergrößern Sie die Ansicht stark. Das deckt oft schon die nächsten großen Probleme auf.
3.  **Phase 3 (Experten-Audit):** Beauftragen Sie für eine finale, rechtssichere Bewertung einen Experten oder eine spezialisierte Agentur. Dies ist unerlässlich, um die Konformität nach BFSG zu bestätigen und die verbleibenden, komplexen Barrieren zu finden.

Sind Sie bereit für den ersten, schnellen Check?

---
**[BFSG Check starten]**
---

### Quellen

*   [WCAG 2.1 Erfolgskriterien (Referenz)](https://www.w3.org/WAI/WCAG21/quickref/)
*   [Informationen zur europäischen Norm EN 301 549 (Englisch)](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf)
*   [Aktion Mensch: Informationen zur digitalen Barrierefreiheit](https://www.aktion-mensch.de/inklusion/barrierefreiheit/barrierefreie-website)

*Hinweis: Dieser Artikel stellt keine Rechtsberatung dar, sondern dient der allgemeinen Information. Für eine verbindliche rechtliche Einschätzung wenden Sie sich bitte an einen spezialisierten Anwalt.*

***

## Weiterführende Artikel

- [BFSG FAQ: 60 Fragen & Antworten](/ratgeber/faq)
- [BFSG Frist 2025: Timeline & To-do-Liste](/ratgeber/bfsg-frist-2025-timeline-todo-liste)
- [Top-15 Barrierefreiheitsfehler (mit Fixes)](/ratgeber/top-15-barrierefreiheit-fehler-websites-fixes)
