import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  Tag, 
  Building, 
  User, 
  Percent, 
  ShoppingCart, 
  Edit, 
  Trash2, 
  Printer, 
  Loader2,
  Weight,
  BarChart4,
  Calculator,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import BarcodeDisplay from '@/components/stock/BarcodeDisplay';
import ProduitFormWithTeam from '@/components/stock/ProduitFormWithTeam';
import { getProduitById, updateProduit, deleteProduit, Produit } from '@/services/supabase/stock';
import { getDepots, getCategories, Category, Depot, getSettings, updateSettings } from '@/services/supabase/parametres';
import { getTeamMembers, TeamMember } from '@/services/supabase/team';
import { useAuth } from '@/contexts/AuthContext';

// Import both ImageUploaders
import ImageUploader from '@/components/stock/ImageUploader';
import DirectImageUploader from '@/components/stock/DirectImageUploader';

// Interface étendue pour les données additionnelles spécifiques à la page de détails
interface ProduitWithExtras extends Produit {
  teamMemberId?: string;
  promotion?: {
    id: string;
    type: 'pourcentage' | 'montant' | 'bundle';
    valeur: number;
    dateDebut: string;
    dateFin: string;
    description?: string;
  };
}

// Feature flag for using direct image uploader
const USE_DIRECT_UPLOADER = true; // Set to true to use DirectImageUploader

const ProduitDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [produit, setProduit] = useState<ProduitWithExtras | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [prixMatierePremiere, setPrixMatierePremiere] = useState<number>(0);
  const [prixFaconnageParGramme, setPrixFaconnageParGramme] = useState<number>(0);
  const [isUpdatingPrix, setIsUpdatingPrix] = useState(false);
  const [prixMisAJour, setPrixMisAJour] = useState(false);
  const [isLoading, setIsLoading] = useState({
    produit: true,
    categories: true,
    depots: true,
    teamMembers: true,
    edit: false,
    delete: false
  });
  
  // États pour les modals
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBarcodeDialogOpen, setIsBarcodeDialogOpen] = useState(false);
  
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        // Charger les données du produit
        const produitData = await getProduitById(id);
        
        // S'assurer que tous les champs obligatoires sont présents
        if (produitData) {
          // Valeurs par défaut pour les nouveaux champs s'ils n'existent pas
          const produitWithDefaults: ProduitWithExtras = {
            ...produitData,
            prixMatierePremiere: produitData.prixMatierePremiere || produitData.prixAchat || 0,
            prixFaconnage: produitData.prixFaconnage || 0,
            marge: produitData.marge || 0
          };
          
          setProduit(produitWithDefaults);
        }
        
        // Charger le prix actuel de la matière première
        if (user?.id) {
          const settings = await getSettings(user.id);
          if (settings) {
            setPrixMatierePremiere(settings.prix_matiere_premiere || 0);
            setPrixFaconnageParGramme(settings.prix_faconnage_par_gramme || 0);
          }
        }
        
        // Charger tous les produits pour les compositions
        if (produitData?.compose && produitData.composants && produitData.composants.length > 0) {
          const produitsIds = produitData.composants.map(comp => comp.produitId);
          // À cet endroit, vous devriez idéalement charger uniquement les produits nécessaires
          // Mais pour simplifier, nous supposons qu'une fonction getAllProduits existe
          const allProduits = await getAllProduits(); 
          setProduits(allProduits);
        }
        
        // Charger les catégories, dépôts et membres d'équipe
        const [categoriesData, depotsData, teamMembersData] = await Promise.all([
          getCategories(),
          getDepots(),
          getTeamMembers()
        ]);
        
        setCategories(categoriesData);
        setDepots(depotsData);
        setTeamMembers(teamMembersData);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setIsLoading({
          produit: false,
          categories: false,
          depots: false,
          teamMembers: false,
          edit: false,
          delete: false
        });
      }
    };
    
    loadData();
  }, [id, user?.id]);
  
  // Recalculer le prix automatiquement
  const recalculerPrixAutomatique = useCallback(async () => {
    if (!produit || !user?.id) return;
    
    setIsUpdatingPrix(true);
    
    try {
      // Calculer le nouveau prix de la matière première (poids × taux par gramme)
      const poids = produit.poids || 0;
      const nouveauPrixMatiere = poids * prixMatierePremiere;
      
      // Calculer le nouveau prix du façonnage (poids × taux de façonnage par gramme)
      const nouveauPrixFaconnage = poids * prixFaconnageParGramme;
      
      // Conserver la valeur existante pour la marge
      const marge = produit.marge || 0;
      
      // Calculer la différence actuelle entre le prix de vente et le prix minimum
      const differenceActuelle = produit.prixVente - (produit.prixMinimumVente || 0);
      
      // Calculer le nouveau prix de vente
      const nouveauPrixVente = nouveauPrixMatiere + nouveauPrixFaconnage + marge;
      
      // Calculer le nouveau prix minimum en maintenant la même différence
      const nouveauPrixMinimumVente = Math.max(0, nouveauPrixVente - differenceActuelle);
      
      // Préparer les données de mise à jour
      const updatedData = {
        prixMatierePremiere: nouveauPrixMatiere,
        prixAchat: nouveauPrixMatiere,
        prixFaconnage: nouveauPrixFaconnage,
        prixVente: nouveauPrixVente,
        prixMinimumVente: nouveauPrixMinimumVente
      };
      
      console.log('Mise à jour automatique du prix:', {
        poids,
        tauxMatiere: prixMatierePremiere,
        tauxFaconnage: prixFaconnageParGramme,
        nouveauPrixMatiere,
        nouveauPrixFaconnage,
        marge,
        prixVente: nouveauPrixVente,
        prixMinimumVente: nouveauPrixMinimumVente,
        difference: differenceActuelle
      });
      
      // Mettre à jour le produit
      const updatedProduit = await updateProduit(produit.id, updatedData);
      
      if (updatedProduit) {
        setProduit({
          ...produit,
          ...updatedProduit
        });
        setPrixMisAJour(true);
        toast.success(`Prix automatiquement mis à jour: ${poids}g × ${prixMatierePremiere} DH/g = ${nouveauPrixMatiere.toFixed(2)} DH`);
      } else {
        toast.error("Erreur lors de la mise à jour automatique du prix");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour automatique du prix:", error);
      toast.error("Erreur lors de la mise à jour automatique du prix");
    } finally {
      setIsUpdatingPrix(false);
    }
  }, [produit, user, prixMatierePremiere, prixFaconnageParGramme]);
  
  // Effet pour mettre à jour automatiquement le prix quand le produit est chargé
  useEffect(() => {
    if (produit && (prixMatierePremiere > 0 || prixFaconnageParGramme > 0) && !isLoading.produit) {
      // Vérifier si le prix affiché correspond au prix théorique actuel
      const prixTheoriqueMatiere = produit.poids * prixMatierePremiere;
      const prixTheoriqueFaconnage = produit.poids * prixFaconnageParGramme;
      
      const prixMatiereDifferent = Math.abs(prixTheoriqueMatiere - (produit.prixMatierePremiere || 0)) > 0.01;
      const prixFaconnageDifferent = Math.abs(prixTheoriqueFaconnage - (produit.prixFaconnage || 0)) > 0.01;
      
      // Si un des prix est différent, actualiser automatiquement
      if ((prixMatiereDifferent || prixFaconnageDifferent) && !isUpdatingPrix && !prixMisAJour) {
        recalculerPrixAutomatique();
      }
    }
  }, [produit, prixMatierePremiere, prixFaconnageParGramme, isLoading.produit, isUpdatingPrix, prixMisAJour, recalculerPrixAutomatique]);
  
  // Une fonction temporaire pour obtenir tous les produits
  // À remplacer par une vraie fonction si nécessaire
  const getAllProduits = async (): Promise<Produit[]> => {
    // Implémentation fictive, à remplacer par votre logique réelle
    return [];
  };
  
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.nom : 'Non catégorisé';
  };

  const getDepotName = (depotId: string) => {
    const depot = depots.find(d => d.id === depotId);
    return depot ? depot.nom : 'Non assigné';
  };

  const getTeamMember = (teamMemberId?: string) => {
    if (!teamMemberId) return null;
    return teamMembers.find(m => m.id === teamMemberId) || null;
  };
  
  const getMemberInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const isPromotionActive = (dateDebut: string, dateFin: string) => {
    const now = new Date();
    return new Date(dateDebut) <= now && new Date(dateFin) >= now;
  };
  
  const handleEditProduit = async (produitData: Omit<ProduitWithExtras, 'id' | 'reference'>) => {
    if (!produit) return;
    
    setIsLoading(prev => ({ ...prev, edit: true }));
    
    try {
      const updatedProduit = await updateProduit(produit.id, produitData);
      
      if (updatedProduit) {
        // S'assurer que tous les champs nécessaires sont présents
        const updatedProduitWithDefaults: ProduitWithExtras = {
          ...updatedProduit,
          prixMatierePremiere: updatedProduit.prixMatierePremiere || updatedProduit.prixAchat || 0,
          prixFaconnage: updatedProduit.prixFaconnage || 0,
          marge: updatedProduit.marge || 0
        };
        
        setProduit(updatedProduitWithDefaults);
        setIsEditDialogOpen(false);
        toast.success("Produit mis à jour avec succès");
      } else {
        toast.error("Erreur lors de la mise à jour du produit");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du produit:", error);
      toast.error("Erreur lors de la mise à jour du produit");
    } finally {
      setIsLoading(prev => ({ ...prev, edit: false }));
    }
  };
  
  const handleDeleteProduit = async () => {
    if (!produit) return;
    
    setIsLoading(prev => ({ ...prev, delete: true }));
    
    try {
      const success = await deleteProduit(produit.id);
      
      if (success) {
        toast.success("Produit supprimé avec succès");
        navigate('/dashboard/stock');
      } else {
        toast.error("Erreur lors de la suppression du produit");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du produit:", error);
      toast.error("Erreur lors de la suppression du produit");
    } finally {
      setIsLoading(prev => ({ ...prev, delete: false }));
    }
  };
  
  if (isLoading.produit || !produit) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  const member = getTeamMember(produit.teamMemberId);
  const hasPromotion = produit.promotion && isPromotionActive(produit.promotion.dateDebut, produit.promotion.dateFin);
  const finalPrice = hasPromotion 
    ? produit.promotion?.type === 'pourcentage'
      ? produit.prixVente * (1 - (produit.promotion.valeur / 100))
      : produit.prixVente - (produit.promotion?.valeur || 0)
    : produit.prixVente;

  // Vérifier si le prix affiché correspond au prix théorique actuel
  const prixTheorique = produit ? produit.poids * prixMatierePremiere : 0;
  const prixEnregistre = produit?.prixMatierePremiere || 0;
  const prixDifferent = Math.abs(prixTheorique - prixEnregistre) > 0.01; // Différence de plus de 1 centime

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/dashboard/stock')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au stock
        </Button>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBarcodeDialogOpen(true)}
          >
            <Printer className="mr-2 h-4 w-4 text-blue-500" />
            Code-barres
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image et infos principales */}
        <Card className="lg:col-span-1">
          <div className="aspect-square overflow-hidden">
            {produit.image ? (
              <img 
                src={produit.image}
                alt={produit.nom}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Package className="h-20 w-20 text-muted-foreground" />
              </div>
            )}
          </div>
          
          <CardContent className="p-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">{produit.nom}</h2>
              <p className="text-muted-foreground">{produit.description}</p>
            </div>
            
            <div className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Prix:</span>
                <div className="flex flex-col items-end">
                  {hasPromotion ? (
                    <>
                      <span className="line-through text-muted-foreground text-sm">
                        {produit.prixVente.toFixed(2)} DH
                      </span>
                      <span className="font-bold text-lg text-red-600 dark:text-red-400">
                        {finalPrice.toFixed(2)} DH
                      </span>
                    </>
                  ) : (
                    <span className="font-bold text-lg">{produit.prixVente.toFixed(2)} DH</span>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Prix d'achat:</span>
                <span>{produit.prixAchat.toFixed(2)} DH</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Prix minimum de vente:</span>
                <span className="text-orange-600 font-medium">{produit.prixMinimumVente.toFixed(2)} DH</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Référence:</span>
                <span className="font-mono">{produit.reference}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Code-barres:</span>
                <span className="font-mono text-xs">{produit.codeBarres}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Poids:</span>
                <div className="flex items-center">
                  <Weight className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>{produit.poids} g</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Stock:</span>
                <Badge variant={produit.quantite > 10 ? "outline" : produit.quantite > 0 ? "secondary" : "destructive"}>
                  {produit.quantite}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Détails et information complémentaires */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Détails du produit</CardTitle>
            <CardDescription>Informations détaillées sur ce produit</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
              <div className="space-y-1">
                <div className="flex items-center text-muted-foreground mb-1">
                  <Tag className="h-4 w-4 mr-2" />
                  <span>Catégorie</span>
                </div>
                <div className="font-medium">{getCategoryName(produit.categorieId)}</div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center text-muted-foreground mb-1">
                  <Building className="h-4 w-4 mr-2" />
                  <span>Dépôt</span>
                </div>
                <div className="font-medium">{getDepotName(produit.depotId)}</div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center text-muted-foreground mb-1">
                  <User className="h-4 w-4 mr-2" />
                  <span>Assigné à</span>
                </div>
                <div className="font-medium">
                  {member ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>{getMemberInitials(member.nom)}</AvatarFallback>
                      </Avatar>
                      <span>{member.nom}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Non assigné</span>
                  )}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center text-muted-foreground mb-1">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  <span>Statut du stock</span>
                </div>
                <div className="font-medium">
                  {produit.quantite === 0 ? (
                    <Badge variant="destructive">Rupture de stock</Badge>
                  ) : produit.quantite < 5 ? (
                    <Badge variant="secondary">Stock faible</Badge>
                  ) : (
                    <Badge variant="outline">En stock</Badge>
                  )}
                </div>
              </div>
            </div>
            
            <Separator />
            
            {produit.compose && produit.composants && produit.composants.length > 0 && (
              <>
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Composition du produit</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {produit.composants.map((comp, idx) => {
                      const component = produits.find(p => p.id === comp.produitId);
                      return component ? (
                        <div key={idx} className="p-3 bg-muted rounded-md flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="h-8 w-8 mr-2 rounded overflow-hidden bg-background flex-shrink-0">
                              {component.image ? (
                                <img 
                                  src={component.image}
                                  alt={component.nom}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <span className="font-medium">{component.nom}</span>
                          </div>
                          <Badge variant="secondary">x{comp.quantite}</Badge>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
                <Separator />
              </>
            )}
            
            {hasPromotion && (
              <>
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Percent className="h-5 w-5 mr-2 text-red-500" />
                    Promotion en cours
                  </h3>
                  
                  <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 rounded-md">
                    <div className="flex justify-between items-start mb-2">
                      <Badge className="bg-red-500 text-white">
                        {produit.promotion?.type === 'pourcentage' 
                          ? `-${produit.promotion.valeur}%` 
                          : `-${produit.promotion.valeur} DH`}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        {new Date(produit.promotion?.dateDebut || '').toLocaleDateString()} - {new Date(produit.promotion?.dateFin || '').toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="line-through text-muted-foreground">
                        {produit.prixVente.toFixed(2)} DH
                      </span>
                      <span className="font-bold text-lg text-red-600 dark:text-red-400">
                        {finalPrice.toFixed(2)} DH
                      </span>
                    </div>
                    
                    {produit.promotion?.description && (
                      <p className="text-sm mt-2">{produit.promotion.description}</p>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Analyse du prix</h3>
                {produit && (
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground">
                      Prix actuel de la matière: <span className="font-medium">{prixMatierePremiere.toFixed(2)} DH/g</span>
                    </div>
                    {!prixDifferent && prixMisAJour && (
                      <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500 gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Prix à jour
                      </Badge>
                    )}
                    {isUpdatingPrix && (
                      <Badge variant="outline">
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Mise à jour...
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted rounded-md">
                  <div className="text-muted-foreground text-sm mb-1">Matière première</div>
                  <div className="text-xl font-semibold">{produit.prixMatierePremiere?.toFixed(2) || produit.prixAchat.toFixed(2)} DH</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    <div className="flex items-center gap-1">
                      <Weight className="h-3 w-3" />
                      <span>{produit.poids} g × {prixMatierePremiere.toFixed(2)} DH/g</span>
                    </div>
                    {prixDifferent && !isUpdatingPrix && (
                      <div className="text-xs text-amber-600 mt-1 font-medium">
                        Recalcul en cours...
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-4 bg-muted rounded-md">
                  <div className="text-muted-foreground text-sm mb-1">Façonnage</div>
                  <div className="text-xl font-semibold">
                    {produit.prixFaconnage?.toFixed(2) || 0} DH
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Main d'œuvre et travail
                  </div>
                </div>
                
                <div className="p-4 bg-muted rounded-md">
                  <div className="text-muted-foreground text-sm mb-1">Marge</div>
                  <div className="text-xl font-semibold">
                    {produit.marge?.toFixed(2) || 0} DH
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Bénéfice
                  </div>
                </div>
                
                <div className="p-4 bg-primary/10 rounded-md border-2 border-primary">
                  <div className="text-muted-foreground text-sm mb-1">Prix de vente</div>
                  <div className="text-xl font-semibold">{produit.prixVente.toFixed(2)} DH</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    MP + Façonnage + Marge
                  </div>
                  {hasPromotion && (
                    <div className="text-xs text-red-500 mt-1">
                      En promotion: {finalPrice.toFixed(2)} DH
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Dialogs */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le produit</DialogTitle>
          </DialogHeader>
          {isLoading.edit ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <ProduitFormWithTeam
              initialValues={produit}
              onSubmit={handleEditProduit}
              categories={categories}
              depots={depots}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 p-4 rounded-md">
            <div className="space-y-1">
              <p className="font-medium">{produit.nom}</p>
              <p className="text-sm text-muted-foreground">Référence: {produit.reference}</p>
              <p className="text-sm text-muted-foreground">Catégorie: {getCategoryName(produit.categorieId)}</p>
              <p className="text-sm text-muted-foreground">Dépôt: {getDepotName(produit.depotId)}</p>
              <p className="text-sm text-muted-foreground">Prix: {produit.prixVente.toFixed(2)} DH</p>
              <p className="text-sm text-muted-foreground">Stock: {produit.quantite}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isLoading.delete}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProduit} 
              disabled={isLoading.delete}
            >
              {isLoading.delete ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBarcodeDialogOpen} onOpenChange={setIsBarcodeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Code-barres du produit
            </DialogTitle>
            <DialogDescription>
              Imprimer le code-barres pour l'étiquetage du produit.
            </DialogDescription>
          </DialogHeader>
          
          <BarcodeDisplay 
            barcode={produit.codeBarres}
            productName={produit.nom}
            price={produit.prixVente}
            weight={produit.poids}
            category={categories.find(c => c.id === produit.categorieId)?.nom}
          />
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsBarcodeDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProduitDetailsPage; 