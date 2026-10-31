export type HelpArticle = {
  id: string;
  collectionId: string;
  question: string;
  answer: string;
  questionEn: string;
  answerEn: string;
};

export type HelpCollection = {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  articleIds: string[];
};

export const HELP_COLLECTIONS: HelpCollection[] = [
  { id: "account", title: "Compte ZENO", titleEn: "ZENO Account", description: "Connexion et gestion de ton compte", descriptionEn: "Sign-in and account management", articleIds: ["forgot-password"] },
  { id: "security", title: "Sécurité", titleEn: "Security", description: "PIN, carte et protection du compte", descriptionEn: "PIN, card and account protection", articleIds: ["change-pin", "card-security"] },
  { id: "add-money", title: "Ajouter de l’argent", titleEn: "Add money", description: "Recharger ton portefeuille avec Mobile Money", descriptionEn: "Top up your wallet with Mobile Money", articleIds: ["add-money"] },
  { id: "withdraw", title: "Retirer de l’argent", titleEn: "Withdraw money", description: "Retraits vers Mobile Money", descriptionEn: "Withdraw to Mobile Money", articleIds: ["withdraw"] },
  { id: "transfers", title: "Envoyer de l’argent", titleEn: "Send money", description: "Transferts vers ZENO et Mobile Money", descriptionEn: "Transfers to ZENO and Mobile Money", articleIds: ["send-money"] },
];

// Searchable help content is kept outside the screen so the page only owns
// search and result presentation. Replace this local source with the support
// knowledge-base API when that article service is available.
export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "add-money",
    collectionId: "add-money",
    question: "Comment ajouter de l’argent à mon portefeuille ?",
    answer: "Depuis le Wallet, choisis Ajouter de l’argent, sélectionne Mobile Money, puis suis les étapes affichées.",
    questionEn: "How do I add money to my wallet?",
    answerEn: "From Wallet, choose Add money, select Mobile Money, then follow the steps shown in the app.",
  },
  {
    id: "withdraw",
    collectionId: "withdraw",
    question: "Comment retirer de l’argent ?",
    answer: "Depuis le Wallet, choisis Retirer, sélectionne ton opérateur Mobile Money, puis indique le numéro et le montant.",
    questionEn: "How do I withdraw money?",
    answerEn: "From Wallet, choose Withdraw, select your Mobile Money provider, then enter the phone number and amount.",
  },
  {
    id: "card-security",
    collectionId: "security",
    question: "Ma carte ZENO est-elle sécurisée ?",
    answer: "Tu peux geler ta carte depuis ZENO Card si tu ne veux plus qu’elle soit utilisée. Ne partage jamais son numéro complet ni son code de sécurité.",
    questionEn: "Is my ZENO Card secure?",
    answerEn: "You can freeze your card from ZENO Card to prevent it from being used. Never share its full number or security code.",
  },
  {
    id: "change-pin",
    collectionId: "security",
    question: "Comment changer mon code PIN ?",
    answer: "Ouvre Profil, puis Sécurité et la rubrique PIN pour modifier ton code. Ne communique jamais ton PIN, même à l’assistance.",
    questionEn: "How do I change my PIN?",
    answerEn: "Open Profile, then Security and the PIN section to change your code. Never share your PIN, including with support.",
  },
  {
    id: "forgot-password",
    collectionId: "account",
    question: "Que faire si j’ai oublié mon mot de passe ?",
    answer: "Sur l’écran de connexion, choisis Mot de passe oublié et suis les instructions de récupération.",
    questionEn: "What if I forgot my password?",
    answerEn: "On the sign-in screen, choose Forgot password and follow the recovery instructions.",
  },
  {
    id: "send-money",
    collectionId: "transfers",
    question: "Comment envoyer de l’argent ?",
    answer: "Depuis le Wallet, choisis Envoyer de l’argent, sélectionne un utilisateur ZENO ou Mobile Money, puis suis les étapes de confirmation.",
    questionEn: "How do I send money?",
    answerEn: "From Wallet, choose Send money, select a ZENO user or Mobile Money, then follow the confirmation steps.",
  },
];
