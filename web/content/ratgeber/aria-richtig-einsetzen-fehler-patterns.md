---
slug: aria-richtig-einsetzen-fehler-patterns
title: "ARIA-Attribute richtig einsetzen: So vermeiden Sie häufige Fehler und nutzen sichere Patterns"
---

**Dateiname:** `aria-richtig-einsetzen-fehler-patterns.md`

**Meta Title:** ARIA richtig einsetzen: Häufige Fehler & sichere Patterns | BFSG

**Meta Description:** Verbessern Sie die Barrierefreiheit Ihrer Website. Lernen Sie häufige ARIA-Fehler zu vermeiden und nutzen Sie sichere Patterns für Screenreader.

# ARIA-Attribute richtig einsetzen: So vermeiden Sie häufige Fehler und nutzen sichere Patterns

Das Barrierefreiheitsstärkungsgesetz (BFSG) rückt näher und mit ihm das Thema digitale Barrierefreiheit. Ein Begriff, der in diesem Zusammenhang immer wieder fällt, ist WAI-ARIA. Doch was verbirgt sich dahinter und wie setzt man es korrekt ein? Falsch angewendet kann ARIA mehr schaden als nutzen. Dieser Artikel zeigt Ihnen die häufigsten Fehler und stellt sichere Patterns vor, mit denen Sie die Zugänglichkeit Ihrer Website wirklich verbessern.

## Was ist WAI-ARIA und warum ist es wichtig?

WAI-ARIA (Web Accessibility Initiative – Accessible Rich Internet Applications) ist eine technische Spezifikation des W3C. Sie dient dazu, Webinhalte und Webanwendungen für Menschen mit Behinderungen zugänglicher zu machen, insbesondere für Nutzer von Screenreadern. ARIA überbrückt Lücken, die reines HTML nicht schließen kann, indem es zusätzliche Informationen über Rollen, Zustände und Eigenschaften von Elementen bereitstellt.

Ein Screenreader kann einem blinden Nutzer beispielsweise mitteilen, ob ein Menü gerade geöffnet oder geschlossen ist (`aria-expanded`) oder was ein rein grafischer Button tut (`aria-label`). Richtig eingesetzt, ist ARIA ein mächtiges Werkzeug.

## Die erste Regel von ARIA: Kein ARIA verwenden

Es klingt paradox, ist aber die wichtigste Grundlage: Wann immer ein natives HTML-Element die gewünschte Funktion erfüllt, sollte es verwendet werden. ARIA sollte niemals dazu dienen, eine von Grund auf schlechte HTML-Struktur zu "reparieren".

- **Semantisches HTML ist die Basis:** Ein `<button>`-Element ist von Natur aus klickbar, per Tastatur erreichbar und wird von Screenreadern als Button erkannt. Ein `<div>`, dem man die Rolle `role="button"` gibt, ist es nicht. Man müsste die gesamte Funktionalität (Tastaturfokus, Klick-Handler) mühsam per JavaScript hinzufügen.
- **ARIA ändert nicht das Verhalten:** ARIA-Attribute beeinflussen nur die Darstellung im Accessibility Tree, den Screenreader auslesen. Sie machen ein Element nicht von allein fokussierbar oder klickbar.
- **Weniger Code, weniger Fehler:** Natives HTML ist robuster und erfordert weniger Wartung.

Verwenden Sie ARIA also nur, wenn es für die Benutzererfahrung absolut notwendig ist und es keine native HTML-Lösung gibt.

## Die 5 häufigsten ARIA-Fehler (und wie man sie behebt)

In der Praxis führen Unwissenheit und Missverständnisse oft zu Problemen. Hier sind die häufigsten Fehler:

### 1. Redundante Rollen zuweisen
Ein klassischer Fehler ist ` <button role="button">Klick mich</button> `. Dies ist überflüssig und kann manche Screenreader verwirren. Das `<button>`-Element hat bereits die implizite Rolle eines Buttons.

- **Falsch:** `<nav role="navigation">`
- **Richtig:** `<nav>` genügt.

### 2. `aria-label` überschreibt sichtbaren Text
`aria-label` ist dazu da, unklare Elemente zu beschriften (z.B. einen Button mit einem "X" als Schließen-Button). Es überschreibt jedoch *jeden* anderen Textinhalt des Elements für den Screenreader.

- **Falsch:** `<button aria-label="Button schließen">Mehr erfahren</button>`
    - Ein Screenreader-Nutzer hört "Button schließen", während ein sehender Nutzer "Mehr erfahren" liest. Das ist verwirrend.
- **Richtig:** `<button>Mehr erfahren</tutton>` oder, wenn es nur ein Icon gäbe: `<button aria-label="Mehr erfahren"><svg>...</svg></button>`

### 3. Fehlende Zustandsänderungen
Dynamische Attribute wie `aria-expanded` (für Akkordeons) oder `aria-selected` (für Tabs) müssen per JavaScript aktualisiert werden. Es reicht nicht, den Ausgangszustand zu setzen.

- **Falsch:** Ein Button öffnet ein Menü, aber `aria-expanded="false"` wird nie zu `aria-expanded="true"` geändert. Der Screenreader-Nutzer erhält keine Rückmeldung über die erfolgte Aktion.
- **Richtig:** Ein Klick-Event muss den Zustand des Attributs via JavaScript umschalten.

### 4. Nicht-interaktive Elemente ohne Tastaturbedienung
Wenn Sie einem `<div>` oder `<span>` eine interaktive Rolle wie `role="button"` geben, müssen Sie es auch per Tastatur bedienbar machen.

- **Falsch:** `<div role="button" onclick="doSomething()">Klick</div>`
    - Dieses Element ist nicht mit der Tab-Taste erreichbar und nicht mit der Enter- oder Leertaste aktivierbar.
- **Richtig:** `<div role="button" onclick="doSomething()" tabindex="0" onkeydown="...">Klick</div>`
    - `tabindex="0"` macht das Element fokussierbar. Der `keydown`-Handler muss auf die Enter- und Leertaste reagieren. Besser noch: einfach ein `<button>` verwenden.

### 5. `aria-hidden="true"` auf sichtbaren Elementen
`aria-hidden="true"` entfernt ein Element und all seine Kind-Elemente komplett aus dem Accessibility Tree. Das ist nützlich für rein dekorative Elemente, aber katastrophal, wenn es auf wichtige Inhalte angewendet wird.

- **Falsch:** Ein Pop-up wird angezeigt, aber der dahinterliegende Hauptinhalt wird nicht mit `aria-hidden="true"` ausgeblendet. Der Screenreader-Nutzer kann dann aus Versehen mit der Seite hinter dem Pop-up interagieren.
- **Richtig:** `aria-hidden` gezielt einsetzen, um irrelevante oder verdeckte Inhalte für Screenreader zu verbergen.

---

### **Optimieren Sie Ihre Website für das BFSG**

Unsicher, ob Ihre Website die ARIA-Anforderungen erfüllt und andere Barrieren vermeidet? Der BFSG Check analysiert Ihre Seite und zeigt Ihnen konkrete Verbesserungspotenziale auf, damit Sie für 2025 gewappnet sind.

**[BFSG Check starten]**

---

### Quellen

- [W3C - WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Web Docs - ARIA Grundlagen](https://developer.mozilla.org/de/docs/Web/Accessibility/ARIA/ARIA_Techniques)
- [The A11Y Project - ARIA](https://www.a11yproject.com/posts/aria-spec-for-the-uninitiated/)
- [BITV-Test Prüfschritte](https://www.bitv-test.de/pruefschritte.html)

*Hinweis: Dieser Artikel stellt keine Rechtsberatung dar und dient lediglich der allgemeinen Information.*

---
