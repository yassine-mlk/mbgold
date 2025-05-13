# Nouveau Modèle de Prix - Documentation

## Introduction

Ce document explique le nouveau modèle de prix mis en place dans l'application de gestion de bijouterie. Ce modèle décompose le prix de vente en trois composantes distinctes:

1. **Prix de la matière première** (`prixMatierePremiere`): Coût de la matière première qui varie avec les cours du marché
2. **Prix de façonnage** (`prixFaconnage`): Coût fixe de la main d'œuvre et du travail artisanal
3. **Marge** (`marge`): Bénéfice fixe sur le produit

Le prix de vente est maintenant calculé comme la somme de ces trois composantes:
```
prixVente = prixMatierePremiere + prixFaconnage + marge
```

## Modification de la Base de Données

### Étapes pour appliquer les changements

1. Connectez-vous à votre Dashboard Supabase
2. Allez dans la section "SQL Editor"
3. Créez une nouvelle requête
4. Copiez et collez le contenu du fichier `update_product_table.sql`
5. Exécutez la requête

Le script SQL va:
- Ajouter les trois nouvelles colonnes à la table `produits`
- Calculer des valeurs par défaut pour les produits existants
- Créer un déclencheur qui calcule automatiquement le prix de vente à partir des trois composantes

## Modifications du Code

Les fichiers suivants ont été mis à jour pour prendre en charge le nouveau modèle de prix:

1. **Interface du produit** (`src/services/supabase/stock.ts`)
   - Ajout des propriétés `prixMatierePremiere`, `prixFaconnage` et `marge` à l'interface `Produit`
   - Mise à jour des fonctions de mapping pour convertir entre les formats base de données et application

2. **Formulaire de produit** (`src/components/stock/ProduitFormWithTeam.tsx`)
   - Mise à jour pour afficher et gérer les trois composantes de prix
   - Calcul automatique du prix de vente basé sur la somme des trois composantes

3. **Page de détails du produit** (`src/pages/dashboard/ProduitDetailsPage.tsx`)
   - Affichage des trois composantes de prix dans une section dédiée
   - Visualisation claire de la décomposition du prix de vente

## Calcul des Prix

Le nouveau modèle permet:

1. **Calcul automatique du prix de la matière première** basé sur le poids du produit et le cours actuel du métal
2. **Ajustement indépendant du prix de façonnage** pour refléter la complexité du travail
3. **Contrôle précis de la marge** pour gérer la rentabilité

Lorsque le cours des matières premières change, seule la composante `prixMatierePremiere` est affectée, tandis que le `prixFaconnage` et la `marge` restent constants.

## Avantages du Nouveau Modèle

- **Transparence accrue** sur la structure des prix
- **Adaptabilité automatique** aux variations des cours des matières premières
- **Meilleure analyse de la rentabilité** par produit
- **Simplification des ajustements de prix** lorsque le coût de la matière première change

---

Pour toute question ou assistance supplémentaire concernant ce nouveau modèle de prix, veuillez contacter l'équipe de support. 