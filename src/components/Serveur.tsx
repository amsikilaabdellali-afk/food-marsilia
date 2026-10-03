  const getRuptureMatiere = (menuId: string): string | null => {
    const recetteItems = recettes.filter((r) => r.menu_id === menuId);
    if (recetteItems.length === 0) return null; // ila ma dayr-lich recette, khlliha khdama
    for (const r of recetteItems) {
      const mp = matieres.find((x) => x.id === r.matiere_id) as any;
      if (!mp) continue;
      const stock = Number(mp.quantite_stock ?? mp.quantite ?? 0);
      // Hna l-fix lkbir: kan9raw ch7al khassna
      const besoin = Number((r as any).qte_necessaire ?? (r as any).quantite ?? 0);
      // Ila stock 9el men li khasna => Rupture
      if (stock < besoin) return mp.nom;
    }
    return null;
  };
