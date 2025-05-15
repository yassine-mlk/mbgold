import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Loader2, X, AlertTriangle } from 'lucide-react';
import { uploadProductImage, captureAndUploadProductImage, ensureProductsBucketExists } from '@/services/supabase/stock';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { isHeicFile } from '@/utils/heicConverter';

interface ImageUploaderProps {
  productId?: string;
  onImageUploaded: (imageUrl: string) => void;
  existingImageUrl?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  productId, 
  onImageUploaded, 
  existingImageUrl 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingImageUrl || null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Vérifier que le bucket existe lors du chargement du composant
  useEffect(() => {
    const checkBucket = async () => {
      await ensureProductsBucketExists();
    };
    
    checkBucket();
  }, []);

  // Vérifier l'image existante
  useEffect(() => {
    if (existingImageUrl) {
      // Vérifier si l'URL est valide
      const img = new Image();
      img.src = existingImageUrl;
      img.onload = () => {
        setPreviewUrl(existingImageUrl);
      };
      img.onerror = () => {
        console.warn("L'image existante n'est pas accessible:", existingImageUrl);
        setPreviewUrl(null);
      };
    }
  }, [existingImageUrl]);

  // Vérifier si une URL est de type blob
  const isBlobUrl = (url: string): boolean => {
    return url.startsWith('blob:');
  };

  // Fonction sécurisée pour revoke les blob URLs
  const safeRevokeObjectURL = (url: string | null) => {
    if (url && isBlobUrl(url)) {
      try {
        URL.revokeObjectURL(url);
        console.log("Blob URL révoquée avec succès:", url);
      } catch (error) {
        console.warn("Erreur lors de la révocation de l'URL blob:", error);
      }
    }
  };

  // Nettoyer les blobs à la destruction du composant
  useEffect(() => {
    return () => {
      // Si le previewUrl est un blob et qu'il n'a pas encore été téléchargé,
      // on le nettoie pour éviter les fuites de mémoire
      if (previewUrl && isBlobUrl(previewUrl)) {
        safeRevokeObjectURL(previewUrl);
      }
    };
  }, []);

  // Vérifier le format du fichier avant l'upload
  const validateFileFormat = (file: File): boolean => {
    // Vérifier si le fichier est au format HEIC ou HEIF
    if (isHeicFile(file)) {
      console.warn("Format HEIC/HEIF détecté mais non supporté");
      setUploadError("Le format HEIC/HEIF n'est pas pris en charge. Veuillez convertir votre image en JPEG ou PNG avant de l'envoyer.");
      return false;
    }
    
    // Vérifier si le format est supporté
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!supportedTypes.includes(file.type)) {
      console.warn(`Format non supporté: ${file.type}`);
      setUploadError(`Le format d'image "${file.type}" n'est pas pris en charge. Formats acceptés: JPEG, PNG, GIF, WEBP.`);
      return false;
    }
    
    return true;
  };

  // Fonction pour gérer l'upload d'un fichier
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    let localPreviewUrl: string | null = null;
    setIsUploading(true);
    setUploadError(null);

    try {
      console.log("Début de l'upload d'image:", file.name, "Taille:", file.size, "Type:", file.type);
      
      // Vérifier si le format du fichier est supporté
      if (!validateFileFormat(file)) {
        setIsUploading(false);
        return;
      }
      
      // Afficher un aperçu local de l'image avant l'upload
      localPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(localPreviewUrl);
      
      // Si productId est null, on garde juste l'aperçu local et on notifie le parent
      if (!productId) {
        console.log("Aucun productId fourni, utilisation de l'aperçu local uniquement");
        onImageUploaded(localPreviewUrl);
        setIsUploading(false);
        return;
      }
      
      console.log("Tentative d'upload avec productId:", productId);
      // Upload l'image vers Supabase
      const imageUrl = await uploadProductImage(productId, file);
      
      if (imageUrl) {
        console.log("Upload réussi, URL:", imageUrl);
        // Revoke l'URL d'aperçu local pour libérer la mémoire
        safeRevokeObjectURL(localPreviewUrl);
        localPreviewUrl = null; // Empêcher la révocation dans le finally
        
        setPreviewUrl(imageUrl);
        onImageUploaded(imageUrl);
      } else {
        console.error("L'upload a échoué, aucune URL retournée");
        // En cas d'erreur, on garde l'aperçu local
        setUploadError("L'image n'a pas pu être téléchargée sur le serveur, mais est disponible en prévisualisation.");
        onImageUploaded(localPreviewUrl);
      }
    } catch (error) {
      console.error('Erreur détaillée lors du téléchargement:', error);
      setUploadError("Erreur lors du téléchargement de l'image.");
      
      // Revoke le preview URL en cas d'erreur pour éviter les fuites de mémoire
      if (localPreviewUrl) {
        safeRevokeObjectURL(localPreviewUrl);
        setPreviewUrl(null);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Fonction pour démarrer la caméra
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Erreur lors de l\'accès à la caméra:', error);
      setIsCameraActive(false);
    }
  };

  // Fonction pour arrêter la caméra
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Fonction pour capturer une photo
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !productId) return;

    let localPreviewUrl: string | null = null;

    try {
      setIsUploading(true);
      setUploadError(null);
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Définir les dimensions du canvas pour correspondre à la vidéo
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Dessiner l'image de la vidéo sur le canvas
      const context = canvas.getContext('2d');
      if (!context) return;
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convertir l'image en blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error('Échec de la conversion de l\'image en blob'));
        }, 'image/jpeg', 0.8);
      });
      
      // Arrêter la caméra
      stopCamera();
      
      // Afficher un aperçu local
      localPreviewUrl = URL.createObjectURL(blob);
      setPreviewUrl(localPreviewUrl);
      
      // Upload l'image vers Supabase
      const imageUrl = await captureAndUploadProductImage(productId, blob);
      
      if (imageUrl) {
        // Revoke l'URL d'aperçu local pour libérer la mémoire
        safeRevokeObjectURL(localPreviewUrl);
        localPreviewUrl = null; // Empêcher la révocation dans le finally
        
        setPreviewUrl(imageUrl);
        onImageUploaded(imageUrl);
      } else {
        // En cas d'erreur, on revient à l'image existante ou on affiche un message d'erreur
        if (existingImageUrl) {
          setPreviewUrl(existingImageUrl);
        } else {
          safeRevokeObjectURL(localPreviewUrl);
          localPreviewUrl = null;
          setPreviewUrl(null);
        }
        setUploadError("L'image n'a pas pu être téléchargée sur le serveur.");
      }
    } catch (error) {
      console.error('Erreur lors de la capture de la photo:', error);
      setUploadError("Erreur lors de la capture de la photo.");
      
      // En cas d'erreur, revenir à l'image existante et nettoyer le blob URL
      if (localPreviewUrl) {
        safeRevokeObjectURL(localPreviewUrl);
      }
      setPreviewUrl(existingImageUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  // Fonction pour réinitialiser l'image
  const resetImage = () => {
    // Nettoyer l'URL blob si nécessaire
    if (previewUrl && isBlobUrl(previewUrl)) {
      safeRevokeObjectURL(previewUrl);
    }
    
    setPreviewUrl(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageUploaded('');
  };

  return (
    <div className="space-y-4">
      {/* Message d'erreur */}
      {uploadError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Avertissement</AlertTitle>
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}
      
      {/* Aperçu de l'image */}
      {previewUrl && (
        <div className="relative">
          <img 
            src={previewUrl} 
            alt="Aperçu du produit" 
            className="h-48 w-full object-cover rounded-md"
            onError={(e) => {
              console.error("Erreur de chargement de l'image:", previewUrl);
              // Si l'image est un blob URL qui a échoué, on la révoque
              if (isBlobUrl(previewUrl)) {
                safeRevokeObjectURL(previewUrl);
              }
              setPreviewUrl(null);
              setUploadError("Impossible de charger l'image. Elle est peut-être corrompue ou inaccessible.");
            }}
          />
          <button 
            type="button"
            onClick={() => {
              // Nettoyer l'URL blob si nécessaire avant de réinitialiser
              if (previewUrl && isBlobUrl(previewUrl)) {
                safeRevokeObjectURL(previewUrl);
              }
              resetImage();
            }}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      {/* Interface de la caméra */}
      {isCameraActive && (
        <div className="relative">
          <video 
            ref={videoRef} 
            className="h-48 w-full object-cover rounded-md"
            autoPlay 
            playsInline
          />
          <div className="mt-2 flex justify-center space-x-2">
            <Button 
              type="button" 
              onClick={capturePhoto}
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Capturer
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={stopCamera}
            >
              Annuler
            </Button>
          </div>
          {/* Canvas caché pour capturer l'image */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
      
      {/* Boutons d'action */}
      {!isCameraActive && (
        <div className="flex space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            Choisir une image
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={startCamera}
            disabled={isUploading}
          >
            <Camera className="mr-2 h-4 w-4" />
            Prendre une photo
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
};

export default ImageUploader; 