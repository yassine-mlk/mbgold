import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Type pour un produit
export interface Produit {
  id: string;
  nom: string;
  description: string;
  reference: string;
  codeBarres: string;
  prixAchat: number;
  prixVente: number;
  prixMatierePremiere: number;
  prixFaconnage: number;
  marge: number;
  quantite: number;
  poids: number;
  categorieId: string;
  depotId: string;
  image: string;
  compose?: boolean;
  composants?: {
    produitId: string;
    quantite: number;
  }[];
  created_at?: string;
  updated_at?: string;
}

// Type pour une promotion
export interface Promotion {
  id: string;
  produitId: string;
  type: 'pourcentage' | 'montant' | 'bundle';
  valeur: number;
  dateDebut: string;
  dateFin: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fonction utilitaire pour convertir les noms de colonnes de la base de données 
 * vers les propriétés de notre modèle TypeScript
 */
function mapDatabaseToModel(dbProduct: any): Produit {
  // Afficher toutes les clés disponibles pour le débogage
  console.log("Clés disponibles dans le produit de la BDD:", Object.keys(dbProduct));
  
  return {
    id: dbProduct.id,
    nom: dbProduct.nom,
    description: dbProduct.description || '',
    reference: dbProduct.reference,
    codeBarres: dbProduct.codebarres || dbProduct.reference,
    prixAchat: dbProduct.prixachat || 0,
    prixVente: dbProduct.prixvente || 0,
    prixMatierePremiere: dbProduct.prixmatierepremiere || dbProduct.prixachat || 0,
    prixFaconnage: dbProduct.prixfaconnage || 0,
    marge: dbProduct.marge || 0,
    quantite: dbProduct.quantite || 0,
    poids: dbProduct.poids || 0,
    categorieId: dbProduct.categorieid || '',
    depotId: dbProduct.depotid || '',
    image: dbProduct.image || '',
    compose: dbProduct.compose,
    composants: dbProduct.composants,
    created_at: dbProduct.created_at,
    updated_at: dbProduct.updated_at
  };
}

/**
 * Récupère tous les produits
 */
export const getProduits = async (): Promise<Produit[]> => {
  try {
    const { data, error } = await supabase
      .from('produits')
      .select('*')
      .order('nom');

    if (error) throw error;
    // Transformer les données avant de les renvoyer
    return (data || []).map(mapDatabaseToModel);
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    return [];
  }
};

/**
 * Récupère un produit par son ID
 */
export const getProduitById = async (id: string): Promise<Produit | null> => {
  try {
    const { data, error } = await supabase
      .from('produits')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    // Transformer les données avant de les renvoyer
    return data ? mapDatabaseToModel(data) : null;
  } catch (error) {
    console.error('Erreur lors de la récupération du produit:', error);
    return null;
  }
};

/**
 * Crée un nouveau produit
 */
export const createProduit = async (produit: Omit<Produit, 'id' | 'created_at' | 'updated_at'>): Promise<Produit | null> => {
  try {
    // Afficher l'objet produit complet pour débogage
    console.log("Données du produit à créer:", produit);
    
    // Générer un ID unique
    const id = uuidv4();
    
    // Créer un objet avec les propriétés nécessaires
    const newProduct = {
      id,
      nom: produit.nom,
      reference: produit.reference, 
      prixachat: produit.prixAchat,
      prixvente: produit.prixVente,
      prixmatierepremiere: produit.prixMatierePremiere,
      prixfaconnage: produit.prixFaconnage,
      marge: produit.marge,
      quantite: produit.quantite,
      description: produit.description || '',
      codebarres: produit.codeBarres || produit.reference,
      poids: produit.poids || 0,
      categorieid: produit.categorieId || '',
      depotid: produit.depotId || '',
      image: produit.image || ''
    };

    console.log("Tentative d'insertion avec tous les champs:", newProduct);

    // Insérer le produit dans la base de données
    const { data, error } = await supabase
      .from('produits')
      .insert([newProduct])
      .select()
      .single();

    if (error) {
      console.error("Erreur lors de l'insertion du produit:", error);
      return null;
    }
    
    console.log("Insertion réussie, données retournées:", data);
    return mapDatabaseToModel(data);
    
  } catch (error) {
    console.error('Erreur lors de la création du produit:', error);
    return null;
  }
};

/**
 * Fonction auxiliaire pour mettre à jour les champs d'un produit
 * en essayant différentes conventions de nommage
 */
async function updateProductFields(id: string, produit: Omit<Produit, 'id' | 'created_at' | 'updated_at'>): Promise<Produit | null> {
  // Liste des champs à mettre à jour avec leurs variantes de nommage
  const fieldMappings = [
    { camelCase: 'description', snakeCase: 'description' },
    { camelCase: 'codeBarres', snakeCase: 'codebarres' },
    { camelCase: 'categorieId', snakeCase: 'categorieid' },
    { camelCase: 'depotId', snakeCase: 'depotid' },
    { camelCase: 'compose', snakeCase: 'compose' },
    { camelCase: 'composants', snakeCase: 'composants' },
    { camelCase: 'image', snakeCase: 'image' },
    { camelCase: 'prixAchat', snakeCase: 'prixachat' },
    { camelCase: 'prixVente', snakeCase: 'prixvente' },
    { camelCase: 'quantite', snakeCase: 'quantite' }
  ];
  
  // Pour chaque champ, essayer d'abord camelCase puis snake_case
  for (const mapping of fieldMappings) {
    const fieldName = mapping.camelCase;
    const fieldValue = (produit as any)[fieldName];
    
    // Si le champ a une valeur dans le produit
    if (fieldValue !== undefined) {
      // Essayer d'abord avec camelCase
      try {
        const updateObj: Record<string, any> = {};
        updateObj[mapping.camelCase] = fieldValue;
        
        const { error } = await supabase
          .from('produits')
          .update(updateObj)
          .eq('id', id);
          
        if (!error) {
          console.log(`Mise à jour réussie avec ${mapping.camelCase}`);
          continue; // Passer au champ suivant
        }
      } catch (e) {
        console.log(`Erreur avec ${mapping.camelCase}:`, e);
      }
      
      // Si camelCase échoue, essayer snake_case
      try {
        const updateObj: Record<string, any> = {};
        updateObj[mapping.snakeCase] = fieldValue;
        
        const { error } = await supabase
          .from('produits')
          .update(updateObj)
          .eq('id', id);
          
        if (!error) {
          console.log(`Mise à jour réussie avec ${mapping.snakeCase}`);
        } else {
          console.log(`Échec de la mise à jour avec ${mapping.snakeCase}:`, error);
        }
      } catch (e) {
        console.log(`Erreur avec ${mapping.snakeCase}:`, e);
      }
    }
  }
  
  // Récupérer le produit mis à jour
  const { data: updatedProduct, error: fetchError } = await supabase
    .from('produits')
    .select('*')
    .eq('id', id)
    .single();
    
  if (fetchError) {
    console.error("Erreur lors de la récupération du produit mis à jour:", fetchError);
    // Créer un produit minimal à retourner
    return {
      id,
      nom: produit.nom,
      description: produit.description || '',
      reference: produit.reference,
      codeBarres: produit.codeBarres || produit.reference, // Utiliser la référence comme code-barres si nécessaire
      prixAchat: produit.prixAchat,
      prixVente: produit.prixVente,
      prixMatierePremiere: produit.prixMatierePremiere || produit.prixAchat,
      prixFaconnage: produit.prixFaconnage || 0,
      marge: produit.marge || 0,
      quantite: produit.quantite,
      poids: produit.poids || 0,
      categorieId: produit.categorieId,
      depotId: produit.depotId,
      image: produit.image || '',
      compose: produit.compose,
      composants: produit.composants
    };
  }
  
  // Transformer les données avant de les renvoyer
  return mapDatabaseToModel(updatedProduct);
}

/**
 * Met à jour un produit existant
 */
export const updateProduit = async (id: string, updates: Partial<Omit<Produit, 'id' | 'created_at' | 'updated_at'>>): Promise<Produit | null> => {
  try {
    // Convertir les noms de champs camelCase en snake_case
    const snakeCaseUpdates: Record<string, any> = {};
    
    // Mappage des champs camelCase vers snake_case
    const fieldMappings: Record<string, string> = {
      'prixAchat': 'prixachat',
      'prixVente': 'prixvente',
      'codeBarres': 'codebarres',
      'categorieId': 'categorieid',
      'depotId': 'depotid',
      'poids': 'poids'
    };
    
    // Convertir les noms de champs
    Object.entries(updates).forEach(([key, value]) => {
      const snakeKey = fieldMappings[key] || key.toLowerCase();
      snakeCaseUpdates[snakeKey] = value;
    });
    
    console.log("Mise à jour avec les champs convertis:", snakeCaseUpdates);
    
    // Essayer de mettre à jour le produit avec les noms de champs convertis
    const { data, error } = await supabase
      .from('produits')
      .update(snakeCaseUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Erreur lors de la mise à jour avec champs convertis:", error);
      throw error;
    }
    
    // Transformer les données avant de les renvoyer
    return data ? mapDatabaseToModel(data) : null;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du produit:', error);
    return null;
  }
};

/**
 * Supprime un produit
 */
export const deleteProduit = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('produits')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du produit:', error);
    return false;
  }
};

/**
 * Récupère toutes les promotions
 */
export const getPromotions = async (): Promise<Promotion[]> => {
  try {
    const { data, error } = await supabase
      .from('promotions')
      .select('*');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des promotions:', error);
    return [];
  }
};

/**
 * Crée une nouvelle promotion
 */
export const createPromotion = async (promotion: Omit<Promotion, 'id' | 'created_at' | 'updated_at'>): Promise<Promotion | null> => {
  try {
    const newPromotion = {
      id: uuidv4(),
      ...promotion
    };

    const { data, error } = await supabase
      .from('promotions')
      .insert([newPromotion])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de la création de la promotion:', error);
    return null;
  }
};

/**
 * Supprime une promotion
 */
export const deletePromotion = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de la promotion:', error);
    return false;
  }
};

/**
 * Récupère les produits avec leurs promotions actives
 */
export const getProduitsWithPromotions = async (): Promise<(Produit & { promotion?: Promotion })[]> => {
  try {
    // Récupérer tous les produits
    const produits = await getProduits();
    
    // Récupérer toutes les promotions
    const promotions = await getPromotions();
    
    // Associer les promotions aux produits
    const produitsWithPromotions = produits.map(produit => {
      const promotion = promotions.find(p => p.produitId === produit.id);
      return {
        ...produit,
        promotion
      };
    });
    
    return produitsWithPromotions;
  } catch (error) {
    console.error('Erreur lors de la récupération des produits avec promotions:', error);
    return [];
  }
};

/**
 * Vérifie si le bucket existe et le crée s'il n'existe pas
 */
export const ensureProductsBucketExists = async (): Promise<boolean> => {
  try {
    // Vérifier si le bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) throw listError;
    
    // Vérifier si le bucket 'produits' existe
    const bucketExists = buckets.some(bucket => bucket.name === 'produits');
    
    if (!bucketExists) {
      console.log("Le bucket 'produits' n'existe pas. Création en cours...");
      
      // Créer le bucket avec un accès public
      const { error: createError } = await supabase.storage.createBucket('produits', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
      });
      
      if (createError) {
        console.error("Erreur lors de la création du bucket 'produits':", createError);
        throw createError;
      }
      
      // Définir les règles de stockage pour rendre les fichiers publics
      const { error: policiesError } = await supabase.storage.from('produits').createSignedUrl('dummy.txt', 60, { transform: { width: 100, height: 100 } });
      
      if (policiesError && !policiesError.message.includes('The resource was not found')) {
        console.warn("Erreur lors de la configuration des règles (c'est normal si le fichier dummy n'existe pas):", policiesError);
      }
      
      console.log("Bucket 'produits' créé avec succès.");
      return true;
    }
    
    console.log("Le bucket 'produits' existe déjà.");
    return true;
  } catch (error) {
    console.error("Erreur lors de la vérification/création du bucket:", error);
    return false;
  }
};

/**
 * Télécharge une image de produit dans le stockage Supabase
 */
export const uploadProductImage = async (productId: string, file: File): Promise<string | null> => {
  try {
    // S'assurer que le bucket existe
    const bucketExists = await ensureProductsBucketExists();
    if (!bucketExists) {
      throw new Error("Impossible de créer ou d'accéder au bucket de stockage");
    }
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${productId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Télécharger le fichier dans le bucket "produits"
    const { error: uploadError } = await supabase.storage
      .from('produits')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Erreur lors du téléchargement de l\'image:', uploadError);
      throw uploadError;
    }

    // Obtenir l'URL publique de l'image
    const { data } = supabase.storage
      .from('produits')
      .getPublicUrl(filePath);

    const publicUrl = data.publicUrl;
    console.log("Image téléchargée avec succès, URL:", publicUrl);

    // Mettre à jour le produit avec l'URL de l'image
    await updateProduit(productId, { image: publicUrl });

    return publicUrl;
  } catch (error) {
    console.error('Erreur lors du téléchargement de l\'image du produit:', error);
    return null;
  }
};

/**
 * Capture une photo à partir de la caméra et la télécharge comme image du produit
 */
export const captureAndUploadProductImage = async (productId: string, imageBlob: Blob): Promise<string | null> => {
  try {
    // Convertir le Blob en File
    const file = new File([imageBlob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
    
    // Utiliser la même fonction uploadProductImage qui vérifie maintenant le bucket
    return await uploadProductImage(productId, file);
  } catch (error) {
    console.error('Erreur lors de la capture et du téléchargement de l\'image:', error);
    return null;
  }
}; 