import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Package, UserCircle, Percent, Combine, Barcode, Printer, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/sonner';
import ProduitFormWithTeam from '@/components/stock/ProduitFormWithTeam';
import ComposeProductForm from '@/components/stock/ComposeProductForm';
import ProductPromotionForm from '@/components/stock/ProductPromotionForm';
import BarcodeDisplay from '@/components/stock/BarcodeDisplay';
import { getProduits, getProduitsWithPromotions, createProduit, updateProduit, deleteProduit, createPromotion, deletePromotion } from '@/services/supabase/stock';
import { getTeamMembers, TeamMember } from '@/services/supabase/team';
import { getDepots, getCategories, Category } from '@/services/supabase/parametres';
import { useNavigate } from 'react-router-dom';

export interface Categorie extends Category {}

export interface Depot {
  id: string;
  nom: string;
  adresse: string;
}

export interface Produit {
  id: string;
  nom: string;
  description: string;
  reference: string;
  codeBarres: string;
  prixAchat: number;
  prixVente: number;
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

export interface Promotion {
  id: string;
  produitId: string;
  type: 'pourcentage' | 'montant' | 'bundle';
  valeur: number;
  dateDebut: string;
  dateFin: string;
  description?: string;
}

const StockPage = () => {
  const [activeTab, setActiveTab] = useState<'produits' | 'compositions' | 'promotions'>('produits');
  const [displayMode, setDisplayMode] = useState<'table' | 'card'>('card');
  const [produits, setProduits] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categorieFilter, setCategorieFilter] = useState<string>('all');
  const [depotFilter, setDepotFilter] = useState<string>('all');
  const [selectedProduit, setSelectedProduit] = useState<Produit | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isComposeDialogOpen, setIsComposeDialogOpen] = useState(false);
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
  const [isBarcodeDialogOpen, setIsBarcodeDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState({
    produits: false,
    categories: false,
    depots: false,
    teamMembers: false,
    promotions: false,
    add: false,
    edit: false,
    delete: false,
    compose: false,
    promotion: false
  });
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(prev => ({ ...prev, produits: true, categories: true, depots: true, teamMembers: true, promotions: true }));
      
      try {
        const produitsData = await getProduitsWithPromotions();
        setProduits(produitsData);
        
        const promotionsData = produitsData
          .filter(p => p.promotion)
          .map(p => p.promotion) as Promotion[];
        setPromotions(promotionsData);
        
        const categoriesData = await getCategories();
        setCategories(categoriesData);
        
        const depotsData = await getDepots();
        setDepots(depotsData);
        
        const teamMembersData = await getTeamMembers();
        setTeamMembers(teamMembersData);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setIsLoading(prev => ({ ...prev, produits: false, categories: false, depots: false, teamMembers: false, promotions: false }));
      }
    };
    
    loadData();
  }, []);

  const filteredProduits = produits.filter(produit => {
    const matchesSearch = produit.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produit.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategorie = categorieFilter === 'all' ? true : produit.categorieId === categorieFilter;
    const matchesDepot = depotFilter === 'all' ? true : produit.depotId === depotFilter;
    const matchesCompose = activeTab === 'compositions' ? !!produit.compose : true;
    const matchesPromotion = activeTab === 'promotions' ? !!produit.promotion : true;
    
    if (activeTab === 'produits') {
      return matchesSearch && matchesCategorie && matchesDepot;
    } else if (activeTab === 'compositions') {
      return matchesSearch && matchesCategorie && matchesDepot && matchesCompose;
    } else {
      return matchesSearch && matchesCategorie && matchesDepot && matchesPromotion;
    }
  });

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.nom : 'Non catégorisé';
  };

  const getDepotName = (depotId: string) => {
    const depot = depots.find(d => d.id === depotId);
    return depot ? depot.nom : 'Non assigné';
  };

  const getTeamMemberName = (teamMemberId?: string) => {
    if (!teamMemberId) return 'Non assigné';
    const member = teamMembers.find(m => m.id === teamMemberId);
    return member ? member.nom : 'Non assigné';
  };

  const getTeamMember = (teamMemberId?: string) => {
    if (!teamMemberId) return null;
    return teamMembers.find(m => m.id === teamMemberId) || null;
  };

  const handleAddProduit = async (produitData: Omit<Produit, 'id' | 'reference'>) => {
    setIsLoading(prev => ({ ...prev, add: true }));
    
    try {
      // Générer une référence interne pour le produit
      const reference = `REF-${new Date().getFullYear().toString().substring(2)}-${String(produits.length + 1).padStart(3, '0')}`;
      
      // Si le code-barres n'est pas fourni, générer un nouveau code-barres unique (EAN-13)
      const codeBarres = produitData.codeBarres || generateUniqueBarcode();
      
      // Créer le produit dans Supabase
      const newProduit = await createProduit({
        ...produitData,
        reference,
        codeBarres,
        poids: produitData.poids || 0,
        image: produitData.image || ''
      });
      
      if (newProduit) {
        // Ajouter le nouveau produit à l'état local
        setProduits(prev => [...prev, newProduit]);
        
        toast.success("Produit ajouté avec succès");
      } else {
        toast.error("Erreur lors de l'ajout du produit");
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout du produit:", error);
      toast.error("Erreur lors de l'ajout du produit");
    } finally {
      setIsLoading(prev => ({ ...prev, add: false }));
      setIsAddDialogOpen(false);
    }
  };

  const generateUniqueBarcode = (): string => {
    const countryPrefix = "611";
    
    const randomPart = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    
    const codeWithoutChecksum = countryPrefix + randomPart;
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(codeWithoutChecksum[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checksum = (10 - (sum % 10)) % 10;
    
    return codeWithoutChecksum + checksum;
  };

  const handleComposeProduct = async (compositionData: {
    nom: string;
    description: string;
    categorieId: string;
    depotId: string;
    composants: { produitId: string; quantite: number }[];
    prixVenteManuel?: number;
  }) => {
    setIsLoading(prev => ({ ...prev, compose: true }));
    
    try {
      const { nom, description, categorieId, depotId, composants, prixVenteManuel } = compositionData;
      
      // Calculer le prix d'achat total des composants
      const prixAchatTotal = composants.reduce((total, comp) => {
        const produit = produits.find(p => p.id === comp.produitId);
        return total + (produit ? produit.prixAchat * comp.quantite : 0);
      }, 0);
      
      // Calculer le prix de vente suggéré (majoré de 30% par défaut si pas de prix manuel)
      const prixVente = prixVenteManuel || Math.round(prixAchatTotal * 1.3 * 100) / 100;
      
      // Générer une référence unique pour le produit composé
      const reference = `COMP-${new Date().getFullYear().toString().substring(2)}-${String(produits.filter(p => p.compose).length + 1).padStart(3, '0')}`;
      
      // Générer un code-barres unique pour le produit composé
      const codeBarres = generateUniqueBarcode();
      
      // Créer le produit composé dans Supabase
      const newProduit = await createProduit({
        nom,
        description,
        reference,
        codeBarres,
        prixAchat: prixAchatTotal,
        prixVente,
        quantite: 0,
        categorieId,
        depotId,
        compose: true,
        composants,
        poids: 0,
        image: ''
      });
      
      if (newProduit) {
        // Ajouter le nouveau produit à l'état local
        setProduits(prev => [...prev, newProduit]);
        
        toast.success("Produit composé créé avec succès");
      } else {
        toast.error("Erreur lors de la création du produit composé");
      }
    } catch (error) {
      console.error("Erreur lors de la création du produit composé:", error);
      toast.error("Erreur lors de la création du produit composé");
    } finally {
      setIsLoading(prev => ({ ...prev, compose: false }));
      setIsComposeDialogOpen(false);
    }
  };

  const handleAddPromotion = async (promotionData: {
    produitId: string;
    type: 'pourcentage' | 'montant' | 'bundle';
    valeur: number;
    dateDebut: string;
    dateFin: string;
    description?: string;
  }) => {
    setIsLoading(prev => ({ ...prev, promotion: true }));
    
    try {
      // Créer la nouvelle promotion dans Supabase
      const newPromotion = await createPromotion(promotionData);
      
      if (newPromotion) {
        // Ajouter la promotion à l'état local
        setPromotions(prev => [...prev, newPromotion]);
        
        // Mettre à jour le produit associé
        setProduits(prev => prev.map(produit => 
          produit.id === promotionData.produitId 
            ? { ...produit, promotion: newPromotion } 
            : produit
        ));
        
        toast.success("Promotion ajoutée avec succès");
      } else {
        toast.error("Erreur lors de l'ajout de la promotion");
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de la promotion:", error);
      toast.error("Erreur lors de l'ajout de la promotion");
    } finally {
      setIsLoading(prev => ({ ...prev, promotion: false }));
      setIsPromotionDialogOpen(false);
    }
  };

  const handleEditProduit = async (produitData: Omit<Produit, 'id' | 'reference'>) => {
    if (!selectedProduit) return;
    
    setIsLoading(prev => ({ ...prev, edit: true }));
    
    try {
      // Mettre à jour le produit dans Supabase
      const updatedProduit = await updateProduit(selectedProduit.id, produitData);
      
      if (updatedProduit) {
        // Mettre à jour l'état local
        setProduits(prev => prev.map(p => 
          p.id === selectedProduit.id 
            ? { ...p, ...updatedProduit } 
            : p
        ));
        
        toast.success("Produit mis à jour avec succès");
      } else {
        toast.error("Erreur lors de la mise à jour du produit");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du produit:", error);
      toast.error("Erreur lors de la mise à jour du produit");
    } finally {
      setIsLoading(prev => ({ ...prev, edit: false }));
      setIsEditDialogOpen(false);
      setSelectedProduit(null);
    }
  };

  const handleDeleteProduit = async () => {
    if (!selectedProduit) return;
    
    setIsLoading(prev => ({ ...prev, delete: true }));
    
    try {
      // Supprimer le produit dans Supabase
      const success = await deleteProduit(selectedProduit.id);
      
      if (success) {
        // Mettre à jour l'état local
        setProduits(prev => prev.filter(p => p.id !== selectedProduit.id));
        
        // Si le produit avait une promotion, la supprimer également de l'état local
        if (selectedProduit.promotion) {
          setPromotions(prev => prev.filter(p => p.id !== selectedProduit.promotion?.id));
        }
        
        toast.success("Produit supprimé avec succès");
      } else {
        toast.error("Erreur lors de la suppression du produit");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du produit:", error);
      toast.error("Erreur lors de la suppression du produit");
    } finally {
      setIsLoading(prev => ({ ...prev, delete: false }));
      setIsDeleteDialogOpen(false);
      setSelectedProduit(null);
    }
  };

  const removePromotion = async (produitId: string, promotionId: string) => {
    setIsLoading(prev => ({ ...prev, promotion: true }));
    
    try {
      // Supprimer la promotion dans Supabase
      const success = await deletePromotion(promotionId);
      
      if (success) {
        // Mettre à jour l'état local
        setProduits(prev => prev.map(produit => 
          produit.id === produitId 
            ? { ...produit, promotion: undefined } 
            : produit
        ));
        
        setPromotions(prev => prev.filter(p => p.id !== promotionId));
        
        toast.success("Promotion supprimée avec succès");
      } else {
        toast.error("Erreur lors de la suppression de la promotion");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la promotion:", error);
      toast.error("Erreur lors de la suppression de la promotion");
    } finally {
      setIsLoading(prev => ({ ...prev, promotion: false }));
    }
  };

  const clearFilters = () => {
    setCategorieFilter('all');
    setDepotFilter('all');
    setSearchTerm('');
  };

  const getMemberInitials = (name: string) => {
    if (!name || name === 'Non assigné') return 'NA';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`;
    }
    return parts[0].substring(0, 2);
  };

  const isPromotionActive = (dateDebut: string, dateFin: string) => {
    const now = new Date();
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    return now >= debut && now <= fin;
  };

  // Rendu conditionnel basé sur l'état de chargement des données
  if (isLoading.produits || isLoading.categories || isLoading.depots || isLoading.teamMembers) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Chargement des données...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestion du Stock</h1>
        <p className="text-muted-foreground">Gérez les produits, compositions et promotions</p>
      </div>

      <Tabs defaultValue="produits" onValueChange={(value) => {
        setActiveTab(value as 'produits' | 'compositions' | 'promotions');
        // Reset search and filters when changing tabs
        if (searchTerm || categorieFilter !== 'all' || depotFilter !== 'all') {
          setSearchTerm('');
          setCategorieFilter('all');
          setDepotFilter('all');
        }
      }}>
        <div className="flex flex-wrap justify-between items-center">
          <TabsList>
            <TabsTrigger value="produits">Produits</TabsTrigger>
            <TabsTrigger value="compositions">Compositions</TabsTrigger>
            <TabsTrigger value="promotions">Promotions</TabsTrigger>
          </TabsList>

          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mt-4 sm:mt-0">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher un produit..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex space-x-1 rounded-md border p-1">
                <Button
                  variant={displayMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDisplayMode('table')}
                  className="text-xs"
                >
                  Table
                </Button>
                <Button
                  variant={displayMode === 'card' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDisplayMode('card')}
                  className="text-xs"
                >
                  Cartes
                </Button>
              </div>
              
              <Select value={categorieFilter} onValueChange={setCategorieFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrer par catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map(categorie => (
                    <SelectItem key={categorie.id} value={categorie.id}>{categorie.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={depotFilter} onValueChange={setDepotFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrer par dépôt" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les dépôts</SelectItem>
                  {depots.map(depot => (
                    <SelectItem key={depot.id} value={depot.id}>{depot.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex gap-2">
                {(searchTerm || categorieFilter !== 'all' || depotFilter !== 'all') && (
                  <Button variant="outline" onClick={clearFilters}>
                    <Filter className="mr-2 h-4 w-4" />
                    Effacer les filtres
                  </Button>
                )}
                
                {activeTab === 'produits' && (
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouveau produit
                  </Button>
                )}
                
                {activeTab === 'compositions' && (
                  <Button onClick={() => setIsComposeDialogOpen(true)}>
                    <Combine className="mr-2 h-4 w-4" />
                    Nouvelle composition
                  </Button>
                )}
                
                {activeTab === 'promotions' && (
                  <Button onClick={() => setIsPromotionDialogOpen(true)}>
                    <Percent className="mr-2 h-4 w-4" />
                    Nouvelle promotion
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <TabsContent value="produits" className="mt-6">
          {displayMode === 'table' ? (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>Code-barres</TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead className="hidden md:table-cell">Dépôt</TableHead>
                      <TableHead className="hidden lg:table-cell">Assigné à</TableHead>
                      <TableHead className="text-right">Prix Vente</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProduits.length > 0 ? (
                      filteredProduits.map((produit) => {
                        const member = teamMembers.find(m => m.id === produit.teamMemberId);
                        return (
                          <TableRow key={produit.id}>
                            <TableCell className="font-mono text-xs">{produit.reference}</TableCell>
                            <TableCell className="font-mono text-xs">{produit.codeBarres}</TableCell>
                            <TableCell className="font-medium">{produit.nom}</TableCell>
                            <TableCell>{getCategoryName(produit.categorieId)}</TableCell>
                            <TableCell className="hidden md:table-cell">{getDepotName(produit.depotId)}</TableCell>
                            <TableCell className="hidden lg:table-cell">
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
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col items-end">
                                {produit.promotion && isPromotionActive(produit.promotion.dateDebut, produit.promotion.dateFin) ? (
                                  <>
                                    <span className="line-through text-muted-foreground text-xs">
                                      {produit.prixVente !== undefined ? produit.prixVente.toFixed(2) : '0.00'} DH
                                    </span>
                                    <span className="font-semibold text-red-600 dark:text-red-400">
                                      {produit.promotion.type === 'pourcentage' 
                                        ? (produit.prixVente !== undefined ? (produit.prixVente * (1 - produit.promotion.valeur / 100)).toFixed(2) : '0.00')
                                        : produit.promotion.type === 'montant'
                                          ? (produit.prixVente !== undefined ? (produit.prixVente - produit.promotion.valeur).toFixed(2) : '0.00')
                                          : produit.prixVente !== undefined ? produit.prixVente.toFixed(2) : '0.00'} DH
                                    </span>
                                  </>
                                ) : (
                                  <span>{produit.prixVente !== undefined ? produit.prixVente.toFixed(2) : '0.00'} DH</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={produit.quantite > 10 ? "outline" : produit.quantite > 0 ? "secondary" : "destructive"}>
                                {produit.quantite}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedProduit(produit);
                                    setIsBarcodeDialogOpen(true);
                                  }}
                                >
                                  <Printer className="h-4 w-4 text-blue-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={isLoading.edit}
                                  onClick={() => {
                                    setSelectedProduit(produit);
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  {isLoading.edit && selectedProduit?.id === produit.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Edit className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={isLoading.delete}
                                  onClick={() => {
                                    setSelectedProduit(produit);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  {isLoading.delete && selectedProduit?.id === produit.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-10">
                          Aucun produit ne correspond à vos critères de recherche
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProduits.length > 0 ? (
                filteredProduits.map((produit) => (
                  <Card key={produit.id} className="overflow-hidden flex flex-col h-full">
                    <div className="relative aspect-square overflow-hidden cursor-pointer" onClick={() => navigate(`/dashboard/stock/produit/${produit.id}`)}>
                      {produit.image ? (
                        <img 
                          src={produit.image}
                          alt={produit.nom}
                          className="w-full h-full object-cover transition-transform hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <Package className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      {produit.promotion && isPromotionActive(produit.promotion.dateDebut, produit.promotion.dateFin) && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-red-500 text-white">
                            {produit.promotion.type === 'pourcentage' 
                              ? `-${produit.promotion.valeur}%` 
                              : `-${produit.promotion.valeur} DH`}
                          </Badge>
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2">
                        <Badge variant={produit.quantite > 10 ? "outline" : produit.quantite > 0 ? "secondary" : "destructive"}>
                          {produit.quantite}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4 flex-grow">
                      <div className="flex flex-col space-y-1.5">
                        <h3 className="font-semibold truncate">{produit.nom}</h3>
                        <p className="text-sm text-muted-foreground truncate">{getCategoryName(produit.categorieId)}</p>
                        <div className="mt-2">
                          {produit.promotion && isPromotionActive(produit.promotion.dateDebut, produit.promotion.dateFin) ? (
                            <div className="flex items-center space-x-2">
                              <span className="line-through text-sm text-muted-foreground">
                                {produit.prixVente !== undefined ? produit.prixVente.toFixed(2) : '0.00'} DH
                              </span>
                              <span className="font-semibold text-red-600 dark:text-red-400">
                                {produit.promotion.type === 'pourcentage' 
                                  ? (produit.prixVente !== undefined ? (produit.prixVente * (1 - produit.promotion.valeur / 100)).toFixed(2) : '0.00')
                                  : produit.promotion.type === 'montant'
                                    ? (produit.prixVente !== undefined ? (produit.prixVente - produit.promotion.valeur).toFixed(2) : '0.00')
                                    : produit.prixVente !== undefined ? produit.prixVente.toFixed(2) : '0.00'} DH
                              </span>
                            </div>
                          ) : (
                            <span className="font-semibold">{produit.prixVente !== undefined ? produit.prixVente.toFixed(2) : '0.00'} DH</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <div className="p-4 pt-0 border-t flex justify-between items-center">
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="text-xs px-0 py-0 h-auto"
                        onClick={() => navigate(`/dashboard/stock/produit/${produit.id}`)}
                      >
                        Voir détails
                      </Button>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedProduit(produit);
                            setIsBarcodeDialogOpen(true);
                          }}
                        >
                          <Printer className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedProduit(produit);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedProduit(produit);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-10 bg-muted rounded-lg">
                  Aucun produit ne correspond à vos critères de recherche
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="compositions" className="mt-6">
          {displayMode === 'table' ? (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>Produit composé</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead className="hidden md:table-cell">Dépôt</TableHead>
                      <TableHead className="text-right">Prix Vente</TableHead>
                      <TableHead className="hidden lg:table-cell">Composants</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProduits.length > 0 ? (
                      filteredProduits.map((produit) => (
                        <TableRow key={produit.id}>
                          <TableCell className="font-mono text-xs">{produit.reference}</TableCell>
                          <TableCell className="font-medium">{produit.nom}</TableCell>
                          <TableCell>{getCategoryName(produit.categorieId)}</TableCell>
                          <TableCell className="hidden md:table-cell">{getDepotName(produit.depotId)}</TableCell>
                          <TableCell className="text-right">{produit.prixVente !== undefined ? produit.prixVente.toFixed(2) : '0.00'} DH</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex flex-col gap-1">
                              {produit.composants?.map((comp, idx) => {
                                const composant = produits.find(p => p.id === comp.produitId);
                                return (
                                  <span key={idx} className="text-xs">
                                    {composant?.nom || 'Produit inconnu'} x{comp.quantite}
                                  </span>
                                );
                              })}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={produit.quantite > 10 ? "outline" : produit.quantite > 0 ? "secondary" : "destructive"}>
                              {produit.quantite}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedProduit(produit);
                                  setIsBarcodeDialogOpen(true);
                                }}
                              >
                                <Printer className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={isLoading.edit}
                                onClick={() => {
                                  setSelectedProduit(produit);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                {isLoading.edit && selectedProduit?.id === produit.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Edit className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={isLoading.delete}
                                onClick={() => {
                                  setSelectedProduit(produit);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                {isLoading.delete && selectedProduit?.id === produit.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center">
                          <div className="flex flex-col items-center">
                            <Package className="h-10 w-10 text-muted-foreground/50" />
                            <p className="mt-2">Aucune composition disponible</p>
                            <Button variant="outline" className="mt-2" onClick={() => setIsComposeDialogOpen(true)}>
                              <Combine className="mr-2 h-4 w-4" />
                              Créer une composition
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProduits.length > 0 ? (
                filteredProduits.map((produit) => (
                  <Card key={produit.id} className="overflow-hidden flex flex-col h-full">
                    <div className="relative aspect-square overflow-hidden cursor-pointer" onClick={() => navigate(`/dashboard/stock/produit/${produit.id}`)}>
                      {produit.image ? (
                        <img 
                          src={produit.image}
                          alt={produit.nom}
                          className="w-full h-full object-cover transition-transform hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <Package className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2">
                        <Badge variant={produit.quantite > 10 ? "outline" : produit.quantite > 0 ? "secondary" : "destructive"}>
                          {produit.quantite}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4 flex-grow">
                      <div className="flex flex-col space-y-1.5">
                        <h3 className="font-semibold truncate">{produit.nom}</h3>
                        <p className="text-sm text-muted-foreground truncate">{getCategoryName(produit.categorieId)}</p>
                        <div className="mt-2 text-sm">
                          <p className="font-semibold">{produit.prixVente !== undefined ? produit.prixVente.toFixed(2) : '0.00'} DH</p>
                          <div className="mt-2 max-h-20 overflow-y-auto">
                            {produit.composants?.map((comp, idx) => {
                              const composant = produits.find(p => p.id === comp.produitId);
                              return (
                                <div key={idx} className="text-xs flex justify-between">
                                  <span>{composant?.nom || 'Produit inconnu'}</span>
                                  <span>x{comp.quantite}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <div className="p-4 pt-0 border-t flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedProduit(produit);
                          setIsBarcodeDialogOpen(true);
                        }}
                      >
                        <Printer className="h-4 w-4 text-blue-500" />
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-10 bg-muted rounded-lg">
                  <div className="flex flex-col items-center">
                    <Combine className="h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-2">Aucune composition disponible</p>
                    <Button variant="outline" className="mt-2" onClick={() => setIsComposeDialogOpen(true)}>
                      <Combine className="mr-2 h-4 w-4" />
                      Créer une composition
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="promotions" className="mt-6">
          {displayMode === 'table' ? (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Valeur</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead className="text-right">Prix normal</TableHead>
                      <TableHead className="text-right">Prix promo</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProduits.length > 0 ? (
                      filteredProduits
                        .filter(p => p.promotion)
                        .map((produit) => {
                          const promotion = produit.promotion!;
                          const isActive = isPromotionActive(promotion.dateDebut, promotion.dateFin);
                          const promoPrice = promotion.type === 'pourcentage' 
                            ? produit.prixVente * (1 - promotion.valeur / 100)
                            : produit.prixVente - promotion.valeur;
                            
                          return (
                            <TableRow key={produit.id} className={isActive ? '' : 'opacity-60'}>
                              <TableCell className="font-medium">{produit.nom}</TableCell>
                              <TableCell>
                                {promotion.type === 'pourcentage' && 'Pourcentage'}
                                {promotion.type === 'montant' && 'Montant fixe'}
                                {promotion.type === 'bundle' && 'Pack'}
                              </TableCell>
                              <TableCell className="text-right">
                                {promotion.type === 'pourcentage' ? `${promotion.valeur}%` : `${promotion.valeur.toFixed(2)} DH`}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="text-xs">
                                    Début: {new Date(promotion.dateDebut).toLocaleDateString()}
                                  </span>
                                  <span className="text-xs">
                                    Fin: {new Date(promotion.dateFin).toLocaleDateString()}
                                  </span>
                                  {isActive ? (
                                    <Badge variant="success" className="mt-1 w-fit bg-green-500 hover:bg-green-600">Active</Badge>
                                  ) : (
                                    <Badge variant="outline" className="mt-1 w-fit">Inactive</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{produit.prixVente.toFixed(2)} DH</TableCell>
                              <TableCell className="text-right font-semibold text-red-600 dark:text-red-400">
                                {promoPrice.toFixed(2)} DH
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removePromotion(produit.id, promotion.id)}
                                  disabled={isLoading.promotion}
                                >
                                  {isLoading.promotion && selectedProduit?.id === produit.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center">
                          <div className="flex flex-col items-center">
                            <Percent className="h-10 w-10 text-muted-foreground/50" />
                            <p className="mt-2">Aucune promotion disponible</p>
                            <Button variant="outline" className="mt-2" onClick={() => setIsPromotionDialogOpen(true)}>
                              <Percent className="mr-2 h-4 w-4" />
                              Créer une promotion
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProduits.length > 0 ? (
                filteredProduits
                  .filter(produit => produit.promotion)
                  .map((produit) => {
                    const promotion = produit.promotion!;
                    const isActive = isPromotionActive(promotion.dateDebut, promotion.dateFin);
                    
                    // Calculer le prix après promotion
                    const promoPrice = promotion.type === 'pourcentage'
                      ? produit.prixVente * (1 - promotion.valeur / 100)
                      : produit.prixVente - promotion.valeur;
                      
                    return (
                      <Card key={produit.id} className={`overflow-hidden flex flex-col h-full ${isActive ? '' : 'opacity-70'}`}>
                        <div className="relative aspect-square overflow-hidden cursor-pointer" onClick={() => navigate(`/dashboard/stock/produit/${produit.id}`)}>
                          {produit.image ? (
                            <img 
                              src={produit.image}
                              alt={produit.nom}
                              className="w-full h-full object-cover transition-transform hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <Package className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <Badge className={isActive ? "bg-red-500 text-white" : "bg-gray-500 text-white"}>
                              {promotion.type === 'pourcentage' 
                                ? `-${promotion.valeur}%` 
                                : `-${promotion.valeur} DH`}
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-4 flex-grow">
                          <div className="flex flex-col space-y-1.5">
                            <h3 className="font-semibold truncate">{produit.nom}</h3>
                            <p className="text-sm text-muted-foreground truncate">{getCategoryName(produit.categorieId)}</p>
                            
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-muted-foreground">
                                {new Date(promotion.dateDebut).toLocaleDateString()} - {new Date(promotion.dateFin).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="line-through text-sm text-muted-foreground">
                                  {produit.prixVente.toFixed(2)} DH
                                </span>
                                <span className="font-semibold text-red-600 dark:text-red-400">
                                  {promoPrice.toFixed(2)} DH
                                </span>
                              </div>
                              {promotion.description && (
                                <p className="text-xs text-muted-foreground mt-2">{promotion.description}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                        <div className="p-4 pt-0 border-t flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removePromotion(produit.id, promotion.id)}
                            disabled={isLoading.promotion}
                          >
                            {isLoading.promotion && selectedProduit?.id === produit.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-red-500" />
                            )}
                          </Button>
                        </div>
                      </Card>
                    );
                  })
              ) : (
                <div className="col-span-full text-center py-10 bg-muted rounded-lg">
                  <div className="flex flex-col items-center">
                    <Percent className="h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-2">Aucune promotion disponible</p>
                    <Button variant="outline" className="mt-2" onClick={() => setIsPromotionDialogOpen(true)}>
                      <Percent className="mr-2 h-4 w-4" />
                      Créer une promotion
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau produit</DialogTitle>
          </DialogHeader>
          {isLoading.add ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <ProduitFormWithTeam 
              onSubmit={handleAddProduit} 
              categories={categories} 
              depots={depots} 
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le produit</DialogTitle>
          </DialogHeader>
          {isLoading.edit || !selectedProduit ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <ProduitFormWithTeam
              initialValues={selectedProduit}
              onSubmit={handleEditProduit}
              categories={categories}
              depots={depots}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isComposeDialogOpen} onOpenChange={setIsComposeDialogOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Composer un nouveau produit</DialogTitle>
            <DialogDescription>
              Créez un nouveau produit composé de plusieurs produits existants
            </DialogDescription>
          </DialogHeader>
          <ComposeProductForm
            onSubmit={handleComposeProduct}
            produits={produits.filter(p => !p.compose)}
            categories={categories}
            depots={depots}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isPromotionDialogOpen} onOpenChange={setIsPromotionDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter une promotion</DialogTitle>
            <DialogDescription>
              Créez une promotion pour un produit existant
            </DialogDescription>
          </DialogHeader>
          <ProductPromotionForm
            onSubmit={handleAddPromotion}
            produits={produits.filter(p => !p.promotion)}
          />
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
          {selectedProduit && (
            <div className="bg-muted/50 p-4 rounded-md">
              <div className="space-y-1">
                <p className="font-medium">{selectedProduit.nom}</p>
                <p className="text-sm text-muted-foreground">Référence: {selectedProduit.reference}</p>
                <p className="text-sm text-muted-foreground">Catégorie: {getCategoryName(selectedProduit.categorieId)}</p>
                <p className="text-sm text-muted-foreground">Dépôt: {getDepotName(selectedProduit.depotId)}</p>
                <p className="text-sm text-muted-foreground">Prix: {selectedProduit.prixVente !== undefined ? selectedProduit.prixVente.toFixed(2) : '0.00'} DH</p>
                <p className="text-sm text-muted-foreground">Stock: {selectedProduit.quantite}</p>
              </div>
            </div>
          )}
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
              <Barcode className="h-5 w-5" />
              Imprimer le code-barres
            </DialogTitle>
            <DialogDescription>
              Imprimer le code-barres pour l'étiquetage du produit.
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduit && (
            <BarcodeDisplay 
              barcode={selectedProduit.codeBarres}
              productName={selectedProduit.nom}
              price={selectedProduit.prixVente}
            />
          )}
          
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

export default StockPage;
