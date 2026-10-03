const handlePay = async (cmd: CmdWithItems) => {
    setPaying(cmd.id);

    const [{ data: recettes }, { data: matieres }] = await Promise.all([
      supabase.from('recette').select('*'),
      supabase.from('matiere_premiere').select('*'),
    ]);

    if (recettes && matieres && cmd.items.length > 0) {
      for (const item of cmd.items) {
        if (!item.menu_id) continue;
        const itemRecettes = recettes.filter((r: Recette) => r.menu_id === item.menu_id);
        for (const r of itemRecettes) {
          const mp = matieres.find((m: MatierePremiere) => m.id === r.matiere_id) as any;
          if (mp) {
            const currentStock = Number(mp.quantite_stock ?? mp.quantite ?? 0);
            // Hna l-fix: kan9raw quantite wla qte_necessaire, li kayn
            const besoin = Number((r as any).quantite ?? (r as any).qte_necessaire ?? 0);
            const newQte = Math.max(0, currentStock - (besoin * item.qte));
            await supabase.from('matiere_premiere').update({
              quantite_stock: newQte,
              quantite: newQte
            }).eq('id', mp.id);
          }
        }
      }
    }

    await supabase.from('commandes').update({ statut: 'paye', updated_at: new Date().toISOString() }).eq('id', cmd.id);

    if (cmd.table_id) {
      const { data: remaining } = await supabase
       .from('commandes')
       .select('*')
       .eq('table_id', cmd.table_id)
       .in('statut', ['en_attente', 'en_preparation', 'pret']);
      if (!remaining || remaining.length === 0) {
        await supabase.from('tables').update({ statut: 'libre' }).eq('id', cmd.table_id);
      }
    }

    printReceipt(cmd);
    setPaying(null);
    load();
  };
