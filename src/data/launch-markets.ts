/**
 * Recommended first 10 markets for ZENO's Mobile Money rollout.
 *
 * This is a planning catalog, not an activation switch. Live deposit and
 * withdrawal screens must continue to use only markets enabled in the
 * financial backend until credentials, settlement, compliance, and end-to-end
 * tests are complete for each market.
 */
export type LaunchMarketPartner = {
  id: "paydunya" | "pawapay";
  /** Publicly documented collection rails; provider activation still required. */
  collectionOperators: string[];
  /** Publicly documented payout rails; confirm merchant-specific availability. */
  payoutOperators: string[];
  /** True when the provider says this market needs local accounts/orchestration. */
  localOrchestration?: boolean;
  /** Public availability has a plan, merchant-type, or rollout caveat. */
  caveat?: string;
};

export type LaunchMarket = {
  id: string;
  name: string;
  isoCode: string;
  localCurrency: "XOF" | "GHS" | "NGN" | "XAF" | "CDF";
  priority: number;
  rationale: string;
  partners: LaunchMarketPartner[];
};

/**
 * Country selection favors ZENO's West/Central African starting corridor,
 * adds large neighboring mobile-money markets, and uses the union of both
 * providers instead of requiring each provider to cover every market.
 */
export const recommendedLaunchMarkets: LaunchMarket[] = [
  {
    id: "benin", name: "Bénin", isoCode: "BEN", localCurrency: "XOF", priority: 1,
    rationale: "Marché de départ de ZENO; deux fournisseurs et Celtiis via PayDunya.",
    partners: [
      { id: "paydunya", collectionOperators: ["MTN", "Moov", "Celtiis"], payoutOperators: ["MTN", "Moov", "Celtiis"] },
      { id: "pawapay", collectionOperators: ["MTN", "Moov"], payoutOperators: ["MTN", "Moov"] },
    ],
  },
  {
    id: "cote-divoire", name: "Côte d’Ivoire", isoCode: "CIV", localCurrency: "XOF", priority: 2,
    rationale: "Marché de départ de ZENO; large choix d’opérateurs et deux fournisseurs.",
    partners: [
      { id: "paydunya", collectionOperators: ["Orange", "MTN", "Moov", "Wave"], payoutOperators: ["Orange", "MTN", "Moov"] },
      { id: "pawapay", collectionOperators: ["MTN", "Orange", "Moov", "Wave"], payoutOperators: ["MTN", "Orange", "Moov", "Wave"], caveat: "Orange est indiqué comme activation Enterprise/à venir sur la page des forfaits; confirmer l’état réel du compte." },
    ],
  },
  {
    id: "senegal", name: "Sénégal", isoCode: "SEN", localCurrency: "XOF", priority: 3,
    rationale: "Marché francophone avec plusieurs rails et couverture complémentaire.",
    partners: [
      { id: "paydunya", collectionOperators: ["Orange", "Free", "Expresso", "Wave", "Wizall", "Djamo"], payoutOperators: ["Orange", "Free", "Expresso", "Wave"] },
      { id: "pawapay", collectionOperators: ["Mixx", "Orange", "Wave"], payoutOperators: ["Mixx", "Orange", "Wave"] },
    ],
  },
  {
    id: "burkina-faso", name: "Burkina Faso", isoCode: "BFA", localCurrency: "XOF", priority: 4,
    rationale: "Marché voisin en XOF avec Orange et Moov chez les deux fournisseurs.",
    partners: [
      { id: "paydunya", collectionOperators: ["Orange", "Moov"], payoutOperators: ["Orange", "Moov"] },
      { id: "pawapay", collectionOperators: ["Orange", "Moov"], payoutOperators: ["Orange", "Moov"] },
    ],
  },
  {
    id: "mali", name: "Mali", isoCode: "MLI", localCurrency: "XOF", priority: 5,
    rationale: "Marché UEMOA en XOF; Orange et Moov sont communs aux deux réseaux.",
    partners: [
      { id: "paydunya", collectionOperators: ["Orange", "Moov"], payoutOperators: ["Orange", "Moov"] },
      { id: "pawapay", collectionOperators: ["Orange", "Moov", "Wave"], payoutOperators: ["Orange", "Moov", "Wave"], localOrchestration: true, caveat: "pawaPay déclare un modèle d’orchestration au Mali; comptes locaux et exigences de l’entreprise à confirmer." },
    ],
  },
  {
    id: "togo", name: "Togo", isoCode: "TGO", localCurrency: "XOF", priority: 6,
    rationale: "Extension directe de la zone de départ; PayDunya apporte la couverture que pawaPay ne publie pas ici.",
    partners: [
      { id: "paydunya", collectionOperators: ["T-Money", "Moov Togo"], payoutOperators: ["T-Money", "Moov Togo"] },
    ],
  },
  {
    id: "ghana", name: "Ghana", isoCode: "GHA", localCurrency: "GHS", priority: 7,
    rationale: "Extension anglophone avec trois réseaux documentés chez pawaPay.",
    partners: [
      { id: "pawapay", collectionOperators: ["MTN", "Telecel", "AirtelTigo (AT)"], payoutOperators: ["MTN", "Telecel", "AirtelTigo (AT)"] },
    ],
  },
  {
    id: "nigeria", name: "Nigeria", isoCode: "NGA", localCurrency: "NGN", priority: 8,
    rationale: "Grand marché régional avec MTN et Airtel; pawaPay est le seul des deux à publier cette couverture.",
    partners: [
      { id: "pawapay", collectionOperators: ["MTN", "Airtel"], payoutOperators: ["MTN", "Airtel"], localOrchestration: true, caveat: "Modèle d’orchestration; certains opérateurs sont réservés au forfait Enterprise." },
    ],
  },
  {
    id: "cameroon", name: "Cameroun", isoCode: "CMR", localCurrency: "XAF", priority: 9,
    rationale: "Marché d’Afrique centrale avec opérateurs complémentaires entre les deux fournisseurs.",
    partners: [
      { id: "paydunya", collectionOperators: ["MTN"], payoutOperators: ["MTN"] },
      { id: "pawapay", collectionOperators: ["MTN", "Orange"], payoutOperators: ["MTN", "Orange"] },
    ],
  },
  {
    id: "democratic-republic-of-congo", name: "République démocratique du Congo", isoCode: "COD", localCurrency: "CDF", priority: 10,
    rationale: "Extension importante en Afrique centrale; trois réseaux publiés par pawaPay.",
    partners: [
      { id: "pawapay", collectionOperators: ["Airtel", "Orange", "Vodacom M-Pesa"], payoutOperators: ["Airtel", "Orange", "Vodacom M-Pesa"] },
    ],
  },
];
