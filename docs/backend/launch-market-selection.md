# Sélection recommandée des 10 marchés de lancement

**État :** sélection produit recommandée, non activée en production. Vérification des pages fournisseurs : 2 novembre 2026.

## Décision

Retenir les dix pays ci-dessous en combinant les rails publiés par PayDunya et pawaPay. Les pays couverts par un seul fournisseur utilisent celui-ci; les pays couverts par les deux peuvent être routés selon l’opérateur, le prix, la disponibilité et le règlement. Cette sélection n’affirme pas que ZENO est autorisé ni déjà onboardé dans ces marchés.

| Ordre | Pays | Devise locale | PayDunya — collecte / décaissement publiés | pawaPay — opérateurs publiés | Route à instruire |
|---:|---|---|---|---|---|
| 1 | Bénin | XOF | MTN, Moov, Celtiis | MTN, Moov | Les deux; PayDunya ajoute Celtiis |
| 2 | Côte d’Ivoire | XOF | MTN, Orange, Moov, Wave en collecte; MTN, Orange, Moov en décaissement | MTN, Orange, Moov, Wave | Les deux; confirmer l’activation réelle de Wave/Orange chez pawaPay |
| 3 | Sénégal | XOF | Orange, Free, Expresso, Wave, Wizall, Djamo en collecte; Orange, Free, Expresso, Wave en décaissement | Mixx, Orange, Wave | Les deux; choix par opérateur et tarif |
| 4 | Burkina Faso | XOF | Orange, Moov | Orange, Moov | Les deux |
| 5 | Mali | XOF | Orange, Moov | Orange, Moov, Wave | Les deux; modèle d’orchestration pawaPay à valider |
| 6 | Togo | XOF | T-Money, Moov Togo | Aucun marché publié | PayDunya |
| 7 | Ghana | GHS | Aucun opérateur trouvé dans l’API publique consultée | MTN, Telecel, AirtelTigo | pawaPay; vérifier onboarding et règlement |
| 8 | Nigeria | NGN | Aucun opérateur trouvé dans l’API publique consultée | MTN, Airtel | pawaPay sous modèle d’orchestration; exigences Enterprise/locales à vérifier |
| 9 | Cameroun | XAF | MTN | MTN, Orange | Les deux pour MTN; pawaPay pour Orange |
| 10 | République démocratique du Congo | CDF | Aucun opérateur trouvé dans l’API publique consultée | Airtel, Orange, Vodacom M-Pesa | pawaPay |

## Pourquoi cette combinaison

- Les six premiers pays forment un noyau ouest-africain francophone; cinq sont en XOF et PayDunya documente des moyens de paiement pour les six.
- Ghana ajoute trois réseaux documentés chez pawaPay et fait partie des pays où GSMA relève une contribution importante du Mobile Money à l’économie.
- Nigeria et RDC apportent les deux plus grands bassins de population de cette sélection (estimations 2025 de la Banque mondiale : environ 238 M et 113 M); pawaPay est le seul des deux à y publier une couverture.
- Cameroun élargit en Afrique centrale; pawaPay ajoute Orange au MTN déjà documenté par PayDunya.
- Le Togo est retenu pour sa proximité avec le Bénin, le XOF et ses rails PayDunya, même si son bassin de population est plus petit. Il complète la couverture car pawaPay ne publie pas de marché togolais.
- La couverture est la réunion des deux fournisseurs, pas une promesse que chacun couvre les dix pays.

## État de l’implémentation ZENO

- Les écrans Mobile Money proposent les dix pays et leurs réseaux documentés. Le pays sélectionné utilise un portefeuille local distinct; aucun change implicite vers le solde USD principal n’est fait.
- Le serveur route les opérateurs documentés entre PayDunya et pawaPay. Il vérifie la configuration active pawaPay avant l’appel et ne crédite/débite le grand livre qu’après confirmation de statut et de montant par l’API fournisseur.
- L’intégration reste en mode sandbox. Elle ne signifie pas que les comptes marchands ont été activés, que chaque opérateur est disponible dans le compte ZENO, ni que les corridors sont autorisés pour un lancement public.
- L’inscription par SMS reste limitée aux indicatifs configurés dans l’application; Didit/KYC est encore configuré pour le Bénin et la Côte d’Ivoire. Ces deux parcours doivent être étendus/confirmés avant d’ouvrir l’inscription dans les dix pays.

## À ne pas confondre

- Une présence de pays sur une page de couverture n’est pas une activation du compte marchand de ZENO.
- Collecte et décaissement ne couvrent pas nécessairement les mêmes opérateurs. Les colonnes PayDunya les distinguent lorsque sa documentation donne des listes différentes.
- pawaPay signale un modèle d’orchestration au Mali et au Nigeria; cela peut exiger que ZENO détienne des comptes ou contrats locaux. Des opérateurs peuvent aussi nécessiter un forfait Enterprise.
- Le site pawaPay indique des frais d’opérateur auxquels s’ajoute sa propre commission, et des délais de règlement dépendant du pays et de l’opérateur. Faire confirmer le devis, les réserves, les limites et les règlements avant toute activation.
- Le portefeuille USD reste distinct des sous-portefeuilles locaux. Les transferts entre devises sont bloqués jusqu’à ce qu’un taux FX et une source de règlement soient convenus.

## Sources officielles consultées

- [PayDunya — API SoftPay et moyens de paiement par pays](https://developers.paydunya.com/doc/FR/api_softpay_index)
- [PayDunya — liste des opérateurs et clés API](https://developers.paydunya.com/doc/FR/introduction)
- [PayDunya — API PUSH / déboursements](https://developers.paydunya.com/doc/FR/api_deboursement)
- [pawaPay — marchés et opérateurs](https://www.pawapay.io/markets)
- [pawaPay — forfaits, restrictions et règlements](https://www.pawapay.io/plans)
- [pawaPay — frais](https://www.pawapay.io/fees)
- [GSMA — State of the Industry Report on Mobile Money 2025](https://www.gsma.com/sotir/wp-content/uploads/2025/04/The-State-of-the-Industry-Report-2025_English.pdf)
- [Banque mondiale — population par pays (2025)](https://data.worldbank.org/indicator/SP.POP.TOTL?locations=A4)
