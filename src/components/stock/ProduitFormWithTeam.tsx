import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Produit } from '@/services/supabase/stock';
import { Category, Depot, getSettings } from '@/services/supabase/parametres';
import { Loader2, Calculator } from 'lucide-react';
import ImageUploader from './ImageUploader';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// Extension du type Produit pour le formulaire
type ProduitForm = Omit<Produit, 'id' | 'reference' | 'created_at' | 'updated_at'>;

type ProduitFormWithTeamProps = {
  onSubmit: (data: Omit<Produit, 'id' | 'reference' | 'created_at' | 'updated_at'>) => void;
  initialValues?: Produit;
  categories: Category[];
  depots: Depot[];
};

const ProduitFormWithTeam = ({ onSubmit, initialValues, categories, depots }: ProduitFormWithTeamProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>(initialValues?.image || '');
  const [prixMatierePremiere, setPrixMatierePremiere] = useState<number>(0);
  const [prixCalcule, setPrixCalcule] = useState<number>(0);
  const [faconnage, setFaconnage] = useState<number>(0);
  const [marge, setMarge] = useState<number>(0);
  const [prixDeRevient, setPrixDeRevient] = useState<number>(0);
  const [prixVenteFinal, setPrixVenteFinal] = useState<number>(initialValues?.prixVente || 0);
  const { user } = useAuth();
  
  // Initialiser les valeurs à partir de initialValues si disponible
  useEffect(() => {
    if (initialValues) {
      // Prix de matière première (s'il existe, sinon utiliser prixAchat)
      const prixMatiere = initialValues.prixMatierePremiere || initialValues.prixAchat || 0;
      setPrixCalcule(prixMatiere);
      
      // Façonnage (s'il existe, sinon utiliser valeur par défaut)
      const faconnageValue = initialValues.prixFaconnage || 0;
      setFaconnage(faconnageValue);
      
      // Marge (s'il existe, sinon calculer)
      const margeValue = initialValues.marge || (initialValues.prixVente - (prixMatiere + faconnageValue));
      setMarge(margeValue > 0 ? margeValue : 0);
      
      // Prix de revient = matière + façonnage
      const prixRevient = prixMatiere + faconnageValue;
      setPrixDeRevient(prixRevient);
    }
  }, [initialValues]);
  
  // Générer un code-barres unique
  const generateUniqueBarcode = () => {
    // Préfixe pour le Maroc (611) + 9 chiffres aléatoires
    const prefix = '611';
    const randomDigits = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    const barcode = prefix + randomDigits;
    
    // Calcul de la clé de contrôle (algorithme EAN-13)
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(barcode[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    
    return barcode + checkDigit;
  };

  const form = useForm<ProduitForm>({
    defaultValues: initialValues 
      ? { 
          ...initialValues,
          codeBarres: initialValues.codeBarres || '',
          poids: initialValues.poids || 0,
          prixMatierePremiere: initialValues.prixMatierePremiere || initialValues.prixAchat || 0,
          prixFaconnage: initialValues.prixFaconnage || 0,
          marge: initialValues.marge || 0
        } 
      : {
          nom: '',
          description: '',
          categorieId: '',
          depotId: '',
          quantite: 0,
          prixAchat: 0,
          prixVente: 0,
          prixMatierePremiere: 0,
          prixFaconnage: 0,
          marge: 0,
          codeBarres: generateUniqueBarcode(),
          poids: 0,
          image: ''
        }
  });

  // Mise à jour du prix calculé basé sur le poids
  useEffect(() => {
    const poids = form.watch('poids');
    if (poids && prixMatierePremiere) {
      const nouveauPrixMatiere = poids * prixMatierePremiere;
      setPrixCalcule(nouveauPrixMatiere);
      
      // Met à jour le prix d'achat avec le prix de la matière première calculé
      form.setValue('prixAchat', nouveauPrixMatiere);
      form.setValue('prixMatierePremiere', nouveauPrixMatiere);
      
      // Mise à jour du prix de revient = matière + façonnage
      const nouveauPrixRevient = nouveauPrixMatiere + faconnage;
      setPrixDeRevient(nouveauPrixRevient);
      
      // Mise à jour du prix de vente final = prix de revient + marge
      const nouveauPrixVente = nouveauPrixMatiere + faconnage + marge;
      setPrixVenteFinal(nouveauPrixVente);
      form.setValue('prixVente', nouveauPrixVente);
    }
  }, [form.watch('poids'), prixMatierePremiere, faconnage, marge, form]);

  useEffect(() => {
    const loadSettings = async () => {
      if (user?.id) {
        try {
          const settings = await getSettings(user.id);
          if (settings && settings.prix_matiere_premiere) {
            // Si le prix matière a changé, mettre à jour le state
            if (prixMatierePremiere !== settings.prix_matiere_premiere) {
              setPrixMatierePremiere(settings.prix_matiere_premiere);
              
              // Si le formulaire a déjà un poids, recalculer le prix automatiquement
              const poids = form.watch('poids');
              if (poids) {
                const nouveauPrixMatiere = poids * settings.prix_matiere_premiere;
                setPrixCalcule(nouveauPrixMatiere);
                
                // Met à jour le prix d'achat avec le prix de la matière première calculé
                form.setValue('prixAchat', nouveauPrixMatiere);
                form.setValue('prixMatierePremiere', nouveauPrixMatiere);
                
                // Mise à jour du prix de revient = matière + façonnage
                const nouveauPrixRevient = nouveauPrixMatiere + faconnage;
                setPrixDeRevient(nouveauPrixRevient);
                
                // Mise à jour du prix de vente final = matière + façonnage + marge
                const nouveauPrixVente = nouveauPrixMatiere + faconnage + marge;
                setPrixVenteFinal(nouveauPrixVente);
                form.setValue('prixVente', nouveauPrixVente);
              }
            }
          }
        } catch (error) {
          console.error('Erreur lors du chargement des paramètres:', error);
        }
      }
    };
    
    // Charger les paramètres au montage du composant
    loadSettings();
    
    // Configurer une vérification périodique des paramètres
    const interval = setInterval(loadSettings, 30000); // Vérifier toutes les 30 secondes
    
    // Nettoyer l'intervalle lors du démontage du composant
    return () => clearInterval(interval);
  }, [user, form, prixMatierePremiere, faconnage, marge]);

  const handleFormSubmit = (values: ProduitForm) => {
    // Ajouter l'URL de l'image et les composantes de prix aux valeurs
    const processedValues = {
      ...values,
      image: imageUrl,
      prixMatierePremiere: prixCalcule,
      prixFaconnage: faconnage,
      marge: marge
    };
    onSubmit(processedValues);
  };

  const handleImageUploaded = (url: string) => {
    setImageUrl(url);
    form.setValue('image', url);
  };

  const calculatePrixMatiere = () => {
    const poids = form.getValues('poids');
    if (poids && prixMatierePremiere) {
      const nouveauPrixMatiere = poids * prixMatierePremiere;
      setPrixCalcule(nouveauPrixMatiere);
      
      // Met à jour le prix d'achat avec le prix calculé
      form.setValue('prixAchat', nouveauPrixMatiere);
      form.setValue('prixMatierePremiere', nouveauPrixMatiere);
      
      // Mise à jour du prix de revient = matière + façonnage
      const nouveauPrixRevient = nouveauPrixMatiere + faconnage;
      setPrixDeRevient(nouveauPrixRevient);
      
      // Mise à jour du prix de vente final = matière + façonnage + marge
      const nouveauPrixVente = nouveauPrixMatiere + faconnage + marge;
      setPrixVenteFinal(nouveauPrixVente);
      form.setValue('prixVente', nouveauPrixVente);
      
      return nouveauPrixMatiere;
    }
    return 0;
  };
  
  // Calcul des prix lorsque le façonnage change
  const handleFaconnageChange = (nouvelleFaconnage: number) => {
    setFaconnage(nouvelleFaconnage);
    
    // Mise à jour du prix de revient
    const nouveauPrixRevient = prixCalcule + nouvelleFaconnage;
    setPrixDeRevient(nouveauPrixRevient);
    
    // Mise à jour du prix de vente = matière + façonnage + marge
    const nouveauPrixVente = prixCalcule + nouvelleFaconnage + marge;
    setPrixVenteFinal(nouveauPrixVente);
    form.setValue('prixVente', nouveauPrixVente);
    form.setValue('prixFaconnage', nouvelleFaconnage);
  };
  
  // Calcul des prix lorsque la marge change
  const handleMargeChange = (nouvelleMarge: number) => {
    setMarge(nouvelleMarge);
    
    // Mise à jour du prix de vente = matière + façonnage + marge
    const nouveauPrixVente = prixCalcule + faconnage + nouvelleMarge;
    setPrixVenteFinal(nouveauPrixVente);
    form.setValue('prixVente', nouveauPrixVente);
    form.setValue('marge', nouvelleMarge);
  };

  // Montrer un indicateur de chargement si nécessaire
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Upload d'image */}
        <div className="mb-6">
          <Label>Image du produit</Label>
          <ImageUploader 
            productId={initialValues?.id} 
            onImageUploaded={handleImageUploaded}
            existingImageUrl={initialValues?.image}
          />
          {imageUrl && (
            <div className="mt-2 border rounded-md p-2 w-32 h-32 flex items-center justify-center">
              <img 
                src={imageUrl} 
                alt="Image du produit" 
                className="max-h-full max-w-full object-contain" 
              />
            </div>
          )}
        </div>

        {/* Code-barres généré automatiquement */}
        <FormField
          control={form.control}
          name="codeBarres"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code-barres (généré automatiquement)</FormLabel>
              <FormControl>
                <Input {...field} readOnly placeholder="Code-barres généré automatiquement" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du produit</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Nom du produit" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Poids du produit */}
        <FormField
          control={form.control}
          name="poids"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Poids (grammes)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  value={field.value}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    field.onChange(value);
                  }} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Prix calculé de la matière première */}
        <div className="flex items-center space-x-2">
          <div className="flex-1 p-3 bg-muted rounded-md">
            <Label>Prix de la matière première</Label>
            <div className="text-lg font-semibold">{prixCalcule.toFixed(2)} DH</div>
            <div className="text-xs text-muted-foreground">
              Calculé sur base de {prixMatierePremiere} DH/g
            </div>
          </div>
          <Button 
            type="button" 
            variant="outline" 
            onClick={calculatePrixMatiere}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Calculer
          </Button>
        </div>
        
        {/* Section Prix de Revient */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Prix de Revient</h3>
          
          {/* Façonnage */}
          <div className="space-y-2 mb-4">
            <Label htmlFor="faconnage">Façonnage (DH)</Label>
            <Input 
              id="faconnage"
              type="number" 
              min="0" 
              step="0.01"
              value={faconnage}
              onChange={(e) => {
                const nouvelleFaconnage = parseFloat(e.target.value) || 0;
                handleFaconnageChange(nouvelleFaconnage);
              }}
              placeholder="Coût de façonnage"
            />
            <div className="text-xs text-muted-foreground">
              Coût de travail supplémentaire pour la fabrication du produit
            </div>
          </div>
          
          {/* Prix de revient total */}
          <div className="p-3 bg-muted rounded-md mb-4">
            <Label>Prix de revient total</Label>
            <div className="text-lg font-semibold">{prixDeRevient.toFixed(2)} DH</div>
            <div className="text-xs text-muted-foreground">
              Matière première ({prixCalcule.toFixed(2)} DH) + Façonnage ({faconnage.toFixed(2)} DH)
            </div>
          </div>
        </Card>
        
        {/* Section Prix de Vente */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Prix de Vente</h3>
          
          {/* Marge */}
          <div className="space-y-2 mb-4">
            <Label htmlFor="marge">Marge bénéficiaire (DH)</Label>
            <Input 
              id="marge"
              type="number" 
              min="0" 
              step="0.01"
              value={marge}
              onChange={(e) => {
                const nouvelleMarge = parseFloat(e.target.value) || 0;
                handleMargeChange(nouvelleMarge);
              }}
              placeholder="Marge bénéficiaire"
            />
            <div className="text-xs text-muted-foreground">
              Bénéfice additionnel sur le prix de revient
            </div>
          </div>
          
          {/* Prix de vente final */}
          <div className="p-3 bg-primary/10 rounded-md mb-4 border-2 border-primary">
            <Label>Prix de vente final</Label>
            <div className="text-xl font-bold">{prixVenteFinal.toFixed(2)} DH</div>
            <div className="text-xs text-muted-foreground">
              Prix de revient ({prixDeRevient.toFixed(2)} DH) + Marge ({marge.toFixed(2)} DH)
            </div>
          </div>
        </Card>

        {/* Champs cachés pour les prix */}
        <input 
          type="hidden" 
          {...form.register('prixAchat')} 
        />
        <input 
          type="hidden" 
          {...form.register('prixVente')} 
        />
        <input 
          type="hidden" 
          {...form.register('prixMatierePremiere')}
          value={prixCalcule} 
        />
        <input 
          type="hidden" 
          {...form.register('prixFaconnage')}
          value={faconnage} 
        />
        <input 
          type="hidden" 
          {...form.register('marge')}
          value={marge} 
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Description du produit" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="categorieId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Catégorie</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.nom}
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
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un dépôt" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {depots.map(depot => (
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

        <FormField
          control={form.control}
          name="quantite"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantité en stock</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="0" 
                  step="1"
                  value={field.value}
                  onChange={e => field.onChange(parseInt(e.target.value))} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit">
            {initialValues ? 'Mettre à jour' : 'Ajouter'} le produit
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProduitFormWithTeam;
