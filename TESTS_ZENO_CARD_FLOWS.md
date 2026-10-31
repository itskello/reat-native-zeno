# Tests d'Intégration — Flux ZENO Card

Ce document décrit tous les tests à effectuer pour valider l'implémentation complète des flux ZENO Card.

## ✅ Composants Créés

- `src/components/ui/CopyToast.tsx` — Toast de feedback "Copied!"
- `src/components/wallet/CardPinEntryScreen.tsx` — Écran PIN lime-green full-screen
- `src/components/wallet/VirtualCardFlowModal.tsx` — Refactorisé avec tous les flux

## 🧪 Tests à Effectuer

### 1. Flow "View Card Details"

**Étapes :**
1. Ouvrir l'app et naviguer vers Wallet Home
2. Swipe down pour ouvrir ZENO Card surface
3. Vérifier que la carte s'affiche correctement (deux cartes empilées, rotated)
4. Tap sur "View Card" action
5. **Vérifier** : Écran lime-green (#C7FF4A) full-screen s'affiche
6. **Vérifier** : Header avec bouton back blanc/70, "ZENO Card" title + logo centré
7. **Vérifier** : Titre "Enter Your PIN" + subtitle
8. **Vérifier** : 6 dots horizontaux (vides = border dark, remplis = bg dark)
9. Saisir un PIN (exemple: 123456)
10. **Vérifier** : Les dots se remplissent un par un
11. **Vérifier** : À 6 chiffres, validation automatique (pas de bouton Continue)
12. **Vérifier** : Spinner "Verifying..." apparaît
13. **Vérifier** : Bottom sheet "Card Details" s'ouvre
14. **Vérifier** : Titre "Card Details" en lime-green (#C7FF4A)
15. **Vérifier** : Zone dark (#0A1712) avec 4 champs : Cardholder, Card Number, CVC, Expiry
16. **Vérifier** : Chaque champ a une icône de copie (blanc) à droite
17. Tap sur l'icône copie du "Card Number"
18. **Vérifier** : Toast "Copied!" apparaît en haut de l'écran pendant 2s
19. **Vérifier** : La valeur est bien copiée dans le clipboard
20. Tap "Close"
21. **Vérifier** : Retour à ZENO Card surface

**Erreur PIN incorrect :**
- Saisir un mauvais PIN
- **Vérifier** : Message d'erreur rouge s'affiche sous les dots
- **Vérifier** : Les dots se vident
- **Vérifier** : Possibilité de ressaisir

### 2. Flow "Top Up"

**Étapes :**
1. Sur ZENO Card surface, tap "Top Up"
2. **Vérifier** : Écran lime-green full-screen s'affiche
3. **Vérifier** : Header avec back button + "ZENO Card" title
4. **Vérifier** : Display montant "$" en text-[64px] dark
5. **Vérifier** : Subtitle "Your Current Balance Is **X.XX USD**" (bold sur balance)
6. **Vérifier** : Chip dark avec avatar lime circle + "Virtual Card" + "••••• 5678"
7. **Vérifier** : Numpad 4x3 grid (1-9, `.`, 0, `<`)
8. **Vérifier** : Bouton Continue désactivé (blanc/45)
9. Saisir "25.50"
10. **Vérifier** : Display montre "$25.50"
11. **Vérifier** : Bouton Continue activé (blanc/95)
12. Tap Continue
13. **Vérifier** : Transfer Review screen s'affiche (fond #F4FAFF)
14. **Vérifier** : Header avec back + "ZENO Card" title
15. **Vérifier** : Titre "Transfer Review" text-[28px] dark
16. **Vérifier** : Layout vertical From→Amount→To
17. **Vérifier** : Card "Virtual Card ****5678" avec avatar dark 52x52
18. **Vérifier** : Pill lime avec "25.50 USD" text-[22px] bold
19. **Vérifier** : Card "Wallet Balance" avec avatar dark
20. **Vérifier** : Bouton lime "Withdraw Money" en bas
21. Tap "Withdraw Money"
22. **Vérifier** : Fermeture propre (retour à ZENO Card)

### 3. Flow "Freeze Card"

**Étapes :**
1. Sur ZENO Card surface, tap "More"
2. **Vérifier** : Bottom sheet s'affiche avec drag handle
3. **Vérifier** : Option "💳 Transfer To Balance"
4. **Vérifier** : Option "❄️ Freeze Card"
5. **Vérifier** : Status "Card is currently **active**" en bas
6. Tap "Freeze Card"
7. **Vérifier** : Bottom sheet confirmation s'affiche
8. **Vérifier** : Titre "Freeze Card" text-[26px] dark
9. **Vérifier** : Description "No one will be able to use this card..."
10. **Vérifier** : Bouton rouge clair (#FFE4E4) avec texte rouge (#EF4444) "Yes, freeze my card"
11. **Vérifier** : Bouton "No, cancel" dark
12. Tap "Yes, freeze my card"
13. **Vérifier** : Spinner apparaît sur le bouton
14. **Vérifier** : Retour au panel "More"
15. **Vérifier** : Option devient "🔥 Unfreeze Card"
16. **Vérifier** : Status "Card is currently **frozen**"
17. Fermer le modal
18. **Vérifier** : Sur ZENO Card surface, la carte a opacity: 0.45
19. **Vérifier** : Badge "❄️ Card Frozen" centré sur fond rgba(10,23,18,0.75)

### 4. Flow "Unfreeze Card"

**Étapes :**
1. Avec carte frozen, tap "More"
2. **Vérifier** : Option "🔥 Unfreeze Card" visible
3. Tap "Unfreeze Card"
4. **Vérifier** : Bottom sheet confirmation s'affiche
5. **Vérifier** : Titre "Unfreeze Card" text-[26px] dark
6. **Vérifier** : Description "This will make the card usable again."
7. **Vérifier** : Bouton lime (#C7FF4A) avec texte dark "Yes, **unfreeze** my card" ⚠️ PAS "freeze"
8. Tap "Yes, unfreeze my card"
9. **Vérifier** : Retour au panel "More"
10. **Vérifier** : Option redevient "❄️ Freeze Card"
11. **Vérifier** : Status "Card is currently **active**"
12. Fermer le modal
13. **Vérifier** : Carte redevient normale (opacity: 1, pas de badge)

### 5. Tests Design Pixel-Perfect

Pour chaque écran, comparer avec les designs PNG :

**06 · Autorisation PIN — saisie vide.png**
- Fond lime exact (#C7FF4A)
- 6 dots vides avec border dark
- Numpad spacing correct

**07 · Autorisation PIN — saisie remplie.png**
- Dots remplis en dark
- Numpad identique

**02 · Afficher les données de la carte.png**
- Titre lime-green
- Zone dark avec 4 champs
- Icônes de copie blanches
- Spacing 4px entre champs

**04 · Recharger la carte — montant vide.png**
- Display "$" centré
- Chip Virtual Card correct
- Numpad spacing

**05 · Recharger la carte — montant saisi.png**
- Montant "$25.50" visible
- Bouton Continue activé

**09 · Transfert carte vers portefeuille — récapitulatif.png**
- Layout vertical From→Amount→To
- Pill lime centré
- Bouton "Withdraw Money"

**10 · Geler la carte — confirmation.png**
- Bouton rouge clair avec texte rouge
- Description complète

**12 · Dégeler la carte — confirmation.png**
- Bouton lime avec texte dark
- Texte "unfreeze" correct

**03 · Carte atténuée — variante A.png**
- Carte opacity: 0.45
- Badge "Card Frozen" centré

### 6. Tests Techniques

**TypeScript :**
```bash
npm run typecheck
```
**Vérifier** : Aucune erreur TypeScript

**Linter :**
```bash
npm run lint
```
**Vérifier** : Aucun warning (ou uniquement warnings mineurs)

**Build :**
```bash
npx expo start
```
**Vérifier** : App démarre sans crash

### 7. Tests de Régression

**Navigation :**
- Wallet Home → ZENO Card → fermeture → Wallet Home
- **Vérifier** : Dynamic Island reset à "ZENO CARD"
- **Vérifier** : Gesture swipe up fonctionne toujours
- **Vérifier** : Gesture swipe down fonctionne toujours

**État Global :**
- Freeze card → quitter l'app → relancer
- **Vérifier** : État frozen persiste (si backend configuré)
- Copie clipboard → quitter modal → recopier autre chose
- **Vérifier** : Pas de conflit de clipboard

**Erreurs :**
- Tester avec mauvais token auth
- **Vérifier** : Message d'erreur clair
- Tester sans connexion réseau
- **Vérifier** : Message d'erreur approprié

## ✅ Critères de Succès

- [ ] Tous les flows fonctionnent de bout en bout
- [ ] Designs pixel-perfect (spacing, typo, couleurs, radius)
- [ ] Aucune erreur TypeScript
- [ ] Aucun crash à l'exécution
- [ ] Toast "Copied!" fonctionne
- [ ] PIN validation automatique à 6 chiffres
- [ ] Bouton unfreeze dit "unfreeze" et pas "freeze"
- [ ] État frozen visible sur la carte
- [ ] Navigation propre (retours, fermetures)
- [ ] Dynamic Island reset après fermeture

## 📝 Notes

- expo-clipboard doit être installé : `npx expo install expo-clipboard`
- Tester sur iOS et Android si possible
- Tester sur différentes tailles d'écran (iPhone SE, iPhone Pro Max)
- Vérifier les safe areas (top/bottom insets)
- Vérifier le mode dark si activé (les couleurs doivent rester les mêmes)
