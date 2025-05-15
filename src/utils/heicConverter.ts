/**
 * Utilitaire simplifié pour la gestion des images
 * Ne contient pas de fonctionnalité de conversion HEIC, mais vérifie le format
 */

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
 * Version simplifiée qui ne convertit pas les fichiers HEIC/HEIF
 * mais retourne simplement le fichier original avec un avertissement
 * @param file Fichier à vérifier
 * @returns Le fichier original
 */
export async function convertHeicFileToJpeg(file: File): Promise<File> {
  if (isHeicFile(file)) {
    console.warn("Format HEIC/HEIF détecté. Cette application ne prend pas en charge la conversion automatique de ce format. Veuillez utiliser une image JPEG ou PNG.");
    throw new Error("Le format HEIC/HEIF n'est pas pris en charge. Veuillez convertir votre image en JPEG ou PNG avant de l'envoyer.");
  }
  
  // Retourner le fichier original s'il n'est pas au format HEIC/HEIF
  return file;
} 