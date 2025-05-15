/**
 * Utilitaire pour convertir les images HEIC/HEIF en JPEG
 * Utilise l'import dynamique pour éviter les problèmes de build
 */

interface HeicConversionOptions {
  blob: Blob;
  toType?: string;
  quality?: number;
}

/**
 * Convertit une image HEIC/HEIF en un autre format (par défaut JPEG)
 * @param options Options de conversion (blob source, format cible, qualité)
 * @returns Promise avec le Blob converti
 */
export async function convertHeicToAnotherFormat(options: HeicConversionOptions): Promise<Blob> {
  try {
    // Import dynamique de heic2any
    const heic2any = (await import('heic2any')).default;
    
    // Options par défaut
    const conversionOptions = {
      toType: options.toType || 'image/jpeg',
      quality: options.quality ?? 0.8
    };
    
    // Convertir l'image
    const result = await heic2any({
      blob: options.blob,
      ...conversionOptions
    });
    
    // heic2any peut retourner un tableau de blobs ou un seul blob
    return Array.isArray(result) ? result[0] : result;
  } catch (error) {
    console.error("Erreur lors de la conversion HEIC:", error);
    throw new Error("Impossible de convertir l'image HEIC. Veuillez utiliser une image JPEG ou PNG.");
  }
}

/**
 * Vérifie si un fichier est au format HEIC/HEIF
 * @param file Le fichier à vérifier
 * @returns boolean
 */
export function isHeicFile(file: File): boolean {
  return (
    file.type === 'image/heic' || 
    file.type === 'image/heif' || 
    file.name.toLowerCase().endsWith('.heic') || 
    file.name.toLowerCase().endsWith('.heif')
  );
}

/**
 * Convertit un fichier HEIC/HEIF en JPEG
 * @param file Fichier HEIC/HEIF à convertir
 * @returns Promise avec un objet File au format JPEG
 */
export async function convertHeicFileToJpeg(file: File): Promise<File> {
  if (!isHeicFile(file)) {
    return file; // Retourner le fichier original s'il n'est pas au format HEIC/HEIF
  }
  
  try {
    const jpegBlob = await convertHeicToAnotherFormat({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.8
    });
    
    // Créer un nouveau fichier avec l'extension .jpg
    const fileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
    return new File([jpegBlob], fileName, { type: 'image/jpeg' });
  } catch (error) {
    console.error("Erreur lors de la conversion HEIC → JPEG:", error);
    throw error;
  }
} 