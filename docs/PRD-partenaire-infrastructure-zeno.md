# PRD partenaire d’infrastructure — ZENO

**Version :** brouillon de cadrage partenaire  
**Date :** 13 novembre 2026  
**Destinataire :** Prince Yates  
**Objet :** présenter ZENO et permettre l’identification du fournisseur d’infrastructure et le cadrage de l’onboarding  
**Statut :** document de discussion — les points marqués « à confirmer » ne sont pas des décisions contractuelles ou réglementaires.

---

## 1. Résumé du projet

ZENO est une solution fintech développée par KELLO pour les particuliers, freelances, créateurs, entrepreneurs et petites entreprises. Elle vise une expérience simple et sécurisée, proposée aux utilisateurs sous la marque ZENO.

Nous cherchons un partenaire capable de nous accompagner dans la mise en place d’une infrastructure financière en marque blanche ou intégrée à notre expérience, avec une API permettant notamment :

- d’ouvrir et gérer un wallet utilisateur;
- d’effectuer des dépôts et retraits par Mobile Money;
- de transférer de l’argent entre utilisateurs ZENO;
- de créer des liens de paiement avec versement Mobile Money souhaité, des demandes d’argent et des paiements par QR code;
- de proposer une carte virtuelle, fonctionnalité importante de ZENO, que l’utilisateur approvisionne depuis son wallet ZENO.

---

## 2. Société et modèle de partenariat

- **Pays d’enregistrement prévu de la société :** Bénin. L’enregistrement est prévu; 
- **Modèle souhaité :** ZENO garde sa propre marque et son expérience utilisateur. Le fournisseur fournit l’infrastructure et les API nécessaires; son identité n’est pas mise en avant dans l’interface ZENO, sous réserve des mentions légales et obligations de conformité applicables.
- **Modèle de départ envisagé :** être mis en relation avec un fournisseur API par votre intermédiaire et être accompagné pendant l’onboarding.
- **Évolution éventuelle :** une intégration directe avec votre propre plateforme pourrait être faite plus tard.
- **Conservation et mouvement des fonds :** le modèle juridique et opérationnel exact reste à déterminer avec le fournisseur et les conseils compétents. Nous souhaitons savoir quelle entité détient les fonds, qui exécute les opérations et quelles licences ou structures sont requises.

---

## 3. Marchés visés au lancement

Notre cible de lancement comprend les dix pays suivants :

| Pays | Devise locale |
|---|---|
| Bénin | XOF |
| Côte d’Ivoire | XOF |
| Sénégal | XOF |
| Burkina Faso | XOF |
| Mali | XOF |
| Togo | XOF |
| Cameroun | XAF |
| Ghana | GHS |
| Nigeria | NGN |
| République démocratique du Congo | CDF |

### Couverture à confirmer avec le fournisseur

Pour chacun des dix marchés, nous souhaitons obtenir :

- les opérateurs disponibles pour la collecte (cash-in);
- les opérateurs disponibles pour le décaissement (cash-out);
- les devises d’entrée, de sortie et de règlement;
- les restrictions d’onboarding, licences, contrats locaux ou modèle d’orchestration;
- les limites par transaction, par jour et par mois;
- les frais opérateur et frais du fournisseur;
- les délais habituels et les règles de règlement;
- les exigences de disponibilité d’un compte marchand ou d’un solde préfinancé.

---

## 4. Modèle du wallet ZENO

### 4.1 Un wallet principal par utilisateur

Chaque utilisateur ZENO dispose d’un **seul wallet principal** associé à son compte. Le produit ne doit pas présenter plusieurs wallets indépendants pour un même utilisateur.

### 4.2 Une devise sélectionnée pour le wallet

Le wallet fonctionne avec **une devise de solde à la fois** :

- la devise locale associée au pays de l’utilisateur; ou
- le dollar américain (USD), si cette option est proposée et autorisée pour cet utilisateur.

L’utilisateur peut choisir la devise du wallet parmi les options qui lui sont accessibles. **Si aucune devise n’est choisie, USD est la devise par défaut**, sous réserve que le fournisseur puisse légalement et techniquement proposer cette configuration à l’utilisateur concerné.

### 4.3 Conséquences attendues

- Le solde affiché et les opérations du wallet utilisent la devise sélectionnée.
- Le wallet doit être rattaché à un profil utilisateur unique, même si le fournisseur représente techniquement les fonds dans plusieurs comptes ou registres internes.
- Lorsqu’un utilisateur reçoit des fonds dans une devise différente de celle de son wallet, la conversion vers la devise du wallet se fait automatiquement
- Le reçu ou la facture de transaction doit indiquer le montant et la devise d’origine, le taux de change appliqué, les frais éventuels, le montant final crédité et la devise du wallet.

---

## 5. Produits et parcours financiers requis

### 5.1 Collecte / ajout d’argent

Un utilisateur doit pouvoir alimenter son wallet par Mobile Money :

1. sélectionner le pays et l’opérateur disponibles;
2. saisir le numéro Mobile Money et le montant;
3. confirmer l’opération;
4. autoriser le paiement selon le parcours de l’opérateur;
5. recevoir un statut vérifiable et un reçu;
6. voir son wallet crédité uniquement après confirmation fiable du paiement.

Lorsque l’opérateur collecte dans une devise locale différente de celle du wallet — par exemple une collecte en XOF pour un utilisateur dont le wallet est en USD — le montant doit être converti automatiquement dans la devise du wallet, Le reçu ou la facture doit présenter le montant collecté, le taux appliqué, les frais éventuels et le montant crédité dans le wallet. Les taux, frais et règles de règlement restent à confirmer avec le fournisseur.

### 5.2 Décaissement / retrait

Un utilisateur doit pouvoir retirer de l’argent de son wallet vers un numéro Mobile Money pris en charge :

1. choisir le pays et l’opérateur;
2. saisir le bénéficiaire et le montant;
3. consulter les frais et le montant total;
4. confirmer de façon sécurisée;
5. suivre le statut jusqu’à la réussite ou à l’échec définitif.

Nous souhaitons connaître les règles de préfinancement, de réservation des fonds, de remboursement en cas d’échec, de réconciliation et de gestion des opérations en attente.

### 5.3 Transferts entre utilisateurs ZENO

Les utilisateurs doivent pouvoir envoyer des fonds à un autre utilisateur ZENO. Chaque opération doit avoir un statut clair, une référence durable et un historique consultable.

À cadrer avec le fournisseur :

- transfert dans la même devise;
- transferts entre pays;
- comportement lorsque l’expéditeur et le destinataire utilisent des devises différentes;
- disponibilité ou non d’un transfert transfrontalier;
- frais, limites, traitement du change et règlement.

Si le bénéficiaire reçoit des fonds dans une devise différente de celle de son wallet, le montant doit être converti automatiquement dans la devise du wallet

### 5.4 Liens et demandes de paiement

ZENO prévoit :

- la création de liens de paiement partageables;
- la réception d’un paiement par lien. **Le besoin souhaité est que le paiement soit versé directement sur le numéro Mobile Money que le bénéficiaire a enregistré dans ZENO, et non crédité sur son wallet ZENO.** L’utilisateur doit pouvoir enregistrer le numéro Mobile Money de réception; le versement direct dépend de la capacité du fournisseur et reste à confirmer;
- les demandes d’argent entre utilisateurs;
- un QR code personnel ZENO permettant de recevoir un paiement simplement : le bénéficiaire affiche son QR code, le payeur le scanne, vérifie l’identité ou le nom du bénéficiaire, saisit le montant à envoyer puis confirme le paiement. Le wallet du bénéficiaire est crédité selon la devise et les règles de transfert applicables, et les deux utilisateurs reçoivent une confirmation avec une référence de transaction.

Nous souhaitons savoir si l’API partenaire peut encaisser le paiement d’un lien puis effectuer un décaissement direct vers le numéro Mobile Money enregistré du bénéficiaire, sans créditer son wallet ZENO. Merci de préciser les pays et opérateurs compatibles, les frais, délais, limites, statuts et exigences de vérification du numéro. Si ce versement direct n’est pas possible, merci de préciser les alternatives disponibles. Les liens de paiement et les demandes d’argent peuvent-ils être fournis directement par l’API partenaire, via un module hébergé, ou doivent-ils être développés par ZENO au-dessus des fonctions de collecte et de wallet? Pour le QR code, nous souhaitons confirmer les moyens pris en charge pour associer le code au bénéficiaire, retrouver son compte lors du scan, et exécuter et confirmer le paiement de façon sécurisée.

### 5.5 Carte virtuelle

La carte virtuelle est une fonctionnalité importante du produit ZENO et fait partie du périmètre que nous souhaitons étudier avec le partenaire dès maintenant. Elle dispose d’un solde distinct du wallet. L’utilisateur peut transférer de l’argent de son wallet ZENO vers sa carte pour l’approvisionner, puis transférer de l’argent de la carte vers son wallet. Les paiements par carte sont débités du solde de la carte. Les devises, délais, limites, frais et éventuelles restrictions de ces transferts restent à confirmer avec le fournisseur.

Merci de préciser :

- les partenaires émetteurs disponibles;
- documents requis;
- les transferts de fonds dans les deux sens entre le wallet ZENO et le solde de la carte, ainsi que les devises, délais, limites, restrictions et éventuels frais;
- la consultation du solde carte et l’historique des paiements par carte;
- les délais, coûts et étapes avant activation.

---

## 6. Expérience de marque et intégration

Nous voulons que l’utilisateur utilise une application ZENO avec une identité visuelle et des parcours ZENO. L’API et l’infrastructure du partenaire doivent être intégrées côté serveur, sans exposer de clés secrètes dans l’application mobile.

---

## 7. Sécurité, conformité et opérations

ZENO souhaite construire des parcours traçables avec des états financiers fiables. Nous devons clarifier la répartition des responsabilités entre ZENO, l’intermédiaire et le fournisseur concernant :

- KYC/KYB, AML et contrôles de sanctions;
- conservation, protection, accès et suppression des données;
- gestion des plaintes, fraude et opérations non autorisées;
- rapprochement des paiements et relevés;
- webhooks signés, clés API et rotation des secrets;
- journal d’audit et identifiants de transaction;
- gestion des opérations en attente, rejets, remboursements et litiges;
- politiques de limites et de blocage.

Nous ne supposons pas qu’une seule autorisation couvre les dix marchés. Nous avons besoin de connaître la structure exacte proposée pour chaque pays et chaque service.

---

## 8. Prévisions de volumes

Les chiffres ci-dessous sont des **hypothèses préliminaires de planification** pour le lancement visé dans les dix pays. Ce ne sont ni des volumes déjà réalisés ni des engagements garantis envers le fournisseur. Les montants sont exprimés en équivalent XOF pour permettre une comparaison entre marchés et devront être affinés selon les devises, taux et corridors réellement disponibles.

### Scénario central de montée en puissance

| Indicateur cumulé ou en fin de période | Après 3 mois | Après 6 mois | Après 12 mois |
|---|---:|---:|---:|
| Pays visés | 10 | 10 | 10 |
| Utilisateurs inscrits cumulés | 2 000 | 5 000 | 12 000 |
| Utilisateurs actifs estimés en fin de période | 700 | 1 800 | 4 000 |
| Envois cumulés | 4 000 | 15 000 | 50 000 |
| Montant moyen estimé par envoi | 3 500 XOF | 3 500 XOF | 3 500 XOF |
| Volume cumulé envoyé | 14 millions XOF | 52,5 millions XOF | 175 millions XOF |

Pour ce tableau, un utilisateur actif est provisoirement défini comme un utilisateur ayant effectué au moins une opération au cours des 30 derniers jours. Les envois cumulés désignent le nombre de transferts envoyés; ils n’incluent pas une seconde fois les retraits du même argent.

### Fourchette de scénarios à 12 mois

| Scénario | Inscrits cumulés | Actifs estimés en fin de période | Envois cumulés | Montant moyen par envoi | Volume cumulé envoyé |
|---|---:|---:|---:|---:|---:|
| Prudent | 6 000 | 2 000 | 20 000 | 2 000 XOF | 40 millions XOF |
| Central | 12 000 | 4 000 | 50 000 | 3 500 XOF | 175 millions XOF |
| Ambitieux | 25 000 | 9 000 | 120 000 | 5 000 XOF | 600 millions XOF |

Le scénario central est notre référence indicative pour la discussion avec le fournisseur; les scénarios prudent et ambitieux illustrent une fourchette de planification. Les volumes envoyés ne représentent pas le chiffre d’affaires de ZENO.

### Hypothèses transactionnelles à confirmer

| Opération | Hypothèse de travail |
|---|---|
| Envoi | Minimum envisagé : 1 000 XOF équivalent; montant moyen central : 3 500 XOF équivalent |
| Retrait Mobile Money | Minimum envisagé : 5 000 XOF équivalent; nombre et volume à estimer séparément |
| Collecte Mobile Money | Nécessaire dans les marchés de lancement; nombre et volume à estimer séparément |
| Paiements par lien avec versement direct Mobile Money | Fonction souhaitée, disponibilité fournisseur à confirmer; volumes à estimer séparément |
| Paiements QR | Parcours prévu; volumes à estimer séparément |
| Transactions par carte virtuelle | Fonctionnalité importante; volumes et dépenses par carte à estimer séparément |
| Conversions | Automatiques vers la devise choisie du wallet lorsque le bénéficiaire reçoit une autre devise, sous réserve de la prise en charge du corridor; taux et frais à confirmer |

Les seuils minimums sont des hypothèses à valider dans chaque pays et devise. Les volumes de retraits et de collecte ne sont pas déduits mécaniquement des transferts : ils doivent être estimés séparément avec le fournisseur afin d’éviter le double comptage.

La répartition exacte des volumes entre les dix pays, devises et opérateurs n’est pas encore estimée. Nous demandons au fournisseur de confirmer la couverture, les limites, les frais, les délais de règlement et les éventuels volumes minimums pour chaque marché.

---

## 9. Questions pour orienter le choix du fournisseur

1. Comment sont traités le règlement et le change lorsque le wallet est en USD mais que le Mobile Money opère en devise locale?
2. Quels documents d’entreprise sont nécessaires pour une société enregistrée au Bénin?
3. Quels sont les frais, limites, délais de règlement, volumes minimums et conditions de préfinancement?
4. Quelles étapes et quels documents supplémentaires sont nécessaires pour l’émission d’une carte virtuelle?

---

## 10. Prochaine étape proposée

Après validation de l’adéquation du fournisseur, nous souhaitons organiser un cadrage pour :

1. obtenir l’accès à la documentation API, au sandbox et au processus d’onboarding;
2. choisir le modèle de wallet et préciser les conditions du wallet USD;
3. clarifier l’entité contractante, la conservation des fonds et les obligations de conformité;
4. recevoir les frais, limites, règlements et besoins de préfinancement;
7. compléter nos prévisions de volume selon le format requis;
8. cadrer l’émission de la carte virtuelle, son approvisionnement depuis le wallet ZENO, ses pays de disponibilité, ses exigences documentaires, ses coûts et son calendrier.

