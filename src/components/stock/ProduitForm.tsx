import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Categorie, Depot } from '@/pages/dashboard/StockPage';
import ImageUploader from './ImageUploader';

type ProduitFormProps = {
  onSubmit: (data: ProduitFormValues) => void;
  initialValues?: ProduitFormValues;
  categories: Categorie[];
  depots: Depot[];
  productId?: string;
};

export type ProduitFormValues = {
  nom: string;
  reference: string;
  codeBarres?: string;
  categorieId: string;
  depotId: string;
  quantite: number;
  prixAchat: number;
  prixVente: number;
  poids: number;
  description: string;
  image: string;
};

const ProduitForm = ({ onSubmit, initialValues, categories, depots, productId }: ProduitFormProps) => {
  const [imageUrl, setImageUrl] = useState<string>(initialValues?.image || '');
  
  const form = useForm<ProduitFormValues>({
    defaultValues: initialValues || {
      nom: '',
      reference: '',
      codeBarres: '',
      categorieId: '',
      depotId: '',
      quantite: 0,
      prixAchat: 0,
      prixVente: 0,
      poids: 0,
      description: '',
      image: ''
    }
  });

  const handleSubmit = (data: ProduitFormValues) => {
    // Inclure l'URL de l'image dans les données soumises
    onSubmit({
      ...data,
      image: imageUrl
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Section pour l'image du produit */}
        <FormItem>
          <FormLabel>Image du produit</FormLabel>
          <FormControl>
            <ImageUploader 
              productId={productId}
              onImageUploaded={setImageUrl}
              existingImageUrl={initialValues?.image}
            />
          </FormControl>
          <FormDescription>
            Prenez une photo ou téléchargez une image pour le produit.
          </FormDescription>
        </FormItem>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du produit</FormLabel>
                <FormControl>
                  <Input placeholder="Nom du produit" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="reference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Référence</FormLabel>
                <FormControl>
                  <Input placeholder="Référence du produit" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="codeBarres"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code-barres</FormLabel>
                <FormControl>
                  <Input placeholder="Code-barres du produit" {...field} value={field.value || ''} />
                </FormControl>
                <FormDescription>
                  Si vide, la référence sera utilisée comme code-barres
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="poids"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Poids (grammes)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.001"
                    min="0"
                    placeholder="Poids en grammes"
                    {...field} 
                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="categorieId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Catégorie</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une catégorie" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((categorie) => (
                      <SelectItem key={categorie.id} value={categorie.id}>
                        {categorie.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="depotId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dépôt</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un dépôt" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {depots.map((depot) => (
                      <SelectItem key={depot.id} value={depot.id}>
                        {depot.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="quantite"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantité</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0"
                    {...field} 
                    onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="prixAchat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prix d'achat (DH)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01"
                    min="0"
                    {...field} 
                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="prixVente"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prix de vente (DH)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01"
                    min="0"
                    {...field} 
                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Description du produit" {...field} />
              </FormControl>
              <FormDescription>
                Ajoutez des détails sur le produit comme la taille, la couleur, les matériaux, etc.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end">
          <Button type="submit">Enregistrer</Button>
        </div>
      </form>
    </Form>
  );
};

export default ProduitForm;
