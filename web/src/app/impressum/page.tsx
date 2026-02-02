export const metadata = {
  title: "Impressum | BFSG-WebCheck",
};

import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";

export default function ImpressumPage() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-blue-500/30 pt-24 pb-20">
      <SiteNav />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-10 text-slate-900">Impressum</h1>

        <section className="prose prose-slate max-w-none">
          <h2>Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz)</h2>
          <p>
            <strong>Konrad Bierwagen</strong>
            <br />
            Grenzstrasse 18
            <br />
            01640 Coswig
          </p>

          <h2>Kontakt</h2>
          <p>
            <strong>Telefon:</strong> 0151 24101580
            <br />
            <strong>E-Mail:</strong> info@konraddecode.com
          </p>

          <h2>Inhaltlich Verantwortlicher</h2>
          <p>
            Verantwortlicher für journalistisch-redaktionelle Inhalte nach § 18 Abs. 2 MStV:
            <br />
            Konrad Bierwagen
            <br />
            Grenzstrasse 18
            <br />
            01640 Coswig
          </p>

          <h2>Steuernummer</h2>
          <p>
            Steuernummer:
            <br />
            202/297/04991
          </p>

          <h2>Streitschlichtung</h2>
          <p>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer">
              https://ec.europa.eu/consumers/odr
            </a>
            .
            <br />
            Unsere E-Mail-Adresse finden Sie oben im Impressum.
            <br />
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>

          <h2>Haftung für Inhalte</h2>
          <p>
            Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
            Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen
            oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von
            Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der
            Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
          </p>

          <h2>Haftung für Links</h2>
          <p>
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte
            auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
            Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der
            Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung
            nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
          </p>

          <h2>Urheberrecht</h2>
          <p>
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung,
            Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen
            Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
            Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter
            als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis.
            Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
          </p>
        </section>
        <SiteFooter note="" />
      </div>
    </main>
  );
}
