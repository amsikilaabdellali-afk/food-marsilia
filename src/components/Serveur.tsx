  const handleSend = async () => {
    if (cartItems.length === 0) return;
    setSending(true);

    try {
      const total = cartTotal;
      console.log('Creating commande...', { table_id: table.id, total });
      
      const { data: cmd, error: cmdError } = await supabase
        .from('commandes')
        .insert({
          table_id: table.id,
          serveur_nom: serveurNom,
          statut: 'en_attente',
          total,
          // Zid hadou bach ma y-fchloch ila kayn NOT NULL
          restaurant_id: (table as any).restaurant_id || null,
          client_nom: `Table ${table.numero}`,
          mode_paiement: 'espece'
        })
        .select()
        .single();

      if (cmdError) {
        console.error('Erreur commande:', cmdError);
        alert('Erreur création commande: ' + cmdError.message);
        setSending(false);
        return;
      }

      if (cmd) {
        console.log('Commande créée:', cmd.id);
        const items = cartItems.map(([menuId, qte]) => {
          const m = menus.find((x) => x.id === menuId)!;
          return {
            commande_id: cmd.id,
            menu_id: menuId,
            menu_nom: m.nom,
            prix: m.prix,
            qte,
            restaurant_id: (table as any).restaurant_id || (m as any).restaurant_id || null,
          };
        });
        
        console.log('Insert items:', items);
        const { data: insertedItems, error: itemsError } = await supabase
          .from('commande_items')
          .insert(items)
          .select();
          
        if (itemsError) {
          console.error('Erreur items:', itemsError);
          alert('Erreur articles: ' + itemsError.message + '\n' + JSON.stringify(itemsError));
        } else {
          console.log('Items insérés:', insertedItems);
        }
        
        await supabase.from('tables').update({ statut: 'en_cours' }).eq('id', table.id);
        printKitchenTicket(cmd.id, table.numero, serveurNom, items);
      }
    } catch (e) {
      console.error(e);
      alert('Erreur: ' + e);
    }

    setSending(false);
    onBack();
  };
