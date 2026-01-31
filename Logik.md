Unten ist ein belastbares Modell, das **für Nutzer einfach** (“Was bekomme ich?”) bleibt, aber intern mit **harten Budgets, Fallbacks und Queueing** arbeitet. Es löst die 7 Punkte ohne dass der Nutzer “Sitemap/Unterseiten/DOM” verstehen muss.

---

## 1) Produktprinzip: Nutzer kauft “Abdeckung”, intern arbeitet ihr mit Budgets

**Extern (UX):** 3 klare Pakete mit Alltagsbegriffen
**Intern (System):** jedes Paket ist ein *ScanPlan* mit festen **Zeit-/Seiten-/Ressourcen-Budgets** + **Degradationspfaden** (Light‑Mode, Sampling, Partial).

Der entscheidende Trick:
**Ihr verkauft nicht “wir crawlen deine komplette Website”**, sondern “wir prüfen *deine wichtigsten Bereiche / repräsentative Abdeckung* – transparent, welche Seiten geprüft wurden”.

---

## 2) UX‑Flow, der Scope erklärt ohne Technik

### Schritt A: URL → Preflight/Teaser (kostenarm, schnell, deterministisch)

**Ziel:** in 5–15 Sekunden eine seriöse Vorschau + automatische Empfehlung.

Was ihr im Preflight macht (ohne großen Crawl):

* Redirect‑Kette auflösen (max. N Redirects), kanonische Start‑URL bestimmen.
* Startseite (ggf. 1–2 weitere “naheliegende” Seiten) **mit strengem Budget** rendern oder “hybrid” (s. unten).
* Leichte Discovery: robots.txt + Sitemap‑Hinweise, Navigation/Footer‑Links der Startseite, typische Legal‑Links (Impressum/Datenschutz/Kontakt).
* “Komplexitätsprofil” schätzen: **JS‑App? große DOMs? sehr viele Unterseiten? Shop‑Signale?**

**Teaser‑UI (für Nutzer):**

* “Erste Prüfung der Startseite abgeschlossen (Zeitstempel)”
* 3–8 konkrete Findings (Top‑Risiken) + kurzer “Warum relevant”
* “Website‑Typ” in Alltagssprache:

  * “Einfache Website”, “Mehrseitige Website”, “Shop”, “Sehr große Website”
* “Empfohlenes Paket” + “Warum”
* *Optional:* “Wir werden prüfen: Startseite + Kontakt + Impressum + Datenschutz + …” (Liste editierbar)

> Wichtig: Der Teaser sollte **nicht** den Eindruck erzeugen, dass schon “alles” geprüft wurde. Er ist ein “Probebohrer” + Scope‑Vorschlag.

### Schritt B: Paket wählen (3 Pakete) – Seitenliste sichtbar, aber optional

Der Nutzer muss keine Unterseiten zählen. Ihr zeigt einfach:

* “Diese Seiten prüfen wir automatisch” (inkl. Legal/Contact etc.)
* “+ bis zu X weitere wichtige Seiten” (aus Navigation/Sitemap)
* Ein **Toggle** “Seitenliste anpassen (optional)”:

  * Nutzer kann 0–5 URLs hinzufügen/entfernen
  * Power‑User können eine URL‑Liste hochladen (CSV) *als Advanced‑Option*, ohne dass es die Haupt-UX verkompliziert.

### Schritt C: Stripe → Vollscan‑Job → Vollreport + PDF

Nach Zahlung:

* Statusseite mit Progress (“Seite 3/10 geprüft”, “Warteschlange”)
* Ergebnis: Web‑Report + “PDF herunterladen”
* **PDF wird aus gespeicherten Findings erzeugt** (kein Live‑Rescan)

---

## 3) 3‑Pakete‑Modell, das fair bleibt (ohne “Sitemap” zu erklären)

### Paket 1: **Single‑Page Check**

**Wording:** “Eine Seite (z. B. Startseite oder Landingpage)”
**Lieferumfang:**

* Vollanalyse für genau 1 URL
* Priorisierte Findings + konkrete Fix‑Hinweise
* PDF

**Intern:** 1 Page‑Budget, volle Checks, strikte Timeouts.

---

### Paket 2: **Wichtige Seiten**

**Wording:** “Die wichtigsten Seiten deiner Website”
**Lieferumfang (klar, nicht technisch):**

* Startseite + Kontakt + Impressum + Datenschutz **plus** weitere zentrale Seiten (bis zu z. B. 10)
* Automatische Auswahl, Seitenliste wird angezeigt (optional anpassbar)
* Priorisierte Issues + “Wo tritt es auf?” (mit Beispielen)
* PDF

**Intern:** Fixe Max‑Anzahl + Zeitbudget; Discovery ist begrenzt (keine Voll‑Crawls).

---

### Paket 3: **Website‑Audit**

**Wording:** “Breite Abdeckung (repräsentativ) – ideal für große Websites & Shops”
**Lieferumfang (fair bei großen Sites):**

* “Repräsentative Abdeckung” statt “alles”
* Ihr prüft:

  * **wichtige Seitentypen** (z. B. Artikel/Produkt/Listen/Checkout/Account) **und**
  * bis zu z. B. 50 Seiten (oder 100 intern als Hard‑Cap – siehe unten)
* Ergebnis enthält:

  * Liste der geprüften Seiten
  * Abdeckung nach Bereichen/Seitentypen (für Shop extrem verständlich)
* PDF

**Warum fair:** Bei Wikipedia/Shop skaliert der Wert über **Seitentypen/Templates**, nicht über 10.000 URLs.

> Add‑on (optional, wenn ihr es braucht): “+10 zusätzliche Seiten” oder “Shop‑Flow Pack (Produkt → Warenkorb → Checkout)”.
> Aber die Kern‑UX bleibt 3 Pakete.

---

## 4) Technische Guardrails gegen teure / instabile Scans (ohne UX zu ruinieren)

### 4.1 Harte Budgets pro ScanRun (nicht pro Seite “offen”)

Definiert intern einen `ScanPlan` mit harten Limits. Beispiel:

* `maxPages` (Paketabhängig)
* `maxWallTime` (z. B. 2 / 7 / 20 Minuten)
* `maxPerPageTime` (z. B. 15–25 Sekunden)
* `maxRedirects` (z. B. 10)
* `maxDOMNodes` (z. B. 60k; darüber nur Light‑Checks)
* `maxNetworkRequests` (z. B. 120; darüber Abbruch/Light)
* `maxResponseBytes` (z. B. 8–15 MB pro Seite)
* `maxJSExecutionBudget` (implizit über Timeouts + WaitUntil)
* `maxFindingsStored` (Caps, s. Convex)

**Regel:** Wenn ein Budget erreicht ist, liefert ihr **kontrolliert “Partial”** statt Crash/Timeout.

### 4.2 Degradationspfade (damit ihr immer “liefert”)

Für jede Seite / jeden Run:

1. **Full Render Mode** (Playwright)

   * Blockt teure Ressourcen: `image`, `media`, `font` (oft großer Win)
   * `waitUntil = domcontentloaded` statt `networkidle` als Default (SPAs hängen gern)
   * Optional: nach X Sekunden “Snapshot jetzt” (egal ob noch Requests laufen)

2. **Light Render Mode**

   * Wenn DOM zu groß / zu viele Requests / Timeout droht
   * Weniger Checks (z. B. nur Struktur/ARIA/Forms/Focus‑Basics, keine “teuren” Heuristiken)

3. **Static Mode (HTTP + HTML)**

   * Wenn Browser‑Render nicht stabil möglich (Redirect‑Loop, Consent‑Lock, Crash)
   * Ihr liefert trotzdem einen Report: “Diese Seite konnte nicht gerendert werden; statische Prüfung durchgeführt; Ergebnisse ggf. eingeschränkt.”

**Wichtig für Professionalität:** Im Report steht transparent:

* “Prüfmodus: Full / Light / Static”
* “Warum Light/Static gewählt wurde” (z. B. “Seite sehr groß: DOM > 60k Nodes”)

So reduziert ihr Support (“warum nicht alles?”) und wirkt kontrolliert statt fehlerhaft.

---

## 5) Consent‑Banner & Redirect‑Loops robust behandeln

### 5.1 Consent / Overlays

Ziel ist nicht Perfektion, sondern: **keine Blockade + deterministisch**.

Pragmatischer Ablauf:

1. Nach `domcontentloaded` prüft ihr auf Overlay‑Signale:

   * große fixed/floating Elemente mit hohem z‑Index
   * Schlüsselwörter (“cookie”, “consent”, “akzeptieren”, “ablehnen”, “privacy”)
2. Klickstrategie deterministisch (immer gleiche Reihenfolge):

   * bevorzugt “Nur notwendige / Ablehnen” (weniger Tracking‑Varianz)
   * wenn Inhalt gesperrt bleibt: “Alle akzeptieren”
3. Max. 2–3 Interaktionen, dann Abbruch → Light/Static und Finding:

   * “Cookie‑Banner blockiert Interaktion / Fokus” (das ist ohnehin oft relevant)

**Bonus:** Speichert pro Domain eine “Consent‑Signatur”, damit Folgeseiten im gleichen Run schneller durchlaufen.

### 5.2 Redirect‑Loops

* Redirects auf HTTP‑Ebene vorab auflösen (max N).
* In Playwright zusätzlich:

  * visited URL‑Set pro Navigation
  * bei Wiederholung → Abbruch, Seite als “nicht stabil erreichbar” markieren
* Report enthält: Redirect‑Kette, final URL, Abbruchgrund.

---

## 6) Determinismus: gleiche URL → gleicher Report (so weit realistisch)

Absolute Deterministik ist im Web nie 100% (A/B‑Tests, Geo, personalisierte Inhalte). Ihr könnt aber professionell “reproduzierbar genug” sein:

### 6.1 Run wird “eingefroren”

Beim Start des Vollscans speichert ihr einen `RunConfig`:

* Browser/Playwright Version (pinned)
* Viewport (fix)
* User‑Agent (fix)
* Locale/Timezone (fix, z. B. de-DE / Europe/Berlin)
* Blocked Resource Types (fix)
* Consent‑Aktion (welcher Button, welche Strategie)
* Zeitstempel ScanStart

### 6.2 Ergebnisse & Evidenzen werden gespeichert

Pro geprüfter Seite speichert ihr:

* final URL, HTTP Status
* Render‑Modus (Full/Light/Static)
* DOM/HTML Snapshot (mind. `page.content()` oder komprimiert)
* A11y‑Ergebnisse + Referenzen (Selector/XPath + kleine Snippets)
* Optional: Screenshot (stark hilfreich für Support, aber Speicherbudget beachten)

### 6.3 PDF wird nur aus gespeicherten Daten gebaut

PDF‑Generator liest ausschließlich:

* gespeicherte Findings
* gespeicherte Metadaten/Beweise
* (optional) Screenshots

**Nie im PDF‑Flow erneut scannen.**
So driften Report und PDF nicht auseinander.

---

## 7) Parallelität & Stabilität: Queue + harte Concurrency‑Limits

### 7.1 Architekturentscheidung

**Der Web‑Request darf nie den Vollscan machen.**
Flow:

* Web/API: erzeugt Run + Preflight + Stripe Session
* Webhook “paid”: setzt Run auf “queued”
* Worker‑Service: zieht Jobs aus Queue, führt Scan aus, schreibt Findings
* PDF‑Service: generiert PDF nach Abschluss (oder Worker macht’s am Ende)

### 7.2 Concurrency‑Kontrolle

Playwright/Chromium ist RAM‑hungrig. Standardmuster:

* **1 Job = 1 Browserprozess** (oder sehr streng kontrollierte Wiederverwendung)
* Pro Worker: `maxConcurrentJobs = 1` (oder 2 bei viel RAM)
* Global: dynamisches Limit nach RAM (z. B. “nur starten, wenn >X GB frei”)

Zusätzlich:

* Nach N Seiten Browser neu starten (gegen Leaks)
* harte Prozess‑Timeouts + Kill‑Switch
* “Circuit Breaker”: wenn Crashrate hoch → automatisch Light/Static als Default für neue Jobs

Das verhindert die klassischen RAM‑Spikes, die den Server umwerfen.

---

## 8) Convex‑Daten & Kosten vorhersagbar halten (Caps + Aggregation)

Convex sollte nicht mit “jede einzelne Instanz jedes Fehlers” vollgeschrieben werden.

Empfehlung für Datenmodell:

* `runs`: Status, config, pricing, timestamps
* `pages`: pro geprüfte Seite Metadaten, mode, timing, hash
* `issueSummaries`: pro Issue‑Typ aggregiert (count, severity, betroffene Seitentypen)
* `issueExamples`: pro Issue‑Typ nur **Top‑N Beispiele** (z. B. 20–50), mit Evidence
* Große Artefakte (HTML snapshots, Screenshots) **nicht** in Convex, sondern in Object Storage (R2/S3) + in Convex nur Referenz/URL + Hash + TTL/Retention‑Policy.

**Caps (wichtig):**

* Max Findings insgesamt (z. B. 2.000) → danach nur noch zählen, nicht mehr neue Instanzen speichern
* Max Beispiele pro Issue‑Typ (z. B. 50)
* Max Seiten pro Run (paketabhängig)
* Max Artefaktgröße pro Seite

So bleiben Kosten und Performance konstant, selbst bei Shops.

---

## 9) Die “100 Unterseiten Cap” richtig positionieren (UX‑sicher)

Ein “bis 100 Seiten” als Marketingversprechen ist riskant:

* Nutzer erwarten Vollcrawl
* Wartezeiten/Timeouts steigen
* Support explodiert (“warum nur 73/100?”)

Besser:

* **100 als internes Hard‑Cap** (Systemschutz)
* Im Produktversprechen (Paket 3) lieber:

  * “repräsentative Abdeckung”
  * “wichtigste Seitentypen / zentrale Journeys”
  * “bis zu 50 Seiten” als *normales* Maximum
* Wenn ihr 100 braucht: nur als “Pro/Enterprise” oder als Add‑on mit klaren Grenzen (“kann länger dauern, bevorzugt nachts, E‑Mail wenn fertig”).

In der UI kann das so aussehen:

* Paket 3: “Breite Abdeckung (typisch 30–50 Seiten)”
* FAQ/Details: “Technische Obergrenze 100 Seiten pro Lauf.”

Damit bleibt die UX ehrlich und ihr schützt euch vor “Wikipedia‑Erwartungen”.

---

## 10) Konkrete “intelligente” Logik, die Nutzer wirklich versteht

### Empfehlungssystem (nach Preflight)

Eine einfache, robuste Regelmatrix reicht:

* **Wenn** nur 1–5 Seiten gefunden *oder* Startseite sehr “One‑pager”: → Paket 1 empfehlen
* **Wenn** Legal‑Links + Navigation auf mehrere Bereiche hindeuten, aber Sitemap klein/mittel: → Paket 2 empfehlen
* **Wenn** Sitemap sehr groß / Shop‑Signale / starke JS‑App / viele Parameter‑URLs: → Paket 3 empfehlen (“repräsentativ”)

Und immer in Klartext:

* “Warum empfehlen wir das?” (1 Satz)
* “Welche Seiten prüfen wir?” (Liste, optional editierbar)

### Seiten-Auswahl ohne Crawl-Hölle

Für Paket 2/3:

* Priorisiert: Startseite, Kontakt, Impressum, Datenschutz, AGB/Widerruf (falls vorhanden)
* Dann: Top‑Navigation + Footer‑Links (meist die “wichtigen” Seiten)
* Dann: aus Sitemap nur ein begrenztes Sample
* Filtert aggressiv:

  * Session-/Tracking‑Parameter
  * Paginierung endlos
  * Facetten/Sortierung (Shop) → nur 1–2 Varianten
* Für Shops: je 1–3 repräsentative Produktseiten, Kategorie, Warenkorb, Checkout (sofern erreichbar)

Das verhindert, dass ihr euch in Millionen URLs verliert.

---

## Ergebnis: Was der Nutzer erlebt vs. was intern passiert

**Nutzer erlebt:**

* URL rein
* in Sekunden: “erste Ergebnisse + klare Empfehlung”
* wählt “Single / Wichtige Seiten / Website‑Audit”
* bezahlt
* bekommt verlässlichen Report + PDF, mit Liste geprüfter Seiten und Zeitstempel

**Intern passiert:**

* fester ScanPlan mit Budgets
* begrenzte Discovery + Sampling
* Render/Light/Static Fallbacks statt Abstürzen
* Queue + Concurrency‑Limits
* Speicherung mit Caps + PDF aus gespeicherten Findings

---

Wenn du willst, kann ich als nächstes direkt ein **konkretes ScanPlan‑Schema** (JSON/TypeScript), eine **Seiten-Priorisierungsheuristik** (Pseudo‑Code) und Vorschläge für **Microcopy** (deutsche UI‑Texte für Paketkarten, Teaser, Error/Partial‑States) ausformulieren, so dass ihr es 1:1 in UI und Worker umsetzen könnt.
