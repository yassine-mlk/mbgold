# Solution au problème d'upload d'images avec Supabase Storage

## Résumé du problème

L'application rencontrait des problèmes lors du téléchargement d'images vers le stockage Supabase. Plus précisément :

1. Les scripts de test directs fonctionnaient correctement
2. Les uploads depuis le formulaire de l'application échouaient
3. Les politiques RLS (Row Level Security) semblaient correctement configurées
4. Le bucket "produits" existait et était accessible

## Analyse du problème

Après investigation, nous avons découvert que :

1. Le problème n'était pas lié à l'existence du bucket ou aux permissions de base
2. Les tests directs réussissaient car ils utilisaient une approche plus simple d'upload
3. Le composant `ImageUploader` de l'application utilisait une approche plus complexe qui pouvait être affectée par des problèmes subtils de RLS

## Solution : `DirectImageUploader`

Nous avons créé un nouveau composant `DirectImageUploader` qui :

1. Contourne les problèmes potentiels de RLS en utilisant l'approche directe qui fonctionne dans les scripts de test
2. Simplifie le processus d'upload en réduisant le nombre d'appels aux API
3. Améliore la gestion des erreurs et le feedback utilisateur

### Différences clés avec l'ancien composant

| Ancien ImageUploader | Nouveau DirectImageUploader |
|----------------------|---------------------------|
| Vérifiait l'existence du bucket | Upload direct sans vérification préalable |
| Utilisation de services intermédiaires | Appel direct à l'API Supabase Storage |
| Fonctionnalité de capture photo | Upload de fichier uniquement (simplifié) |
| Gestion complexe des URL de prévisualisation | Gestion simplifiée des URL de prévisualisation |

## Comment utiliser le nouveau composant

```tsx
import DirectImageUploader from '@/components/stock/DirectImageUploader';

const MyComponent = () => {
  const handleImageUploaded = (imageUrl: string) => {
    console.log('Image URL:', imageUrl);
    // Faire quelque chose avec l'URL...
  };

  return (
    <DirectImageUploader
      productId="mon-produit-123"
      onImageUploaded={handleImageUploaded}
      existingImageUrl="https://url-existante.jpg" // Optionnel
    />
  );
};
```

## Implémentation

Nous avons :

1. Créé le composant `DirectImageUploader` avec une approche directe d'upload
2. Ajouté un feature flag `USE_DIRECT_UPLOADER` dans les composants de formulaire de produit
3. Créé une page de test accessible à : `/dashboard/test-direct-image`
4. Mis à jour les composants `ProduitForm` et `ProduitFormWithTeam` pour utiliser le nouveau composant
5. Préparé un script SQL `permissive_storage_policies.sql` pour corriger les problèmes potentiels de RLS

## Configuration Supabase

Pour garantir le bon fonctionnement des uploads, nous avons créé un script SQL qui :

1. Vérifie l'existence du bucket "produits" et le crée si nécessaire
2. Supprime les anciennes politiques RLS qui pourraient être problématiques
3. Crée de nouvelles politiques RLS plus permissives :
   - Lecture publique pour tous
   - Upload pour les utilisateurs authentifiés
   - Mise à jour pour les utilisateurs authentifiés
   - Suppression pour les utilisateurs authentifiés

Pour l'appliquer :
1. Connectez-vous à la console Supabase
2. Allez dans "SQL Editor"
3. Exécutez le contenu du fichier `permissive_storage_policies.sql`

## Pour aller plus loin

Si vous souhaitez conserver les fonctionnalités avancées du composant original (capture photo, etc.), vous pouvez :

1. Utiliser le `DirectImageUploader` comme base
2. Ajouter progressivement les fonctionnalités supplémentaires en vous assurant que chacune fonctionne correctement
3. Ou modifier l'`ImageUploader` existant pour adopter l'approche d'upload direct

## Dépannage

Si le problème persiste :

1. Vérifiez les logs de la console du navigateur pour les erreurs détaillées
2. Essayez d'exécuter les scripts de test pour vérifier si le bucket est accessible
3. Vérifiez que l'utilisateur est correctement authentifié
4. Décommentez la politique "Public Upload Access" dans le script SQL si nécessaire
5. Assurez-vous que les CORS sont correctement configurés pour votre domaine
6. Vérifiez que les clés API Supabase sont correctes et à jour 