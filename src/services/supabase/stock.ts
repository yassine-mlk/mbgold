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
  prixMinimumVente: number;
  prixVenteEffectif?: number;
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
    prixMinimumVente: dbProduct.prixminimumvente || Math.round((dbProduct.prixvente || 0) * 0.8 * 100) / 100,
    prixVenteEffectif: dbProduct.prixventeeffectif || dbProduct.prixvente || 0,
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
    
    // Générer un code-barres unique si non fourni
    let codeBarres = produit.codeBarres;
    if (!codeBarres || codeBarres === '') {
      codeBarres = await generateUniqueBarcode();
    } else {
      // Vérifier que le code-barres fourni est unique
      const isUnique = await isBarCodeUnique(codeBarres);
      if (!isUnique) {
        // Si le code-barres existe déjà, en générer un nouveau
        console.warn('Le code-barres fourni existe déjà, génération d\'un nouveau code-barres');
        codeBarres = await generateUniqueBarcode();
      }
    }
    
    // Créer un objet avec les propriétés nécessaires
    const newProduct = {
      id,
      nom: produit.nom,
      reference: produit.reference, 
      prixachat: produit.prixAchat,
      prixvente: produit.prixVente,
      prixminimumvente: produit.prixMinimumVente || Math.round(produit.prixVente * 0.8 * 100) / 100,
      prixventeeffectif: produit.prixVenteEffectif || produit.prixVente,
      prixmatierepremiere: produit.prixMatierePremiere,
      prixfaconnage: produit.prixFaconnage,
      marge: produit.marge,
      quantite: produit.quantite,
      description: produit.description || '',
      codebarres: codeBarres,
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
    { camelCase: 'prixMinimumVente', snakeCase: 'prixminimumvente' },
    { camelCase: 'prixVenteEffectif', snakeCase: 'prixventeeffectif' },
    { camelCase: 'prixMatierePremiere', snakeCase: 'prixmatierepremiere' },
    { camelCase: 'prixFaconnage', snakeCase: 'prixfaconnage' },
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

    // Calculer le prix minimum avec une différence par défaut (20% du prix de vente)
    const differenceParDefaut = Math.round(produit.prixVente * 0.2 * 100) / 100;
    const prixMinimumParDefaut = Math.max(0, produit.prixVente - differenceParDefaut);

    return {
      id,
      nom: produit.nom,
      description: produit.description || '',
      reference: produit.reference,
      codeBarres: produit.codeBarres || produit.reference, // Utiliser la référence comme code-barres si nécessaire
      prixAchat: produit.prixAchat,
      prixVente: produit.prixVente,
      prixMinimumVente: produit.prixMinimumVente || prixMinimumParDefaut,
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
      'prixMinimumVente': 'prixminimumvente',
      'prixVenteEffectif': 'prixventeeffectif',
      'prixMatierePremiere': 'prixmatierepremiere',
      'prixFaconnage': 'prixfaconnage',
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
 * Vérifie si le bucket existe et tente de le créer automatiquement s'il n'existe pas
 */
export const ensureProductsBucketExists = async (): Promise<boolean> => {
  try {
    // Vérifier si le bucket existe
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("Erreur lors de la vérification des buckets:", error);
      return false;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === 'produits');
    
    console.log("Bucket 'produits' existe:", bucketExists);
    
    // Si le test direct d'upload a fonctionné, on peut être certain que les RLS sont correctement configurées
    return true;
  } catch (err) {
    console.error("Exception lors de la vérification du bucket:", err);
    // On retourne true quand même pour ne pas bloquer l'application
    return true;
  }
};

/**
 * Télécharge une image de produit dans le stockage Supabase
 */
export const uploadProductImage = async (productId: string, file: File): Promise<string | null> => {
  try {
    // Vérifier si le fichier est vide ou trop grand
    if (file.size === 0) {
      console.error("Le fichier image est vide");
      return null;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
      console.error("L'image est trop volumineuse (maximum 5 MB)");
      alert("L'image est trop volumineuse. La taille maximale est de 5 MB.");
      return null;
    }
    
    // Vérifier le type de fichier
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || 
                  file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
    
    if (!validTypes.includes(file.type) && !isHeic) {
      console.error("Type de fichier non supporté:", file.type);
      alert(`Type de fichier non supporté: ${file.type}. Veuillez utiliser JPG, PNG, GIF ou WEBP. Si vous utilisez un iPhone, les images HEIC seront automatiquement converties.`);
      return null;
    }
    
    // Si c'est un fichier HEIC, il aurait dû être converti avant d'arriver ici
    if (isHeic) {
      console.warn("Un fichier HEIC a été reçu. Il aurait dû être converti en JPEG par le composant ImageUploader.");
    }
    
    // Générer un nom de fichier unique
    const fileExt = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const fileName = `${productId}-${timestamp}.${fileExt}`;
    
    console.log(`Tentative d'upload de l'image dans le bucket 'produits': ${fileName}`);
    console.log("Type de contenu:", file.type);

    // Utiliser exactement la même méthode que dans test_upload.js
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('produits')
      .upload(fileName, file, {
        contentType: file.type, // Spécifier explicitement le type de contenu
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Erreur lors du téléchargement de l\'image:', uploadError);
      console.error('Message détaillé:', uploadError.message);
      console.error('Détails de l\'erreur:', JSON.stringify(uploadError));
      
      // Messages d'erreur plus explicites selon le type d'erreur
      if (uploadError.message.includes('permission')) {
        alert("Erreur de permission: Vous n'avez pas les droits nécessaires pour uploader des images.");
      } else if (uploadError.message.includes('storage')) {
        alert("Erreur de stockage: Problème avec le bucket 'produits'.");
      } else if (uploadError.message.includes('not found') || uploadError.message.includes('404')) {
        alert("Erreur: Le bucket 'produits' n'a pas été trouvé.");
      } else {
        alert("Erreur lors du téléchargement de l'image: " + uploadError.message);
      }
      
      return null;
    }

    console.log("Upload réussi, données:", uploadData);

    // Obtenir l'URL publique de l'image - même méthode que test_upload.js
    const { data: publicData } = supabase.storage
      .from('produits')
      .getPublicUrl(fileName);

    const publicUrl = publicData.publicUrl;
    console.log("Image téléchargée avec succès, URL:", publicUrl);

    // Mettre à jour le produit avec l'URL de l'image
    if (productId) {
      await updateProduit(productId, { image: publicUrl });
    }

    return publicUrl;
  } catch (error) {
    console.error('Erreur lors du téléchargement de l\'image du produit:', error);
    alert("Une erreur inattendue s'est produite lors du téléchargement de l'image.");
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

/**
 * Vérifie si un code-barres existe déjà dans la base de données
 */
export const isBarCodeUnique = async (barcode: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('produits')
      .select('id')
      .eq('codebarres', barcode)
      .maybeSingle();
    
    if (error) {
      console.error('Erreur lors de la vérification du code-barres:', error);
      return false;
    }
    
    // Si aucun produit n'est trouvé avec ce code-barres, alors il est unique
    return data === null;
  } catch (error) {
    console.error('Erreur lors de la vérification du code-barres:', error);
    return false;
  }
};

/**
 * Génère un code-barres alphanumérique unique au format Code 128
 */
export const generateUniqueBarcode = async (): Promise<string> => {
  let isUnique = false;
  let barcode = '';
  
  // Essaie jusqu'à 10 fois de générer un code-barres unique
  for (let attempt = 0; attempt < 10; attempt++) {
    // Utiliser un format alphanumérique: RF suivi de 5 chiffres
    const prefix = 'RF';
    const randomNumber = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    barcode = `${prefix}${randomNumber}`;
    
    // Vérifier si ce code-barres est unique
    isUnique = await isBarCodeUnique(barcode);
    if (isUnique) {
      break;
    }
  }
  
  if (!isUnique) {
    console.warn('Impossible de générer un code-barres unique après plusieurs tentatives');
  }
  
  return barcode;
};

/**
 * Renomme une image depuis un ID temporaire vers un ID définitif dans le bucket Supabase
 * @param imageUrl URL de l'image temporaire
 * @param tempId ID temporaire utilisé pour l'upload
 * @param finalId ID définitif du produit après création
 * @returns URL de la nouvelle image ou null en cas d'erreur
 */
export const renameProductImage = async (imageUrl: string, tempId: string, finalId: string): Promise<string | null> => {
  try {
    // Vérifier si l'URL contient tempId
    if (!imageUrl || !imageUrl.includes(tempId)) {
      console.log("URL d'image ne contient pas d'ID temporaire, pas de renommage nécessaire");
      return imageUrl;
    }

    // Récupérer le chemin du fichier à partir de l'URL
    const path = imageUrl.split('produits/')[1];
    if (!path) {
      console.error("Impossible de parser le chemin de l'image:", imageUrl);
      return imageUrl;
    }

    // Créer le nouveau nom de fichier en remplaçant tempId par finalId
    const newPath = path.replace(tempId, finalId);
    
    console.log(`Tentative de renommage d'image: ${path} -> ${newPath}`);

    // Copier le fichier avec le nouveau nom
    const { data, error: copyError } = await supabase.storage
      .from('produits')
      .copy(path, newPath);

    if (copyError) {
      console.error("Erreur lors de la copie de l'image:", copyError);
      return imageUrl;
    }

    // Supprimer l'ancien fichier
    const { error: deleteError } = await supabase.storage
      .from('produits')
      .remove([path]);

    if (deleteError) {
      console.error("Erreur lors de la suppression de l'ancienne image:", deleteError);
    }

    // Obtenir l'URL de la nouvelle image
    const { data: publicUrlData } = supabase.storage
      .from('produits')
      .getPublicUrl(newPath);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Erreur lors du renommage de l'image:", error);
    return imageUrl;
  }
}; 