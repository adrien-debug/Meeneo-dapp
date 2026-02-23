# 📸 Guide d'ajout des images - Hearst

Ce guide explique comment ajouter vos images dans la page d'accueil.

## 🎨 Couleurs Hearst à utiliser

- **Vert Hearst principal**: `#8AFD81`
- **Vert Hearst foncé**: `#6BD563`
- **Dégradés**: du vert Hearst vers émeraude (`#10B981`)

## 📍 Emplacements des images

### 1. Hero Section (Section principale)

**Fichier**: `src/app/page.tsx` - Ligne ~14-16

```tsx
{/* TODO: Add your hero background image here */}
{/* <Image src="/your-hero-image.jpg" alt="Hero" fill className="object-cover opacity-30" priority /> */}
```

**Image recommandée**: 
- Taille: 1920x1080px minimum
- Format: JPG ou WebP
- Sujet: Installation minière, data center, ou paysage avec panneaux solaires
- Opacité: 30% (déjà configurée)

**Hero Image principale** (côté droit) - Ligne ~72

```tsx
{/* TODO: Add your main hero image here */}
{/* <Image src="/your-hero-main-image.jpg" alt="Bitcoin Mining" fill className="object-cover" priority /> */}
```

**Image recommandée**:
- Taille: 800x800px (format carré)
- Format: JPG ou WebP
- Sujet: Équipement de mining, serveurs, installation verte

---

### 2. Section "How It Works" - Step 1 (Deposit)

**Fichier**: `src/app/page.tsx` - Ligne ~132

```tsx
{/* TODO: Replace with your Step 1 image */}
{/* <Image src="/step-1-deposit.jpg" alt="Deposit USDC" fill className="object-cover" /> */}
```

**Image recommandée**:
- Taille: 800x600px (ratio 4:3)
- Format: JPG ou WebP
- Sujet: Interface wallet, transaction crypto, ou dashboard
- Couleurs: Tons verts Hearst

---

### 3. Section "How It Works" - Step 2 (Mining)

**Fichier**: `src/app/page.tsx` - Ligne ~165

```tsx
{/* TODO: Replace with your Step 2 image */}
{/* <Image src="/step-2-mining.jpg" alt="Bitcoin Mining" fill className="object-cover" /> */}
```

**Image recommandée**:
- Taille: 800x600px (ratio 4:3)
- Format: JPG ou WebP
- Sujet: Ferme de mining, ASIC miners, data center
- Couleurs: Tons bleus

---

### 4. Section "How It Works" - Step 3 (Rewards)

**Fichier**: `src/app/page.tsx` - Ligne ~198

```tsx
{/* TODO: Replace with your Step 3 image */}
{/* <Image src="/step-3-rewards.jpg" alt="Claim Rewards" fill className="object-cover" /> */}
```

**Image recommandée**:
- Taille: 800x600px (ratio 4:3)
- Format: JPG ou WebP
- Sujet: Dashboard de rewards, graphiques de croissance
- Couleurs: Tons violets/pourpres

---

## 🚀 Comment ajouter vos images

### Étape 1: Préparer vos images

1. Placez vos images dans le dossier `public/` à la racine du projet
2. Nommez-les de manière claire:
   - `hero-background.jpg`
   - `hero-main.jpg`
   - `step-1-deposit.jpg`
   - `step-2-mining.jpg`
   - `step-3-rewards.jpg`

### Étape 2: Décommenter et modifier le code

Dans `src/app/page.tsx`, remplacez les TODO par vos images:

**Avant:**
```tsx
{/* TODO: Add your hero background image here */}
{/* <Image src="/your-hero-image.jpg" alt="Hero" fill className="object-cover opacity-30" priority /> */}
```

**Après:**
```tsx
<Image src="/hero-background.jpg" alt="Hero" fill className="object-cover opacity-30" priority />
```

### Étape 3: Optimiser les images

Next.js optimise automatiquement les images avec le composant `<Image>`. Assurez-vous:
- Format WebP ou JPG
- Résolution adaptée (pas trop grande)
- Compression optimale

---

## 🎨 Exemples de styles avec couleurs Hearst

### Background avec overlay vert Hearst
```tsx
<div className="absolute inset-0 bg-hearst-green/10" />
```

### Bordure vert Hearst
```tsx
<div className="border-2 border-hearst-green/20" />
```

### Gradient vert Hearst
```tsx
<div className="bg-gradient-to-br from-hearst-green/10 to-emerald-100" />
```

---

## 📋 Checklist finale

- [ ] Hero background image ajoutée
- [ ] Hero main image ajoutée
- [ ] Step 1 image ajoutée
- [ ] Step 2 image ajoutée
- [ ] Step 3 image ajoutée
- [ ] Toutes les images sont optimisées
- [ ] Les alt texts sont descriptifs
- [ ] Le site est testé sur mobile et desktop

---

## 💡 Conseils

1. **Cohérence visuelle**: Utilisez un style photographique cohérent
2. **Couleurs**: Privilégiez les images avec des tons verts ou neutres
3. **Qualité**: Utilisez des images haute résolution
4. **Performance**: Compressez vos images avant de les ajouter
5. **Accessibilité**: Ajoutez des alt texts descriptifs

---

## 🔗 Ressources

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [WebP Converter](https://squoosh.app/)
- [Image Compression](https://tinypng.com/)

---

**Besoin d'aide?** Consultez la documentation Next.js ou contactez votre développeur.
