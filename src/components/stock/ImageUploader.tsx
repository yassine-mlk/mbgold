import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Loader2, X, AlertTriangle } from 'lucide-react';
import { uploadProductImage, captureAndUploadProductImage, ensureProductsBucketExists } from '@/services/supabase/stock';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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

  // Fonction pour gérer l'upload d'un fichier
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadError(null);
      
      // Afficher un aperçu local de l'image avant l'upload
      const localPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(localPreviewUrl);
      
      // Si productId est null, on garde juste l'aperçu local et on notifie le parent
      if (!productId) {
        onImageUploaded(localPreviewUrl);
        return;
      }
      
      // Upload l'image vers Supabase
      const imageUrl = await uploadProductImage(productId, file);
      
      if (imageUrl) {
        // Revoke l'URL d'aperçu local pour libérer la mémoire
        URL.revokeObjectURL(localPreviewUrl);
        setPreviewUrl(imageUrl);
        onImageUploaded(imageUrl);
      } else {
        // En cas d'erreur, on garde l'aperçu local
        setUploadError("L'image n'a pas pu être téléchargée sur le serveur, mais est disponible en prévisualisation.");
        onImageUploaded(localPreviewUrl);
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement de l\'image:', error);
      setUploadError("Erreur lors du téléchargement de l'image.");
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

    try {
      setIsUploading(true);
      
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
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else throw new Error('Échec de la conversion de l\'image en blob');
        }, 'image/jpeg', 0.8);
      });
      
      // Arrêter la caméra
      stopCamera();
      
      // Afficher un aperçu local
      const localPreviewUrl = URL.createObjectURL(blob);
      setPreviewUrl(localPreviewUrl);
      
      // Upload l'image vers Supabase
      const imageUrl = await captureAndUploadProductImage(productId, blob);
      
      if (imageUrl) {
        // Revoke l'URL d'aperçu local pour libérer la mémoire
        URL.revokeObjectURL(localPreviewUrl);
        setPreviewUrl(imageUrl);
        onImageUploaded(imageUrl);
      } else {
        // En cas d'erreur, on revient à l'image existante
        setPreviewUrl(existingImageUrl || null);
      }
    } catch (error) {
      console.error('Erreur lors de la capture de la photo:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Fonction pour réinitialiser l'image
  const resetImage = () => {
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
              setPreviewUrl(null);
            }}
          />
          <button 
            type="button"
            onClick={resetImage}
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