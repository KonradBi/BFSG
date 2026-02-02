export const RELATED_POSTS: Record<string, string[]> = {
  // BFSG / law intent
  "bfsg-anwendbarkeit-website-check": ["bfsg-frist-2025-timeline-todo-liste", "bfsg-fuer-onlineshops-anforderungen-checkliste", "bfsg-website-testen-automatisch-manuell"],
  "bfsg-frist-2025-timeline-todo-liste": ["bfsg-anwendbarkeit-website-check", "bfsg-bussgelder-risiken", "bfsg-website-testen-automatisch-manuell"],
  "bfsg-bussgelder-risiken": ["bfsg-frist-2025-timeline-todo-liste", "bitv-test-vs-bfsg-check-unterschiede", "audit-kosten"],
  "bfsg-fuer-onlineshops-anforderungen-checkliste": ["bfsg-website-testen-automatisch-manuell", "barrierefreie-formulare-best-practices", "barrierefreie-navigation-menues-skip-links-landmarken"],

  // How-to / dev intent
  "wcag-kontrastwerte-pruefen-einfach-erklaert": ["top-15-barrierefreiheit-fehler-websites-fixes", "barrierefreie-formulare-best-practices", "barrierefreie-navigation-menues-skip-links-landmarken"],
  "gute-alternativtexte-fuer-bilder-schreiben": ["top-15-barrierefreiheit-fehler-websites-fixes", "was-ist-eaa-und-bfsg", "bfsg-website-testen-automatisch-manuell"],
  "tastaturbedienung-testen-anleitung-fokus-tab-reihenfolge": ["barrierefreie-navigation-menues-skip-links-landmarken", "screenreader-test-nvda-voiceover-quickchecks", "top-15-barrierefreiheit-fehler-websites-fixes"],
  "barrierefreie-formulare-best-practices": ["tastaturbedienung-testen-anleitung-fokus-tab-reihenfolge", "aria-richtig-einsetzen-fehler-patterns", "wcag-kontrastwerte-pruefen-einfach-erklaert"],
  "aria-richtig-einsetzen-fehler-patterns": ["barrierefreie-formulare-best-practices", "barrierefreie-navigation-menues-skip-links-landmarken", "top-15-barrierefreiheit-fehler-websites-fixes"],
  "barrierefreie-pdfs-probleme-und-fixes": ["bfsg-2025", "top-15-barrierefreiheit-fehler-websites-fixes", "audit-kosten"],

  // Comparisons
  "wcag-bitv-en301549-unterschiede-einfach-erklaert": ["bfsg-2025", "bitv-test-vs-bfsg-check-unterschiede", "audit-kosten"],
  "bitv-test-vs-bfsg-check-unterschiede": ["bfsg-2025", "wcag-bitv-en301549-unterschiede-einfach-erklaert", "bfsg-website-testen-automatisch-manuell"],

  // Commercial
  "barrierefreiheit-audit-kosten-faktoren": ["audit-kosten", "bfsg-website-testen-automatisch-manuell", "bfsg-anwendbarkeit-website-check"],

  // Media
  "barrierefreie-videos-untertitel-transkripte-player": ["bfsg-2025", "top-15-barrierefreiheit-fehler-websites-fixes", "barrierefreiheitserklaerung-inhalt-vorlage"],
  "screenreader-test-nvda-voiceover-quickchecks": ["tastaturbedienung-testen-anleitung-fokus-tab-reihenfolge", "barrierefreie-navigation-menues-skip-links-landmarken", "top-15-barrierefreiheit-fehler-websites-fixes"],
  "barrierefreie-navigation-menues-skip-links-landmarken": ["tastaturbedienung-testen-anleitung-fokus-tab-reihenfolge", "aria-richtig-einsetzen-fehler-patterns", "screenreader-test-nvda-voiceover-quickchecks"],

  // Pillar-esque
  "top-15-barrierefreiheit-fehler-websites-fixes": ["wcag-kontrastwerte-pruefen-einfach-erklaert", "barrierefreie-formulare-best-practices", "gute-alternativtexte-fuer-bilder-schreiben"],
};
