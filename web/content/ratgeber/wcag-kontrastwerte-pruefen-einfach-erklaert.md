---
slug: wcag-kontrastwerte-pruefen-einfach-erklaert
title: "Kontraste prüfen: WCAG-Kontrastwerte einfach erklärt (mit Tools)"
ogImage: "/ratgeber/og/wcag-kontrastwerte-pruefen-einfach-erklaert.svg"
---
**Vorschlag Dateiname:** `wcag-kontrastwerte-pruefen-einfach-erklaert.md`

**Meta Title:** Kontraste prüfen: WCAG-Kontrastwerte einfach erklärt (mit Tools)

**Meta Description:** Was sind WCAG-Kontrastwerte und warum sind sie so wichtig für die Barrierefreiheit? Wir erklären AA & AAA verständlich, mit Beispielen und Tools zum Prüfen.

**H1:** Kontrast prüfen: WCAG-Kontrastwerte einfach erklärt (mit Beispielen)


Haben Sie schon einmal versucht, hellgraue Schrift auf einem weißen Hintergrund zu lesen? Anstrengend, oder? Für Menschen mit einer Sehschwäche oder für jeden, der bei starkem Sonnenlicht auf sein Smartphone blickt, ist so ein Text oft komplett unlesbar. Genau hier kommen die Kontrastwerte der Web Content Accessibility Guidelines (WCAG) ins Spiel.

Ein ausreichender Farbkontrast ist eine der fundamentalsten Anforderungen an barrierefreies Webdesign. Er sorgt dafür, dass Texte und wichtige grafische Elemente für möglichst viele Menschen gut wahrnehmbar sind. Mit dem nahenden Barrierefreiheitsstärkungsgesetz (BFSG) wird dieses Thema für die meisten Webseiten und Onlineshops zur Pflicht.

Keine Sorge, Sie müssen kein Design-Profi sein, um das Prinzip zu verstehen. Wir erklären Ihnen einfach und verständlich, was hinter den Werten steckt und wie Sie die Kontraste Ihrer Website selbst überprüfen können.

### Was ist ein Kontrastverhältnis?

Ein Kontrastverhältnis ist ein numerischer Wert, der den Helligkeitsunterschied zwischen zwei Farben beschreibt – typischerweise der Textfarbe und der Hintergrundfarbe. Das Verhältnis wird wie folgt angegeben:
*   **1:1** bedeutet kein Kontrast (z.B. weißer Text auf weißem Grund).
*   **21:1** bedeutet der maximal mögliche Kontrast (schwarzer Text auf weißem Grund oder umgekehrt).

Je höher die erste Zahl, desto besser ist der Kontrast und desto leichter ist der Text lesbar. Die WCAG definieren hier klare Mindestanforderungen.

### WCAG-Level AA und AAA: Was ist der Unterschied?

Die WCAG haben verschiedene Konformitätsstufen. Für den Kontrast sind vor allem die Stufen AA und AAA relevant.

*   **Level AA: Der Mindeststandard**
    *   Dies ist die am häufigsten geforderte Stufe und der De-facto-Standard für die meisten gesetzlichen Anforderungen wie das BFSG.
    *   **Normaler Text:** Benötigt ein Kontrastverhältnis von mindestens **4.5:1**.
    *   **Großer Text:** Benötigt ein Kontrastverhältnis von mindestens **3:1**. Als „groß“ gilt Text ab 18pt (ca. 24px) oder fetter Text ab 14pt (ca. 19px).

*   **Level AAA: Der Goldstandard**
    *   Diese Stufe bietet eine noch höhere Zugänglichkeit und wird für Webseiten empfohlen, deren Zielgruppe vorwiegend ältere Menschen oder Menschen mit Sehbehinderungen sind. Sie ist meist keine gesetzliche Pflicht, aber ein Zeichen für exzellente Barrierefreiheit.
    *   **Normaler Text:** Benötigt ein Kontrastverhältnis von mindestens **7:1**.
    *   **Großer Text:** Benötigt ein Kontrastverhältnis von mindestens **4.5:1**.

**Wichtig:** Diese Regeln gelten nicht nur für reinen Text, sondern auch für Text in Bildern und für wesentliche grafische Elemente wie Icons oder Formular-Umrandungen (hier gilt meist die 3:1-Anforderung).

### Beispiele aus der Praxis: Gut vs. Schlecht

Sehen wir uns an, wie sich diese Zahlen in der Realität auswirken.

*   **Schlechtes Beispiel (Nicht konform):**
    *   Hintergrund: `#FFFFFF` (Weiß)
    *   Textfarbe: `#CCCCCC` (Helles Grau)
    *   **Kontrastverhältnis: 1.6:1** – Dieser Text ist für viele Menschen unlesbar und erfüllt nicht einmal die Anforderung für großen Text.

*   **Gutes Beispiel (AA-konform):**
    *   Hintergrund: `#FFFFFF` (Weiß)
    *   Textfarbe: `#555555` (Dunkelgrau)
    *   **Kontrastverhältnis: 5.9:1** – Dieser Text ist gut lesbar und erfüllt die AA-Anforderung für normalen Text.

*   **Sehr gutes Beispiel (AAA-konform):**
    *   Hintergrund: `#FFFFFF` (Weiß)
    *   Textfarbe: `#000000` (Schwarz)
    *   **Kontrastverhältnis: 21:1** – Besser geht es nicht.

### So können Sie Ihre Kontraste selbst prüfen: Tools & Tipps

Sie müssen das Kontrastverhältnis zum Glück nicht manuell ausrechnen. Es gibt zahlreiche kostenlose Tools, die Ihnen diese Arbeit abnehmen.

1.  **Browser-Entwicklertools (DevTools):**
    *   Die meisten modernen Browser (Chrome, Firefox, Edge) haben eine eingebaute Funktion.
    *   **Anleitung (Beispiel Chrome):**
        1.  Rechtsklicken Sie auf einen Text auf Ihrer Seite und wählen Sie „Untersuchen“.
        2.  In den DevTools, im „Styles“-Tab, klicken Sie auf das kleine Farbfeld neben der `color`-Eigenschaft.
        3.  Der Farbwähler öffnet sich und zeigt Ihnen das Kontrastverhältnis an. Oft können Sie hier sogar direkt eine konforme Farbe auswählen.

2.  **Online Contrast Checker:**
    *   Dies sind Webseiten, auf denen Sie einfach die Farbwerte für Vorder- und Hintergrund (meist als Hex-Code, z.B. `#333333`) eingeben.
    *   **Empfehlenswerte Tools:**
        *   **WebAIM Contrast Checker:** Eines der bekanntesten und einfachsten Tools.
        *   **Coolors Contrast Checker:** Sehr visuell und benutzerfreundlich.
        *   **Adobe Color Contrast Analyzer:** Bietet umfassende Analysen.

### Häufige Fehler, die Sie vermeiden sollten

*   **Text auf Bildern:** Platzieren Sie Text niemals auf einem unruhigen Foto ohne einen deckenden Hintergrund (z.B. ein halbtransparentes schwarzes Overlay). Der Kontrast kann sonst von Bereich zu Bereich variieren und oft unlesbar sein.
*   **Platzhalter in Formularen:** Hellgrauer Platzhaltertext in Eingabefeldern hat fast nie genug Kontrast. Ein korrekt verknüpftes `<label>`-Element ist immer die bessere Lösung.
*   **Markenfarben um jeden Preis:** Manchmal entsprechen die offiziellen Markenfarben nicht den Kontrastanforderungen. In diesem Fall müssen Sie eine barrierefreie Alternative für Fließtexte und wichtige Elemente finden. Die Markenfarbe kann immer noch für dekorative Elemente verwendet werden.

Guter Kontrast ist kein Hexenwerk. Er ist eine einfache und extrem wirkungsvolle Methode, Ihre digitalen Inhalte für alle zugänglich zu machen.

---
**CTA-Block**

Ein guter Kontrast ist nur ein Aspekt der Barrierefreiheit. Möchten Sie wissen, wo Ihre Website oder Ihr Onlineshop sonst noch Barrieren aufweist?

[BFSG Check starten]
---

**Hinweis:** Dieser Artikel stellt keine Rechtsberatung dar, sondern dient der allgemeinen Information.

**Quellen:**
1.  WebAIM Contrast Checker: [https://webaim.org/resources/contrastchecker/](https://webaim.org/resources/contrastchecker/)
2.  Adobe Color - Contrast Analyzer: [https://color.adobe.com/create/color-contrast-analyzer](https://color.adobe.com/create/color-contrast-analyzer)
3.  MDN Web Docs - Color and color contrast: [https://developer.mozilla.org/en-US/docs/Web/Accessibility/Understanding_WCAG/Perceivable/Color_contrast](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Understanding_WCAG/Perceivable/Color_contrast)
4.  W3C - Understanding Success Criterion 1.4.3: Contrast (Minimum): [https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
