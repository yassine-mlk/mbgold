import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DirectImageUploader from '@/components/stock/DirectImageUploader';
import { toast } from '@/components/ui/sonner';

const TestDirectImagePage = () => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [productId, setProductId] = useState<string>(`test-${Date.now()}`);
  
  const handleImageUploaded = (url: string) => {
    setImageUrl(url);
    if (url) {
      toast.success("Image téléchargée avec succès");
    } else {
      toast.error("L'URL de l'image est vide");
    }
  };
  
  const generateNewTestId = () => {
    const newId = `test-${Date.now()}`;
    setProductId(newId);
    toast.info(`Nouvel ID de test généré: ${newId}`);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Test d'upload direct d'images</h1>
        <p className="text-muted-foreground">
          Cette page utilise le composant DirectImageUploader qui implémente un upload direct vers Supabase Storage
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Test d'upload direct</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <p className="font-medium">ID de produit de test:</p>
              <code className="bg-muted p-1 rounded">{productId}</code>
              <Button variant="outline" onClick={generateNewTestId}>
                Générer un nouvel ID
              </Button>
            </div>
            
            <DirectImageUploader
              productId={productId}
              onImageUploaded={handleImageUploaded}
            />
            
            <div className="mt-4">
              <h3 className="text-lg font-medium">URL de l'image téléchargée:</h3>
              <p className="break-all font-mono text-xs mt-2 p-2 bg-muted rounded-md">
                {imageUrl || "Aucune image téléchargée"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Aide au débogage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Que faire si ça ne fonctionne pas ?</h3>
            <p>
              1. Vérifiez que le bucket "produits" existe dans votre projet Supabase
            </p>
            <p>
              2. Assurez-vous que les règles RLS (Row Level Security) autorisent les uploads pour les utilisateurs authentifiés 
            </p>
            <p>
              3. Ouvrez la console du navigateur pour voir les messages d'erreur détaillés
            </p>
            <p>
              4. Essayez de vous déconnecter et reconnecter si vous avez des erreurs de permission
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestDirectImagePage; 