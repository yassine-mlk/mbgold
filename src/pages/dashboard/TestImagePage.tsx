import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ensureProductsBucketExists } from '@/services/supabase/stock';
import ImageUploader from '@/components/stock/ImageUploader';
import { toast } from '@/components/ui/sonner';

const TestImagePage = () => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [bucketReady, setBucketReady] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const checkBucket = async () => {
      try {
        setIsLoading(true);
        const exists = await ensureProductsBucketExists();
        setBucketReady(exists);
        
        if (exists) {
          toast.success("Le bucket de stockage est prêt à être utilisé.");
        } else {
          toast.error("Impossible de créer le bucket de stockage.");
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du bucket:", error);
        toast.error("Erreur lors de la vérification du bucket.");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkBucket();
  }, []);
  
  const handleImageUploaded = (url: string) => {
    setImageUrl(url);
    if (url) {
      toast.success("Image prévisualisée avec succès.");
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Test de téléchargement d'images</h1>
        <p className="text-muted-foreground">Vérifiez que le téléchargement et la prévisualisation des images fonctionnent correctement.</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>État du bucket de stockage</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Vérification du bucket en cours...</p>
          ) : bucketReady ? (
            <p className="text-green-600">Le bucket "produits" est prêt à être utilisé.</p>
          ) : (
            <p className="text-red-600">Impossible de créer ou d'accéder au bucket "produits".</p>
          )}
          
          <Button
            className="mt-4"
            onClick={async () => {
              try {
                setIsLoading(true);
                const exists = await ensureProductsBucketExists();
                setBucketReady(exists);
                
                if (exists) {
                  toast.success("Le bucket a été vérifié et est prêt.");
                } else {
                  toast.error("Impossible de créer le bucket.");
                }
              } catch (error) {
                toast.error("Erreur lors de la vérification du bucket.");
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
          >
            Vérifier à nouveau le bucket
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Test d'upload d'image</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>Cette prévisualisation d'image devrait fonctionner même sans ID de produit.</p>
            
            <ImageUploader
              onImageUploaded={handleImageUploaded}
            />
            
            <div className="mt-4">
              <h3 className="text-lg font-medium">URL de l'image prévisualisée:</h3>
              <p className="break-all font-mono text-xs mt-2 p-2 bg-muted rounded-md">
                {imageUrl || "Aucune image sélectionnée"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestImagePage; 