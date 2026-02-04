export const metadata = {
  title: "AGB | BFSG‑WebCheck",
};

import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";

export default function AgbPage() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-blue-500/30 pt-24 pb-20">
      <SiteNav />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-10 text-slate-900">Allgemeine Geschäftsbedingungen (AGB)</h1>

        <section className="prose prose-slate max-w-none">
          <p>
            <strong>Wichtiger Hinweis:</strong> BFSG‑WebCheck ist ein technischer Prüfservice. Wir erbringen keine Rechtsberatung.
          </p>

          <h2>1. Geltungsbereich</h2>
          <p>
            Diese AGB gelten für die Nutzung der Website und der angebotenen Scan‑/Reporting‑Funktionen von BFSG‑WebCheck.
          </p>

          <h2>2. Leistungsbeschreibung</h2>
          <p>
            Wir stellen eine automatisierte technische Analyse ("Scan") bereit, die potenzielle Barrieren anhand gängiger Standards (z.B. WCAG/BITV/EN 301 549)
            identifiziert und in einem Bericht zusammenfasst.
          </p>

          <h2>3. Keine Rechtsberatung / keine Garantie der Konformität</h2>
          <p>
            Die bereitgestellten Ergebnisse sind technische Hinweise und stellen keine Rechtsberatung dar. Ein Scan kann eine manuelle Prüfung nicht ersetzen.
            Wir übernehmen keine Gewähr dafür, dass eine Website nach Umsetzung der Hinweise rechtlich "BFSG‑konform" oder "WCAG‑konform" ist.
          </p>

          <h2>4. Pflichten der Nutzer:innen (Berechtigung zum Scan)</h2>
          <p>
            Sie dürfen nur Websites scannen, für die Sie berechtigt sind (z.B. Eigentümer:in, Administrator:in oder mit ausdrücklicher Zustimmung).
            Unzulässig sind insbesondere Scans fremder Websites ohne Autorisierung oder Handlungen, die auf das Umgehen von Zugriffsschutz abzielen.
          </p>

          <h2>5. Preise & Zahlung</h2>
          <p>
            Preise werden vor dem Kauf angezeigt. Zahlungen erfolgen über Stripe. Es handelt sich um Einmalzahlungen pro Freischaltung.
          </p>

          <h2>6. Haftung (stark begrenzt)</h2>
          <p>
            Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit.
            Bei einfacher Fahrlässigkeit haften wir nur bei Verletzung wesentlicher Vertragspflichten (Kardinalpflichten) und beschränkt auf den typischerweise
            vorhersehbaren Schaden. Eine weitergehende Haftung ist ausgeschlossen.
          </p>

          <h2>7. Verfügbarkeit / technische Einschränkungen</h2>
          <p>
            Der Scan ist abhängig von externen Faktoren (Erreichbarkeit der Ziel‑Website, Schutzmechanismen, dynamische Inhalte, Rate‑Limits).
            Es besteht kein Anspruch auf eine jederzeitige Verfügbarkeit.
          </p>

          <h2>8. Schlussbestimmungen</h2>
          <p>
            Es gilt deutsches Recht unter Ausschluss des UN‑Kaufrechts. Gerichtsstand ist – soweit zulässig – der Sitz des Betreibers.
          </p>

          <p className="text-xs">
            Stand: {new Date().toISOString().slice(0, 10)}
          </p>
        </section>

        <SiteFooter note="" />
      </div>
    </main>
  );
}
