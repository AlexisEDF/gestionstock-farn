// ==========================================
// --- 1. BASE DE DONNÉES FIREBASE (TEMPS RÉEL) ---
// ==========================================

// 1. On donne les clés de la maison à l'ordinateur
const firebaseConfig = {
    apiKey: "AIzaSyCK0Mhu9aK0WUdYodmqwONJt7QuyEZwIJ8",
    authDomain: "stock-farn.firebaseapp.com",
    databaseURL: "https://stock-farn-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "stock-farn",
    storageBucket: "stock-farn.firebasestorage.app",
    messagingSenderId: "771346813248",
    appId: "1:771346813248:web:27b7fd427d4a12f32aaaa5"
  };
  
  // 2. On allume Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();
  
  // 3. Nos variables de stock (vides au départ)
  let baseDeStock = [];
  let historiqueSorties = [];
  let historiqueEntrees = [];
  
  // 4. 💡 LA MAGIE DU TEMPS RÉEL : On écoute la base de données !
  // Dès que Firebase détecte un changement, il met à jour l'écran tout seul.
  db.ref('farn_stock').on('value', (snapshot) => {
      baseDeStock = snapshot.val() || [];
      afficherTableau(); // On redessine le tableau
  });
  
  db.ref('farn_sorties').on('value', (snapshot) => {
      historiqueSorties = snapshot.val() || [];
      afficherHistoriques();
  });
  
  db.ref('farn_entrees').on('value', (snapshot) => {
      historiqueEntrees = snapshot.val() || [];
      afficherHistoriques();
  });
  
  // 5. Fonction pour ENVOYER les données vers le Cloud (remplace le vieux localStorage)
  function sauvegarderDonnees() {
      db.ref('farn_stock').set(baseDeStock);
      db.ref('farn_sorties').set(historiqueSorties);
      db.ref('farn_entrees').set(historiqueEntrees);
  }
  
// ==========================================
// --- 2. AFFICHAGE DES TABLEAUX ET STATS ---
// ==========================================
function afficherTableau() {
    let tbody = document.getElementById('tableau-stock');
    tbody.innerHTML = ""; 

    for(let i = 0; i < baseDeStock.length; i++) {
        let produit = baseDeStock[i];
        let couleurQuantite = "stock-ok"; 
        if (produit.qty < produit.seuil) couleurQuantite = "stock-alerte"; 

        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${produit.code}</strong></td>
            <td>${produit.des}</td>
            <td class="${couleurQuantite}">${produit.qty}</td>
            <td>${produit.seuil}</td>
            <td>${produit.loc}</td>
        `;
        tbody.appendChild(tr);
    }
    mettreAJourStatistiques();
}

function mettreAJourStatistiques() {
    document.getElementById('stat-total').innerText = baseDeStock.length;
    let alertes = baseDeStock.filter(produit => produit.qty < produit.seuil).length;
    document.getElementById('stat-alertes').innerText = alertes;

    let dateAujourdhui = new Date().toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: 'numeric'});
    let entreesDuJour = historiqueEntrees.filter(h => h.date.includes(dateAujourdhui)).length;
    let sortiesDuJour = historiqueSorties.filter(h => h.date.includes(dateAujourdhui)).length;
    document.getElementById('stat-mouvements').innerText = entreesDuJour + sortiesDuJour;
}

function afficherHistoriques() {
    let filtreEntrees = document.getElementById('filtre-entrees-colonne').value;
    let filtreSorties = document.getElementById('filtre-sorties-colonne').value;

    let tbodyEntrees = document.getElementById('tableau-entrees');
    tbodyEntrees.innerHTML = "";
    for(let i = historiqueEntrees.length - 1; i >= 0; i--) {
        let h = historiqueEntrees[i]; let col = h.colonne || "-"; 
        if (filtreEntrees === "TOUS" || col.toString() === filtreEntrees) {
            let tr = document.createElement('tr');
            tr.innerHTML = `<td>${h.date}</td><td>${h.nom}</td><td><strong>${col}</strong></td><td>${h.code}</td><td><strong>${h.des}</strong></td><td style="color:#38a169; font-weight:bold;">+${h.qty}</td><td>${h.justif}</td>`;
            tbodyEntrees.appendChild(tr);
        }
    }

    let tbodySorties = document.getElementById('tableau-sorties');
    tbodySorties.innerHTML = "";
    for(let i = historiqueSorties.length - 1; i >= 0; i--) {
        let h = historiqueSorties[i]; let col = h.colonne || "-";
        if (filtreSorties === "TOUS" || col.toString() === filtreSorties) {
            let tr = document.createElement('tr');
            tr.innerHTML = `<td>${h.date}</td><td>${h.nom}</td><td><strong>${col}</strong></td><td>${h.code}</td><td><strong>${h.des}</strong></td><td style="color:#e53e3e; font-weight:bold;">-${h.qty}</td><td>${h.justif}</td>`;
            tbodySorties.appendChild(tr);
        }
    }
}

// ==========================================
// --- 3. SORTIE (ROUGE) ---
// ==========================================
var modalSortie = document.getElementById('modal-sortie');

function ouvrirModalSortie() {
    modalSortie.style.display = 'flex';
    document.getElementById('sortie-code').value = ""; document.getElementById('sortie-qty').value = "1"; document.getElementById('sortie-nom').value = ""; document.getElementById('sortie-colonne').value = "1"; document.getElementById('sortie-justif').value = ""; document.getElementById('info-produit-sortie').style.display = 'none'; document.getElementById('erreur-produit-sortie').style.display = 'none'; setTimeout(() => document.getElementById('sortie-code').focus(), 100);
}

function fermerModalSortie() { modalSortie.style.display = 'none'; }

document.getElementById('sortie-code').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); 
        let produitTrouve = baseDeStock.find(item => item.code === this.value);
        if (produitTrouve) {
            document.getElementById('sortie-designation-texte').innerText = produitTrouve.des; document.getElementById('sortie-localisation-texte').innerText = produitTrouve.loc; document.getElementById('sortie-stock-texte').innerText = produitTrouve.qty; document.getElementById('erreur-produit-sortie').style.display = 'none'; document.getElementById('info-produit-sortie').style.display = 'block'; document.getElementById('sortie-qty').focus();
        } else {
            document.getElementById('info-produit-sortie').style.display = 'none'; document.getElementById('erreur-produit-sortie').style.display = 'block';
        }
    }
});

function validerSortie() {
    let codeSaisi = document.getElementById('sortie-code').value; let qtySaisie = parseInt(document.getElementById('sortie-qty').value); let nomSaisi = document.getElementById('sortie-nom').value; let colonneSaisie = document.getElementById('sortie-colonne').value; let justifSaisie = document.getElementById('sortie-justif').value;
    let produit = baseDeStock.find(item => item.code === codeSaisi);

    if (!produit || qtySaisie <= 0 || isNaN(qtySaisie)) { alert("❌ Erreur : Produit ou Quantité invalide."); return; }
    if (produit.qty < qtySaisie) { alert("⚠️ Impossible : Pas assez de stock !"); return; }

    produit.qty -= qtySaisie; 
    let dateFormatee = new Date().toLocaleString('fr-FR', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit'});
    historiqueSorties.push({ date: dateFormatee, nom: nomSaisi || "N/A", colonne: colonneSaisie, code: produit.code, des: produit.des, qty: qtySaisie, justif: justifSaisie || "-" });

    sauvegarderDonnees(); afficherTableau(); afficherHistoriques(); fermerModalSortie();
}

// ==========================================
// --- 4. ENTRÉE (VERTE) ---
// ==========================================
var modalEntree = document.getElementById('modal-entree');

function ouvrirModalEntree() {
    modalEntree.style.display = 'flex';
    document.getElementById('entree-code').value = ""; document.getElementById('entree-qty').value = "1"; document.getElementById('entree-nom').value = ""; document.getElementById('entree-colonne').value = "1"; document.getElementById('entree-justif').value = ""; document.getElementById('info-produit-entree').style.display = 'none'; document.getElementById('erreur-produit-entree').style.display = 'none'; setTimeout(() => document.getElementById('entree-code').focus(), 100);
}

function fermerModalEntree() { modalEntree.style.display = 'none'; }

document.getElementById('entree-code').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); 
        let produitTrouve = baseDeStock.find(item => item.code === this.value);
        if (produitTrouve) {
            document.getElementById('entree-designation-texte').innerText = produitTrouve.des; document.getElementById('entree-localisation-texte').innerText = produitTrouve.loc; document.getElementById('entree-stock-texte').innerText = produitTrouve.qty; document.getElementById('erreur-produit-entree').style.display = 'none'; document.getElementById('info-produit-entree').style.display = 'block'; document.getElementById('entree-qty').focus();
        } else {
            document.getElementById('info-produit-entree').style.display = 'none'; document.getElementById('erreur-produit-entree').style.display = 'block';
        }
    }
});

function validerEntree() {
    let codeSaisi = document.getElementById('entree-code').value; let qtySaisie = parseInt(document.getElementById('entree-qty').value); let nomSaisi = document.getElementById('entree-nom').value; let colonneSaisie = document.getElementById('entree-colonne').value; let justifSaisie = document.getElementById('entree-justif').value;
    let produit = baseDeStock.find(item => item.code === codeSaisi);

    if (!produit || qtySaisie <= 0 || isNaN(qtySaisie)) { alert("❌ Erreur : Produit ou Quantité invalide."); return; }

    produit.qty += qtySaisie; 
    let dateFormatee = new Date().toLocaleString('fr-FR', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit'});
    historiqueEntrees.push({ date: dateFormatee, nom: nomSaisi || "N/A", colonne: colonneSaisie, code: produit.code, des: produit.des, qty: qtySaisie, justif: justifSaisie || "-" });

    sauvegarderDonnees(); afficherTableau(); afficherHistoriques(); fermerModalEntree();
}

// ==========================================
// --- 5. NOUVEAU PRODUIT (ORANGE) ---
// ==========================================
var modalNouveau = document.getElementById('modal-nouveau');

function ouvrirModalNouveau() {
    modalNouveau.style.display = 'flex';
    document.getElementById('nouveau-code').value = ""; document.getElementById('nouveau-des').value = ""; document.getElementById('nouveau-qty').value = "0"; document.getElementById('nouveau-seuil').value = "5"; document.getElementById('nouveau-loc').value = ""; setTimeout(() => document.getElementById('nouveau-code').focus(), 100);
}

function fermerModalNouveau() { modalNouveau.style.display = 'none'; }

function validerNouveau() {
    let codeSaisi = document.getElementById('nouveau-code').value.trim(); let desSaisie = document.getElementById('nouveau-des').value.trim(); let qtySaisie = parseInt(document.getElementById('nouveau-qty').value); let seuilSaisi = parseInt(document.getElementById('nouveau-seuil').value); let locSaisie = document.getElementById('nouveau-loc').value.trim();

    if (codeSaisi === "" || desSaisie === "") { alert("❌ Erreur : Code et désignation obligatoires."); return; }
    if (isNaN(qtySaisie) || qtySaisie < 0 || isNaN(seuilSaisi) || seuilSaisi < 0) { alert("❌ Erreur : Quantités invalides."); return; }
    if (baseDeStock.find(item => item.code === codeSaisi)) { alert("⚠️ Ce code existe déjà !"); return; }

    baseDeStock.push({ code: codeSaisi, des: desSaisie.toUpperCase(), qty: qtySaisie, seuil: seuilSaisi, loc: locSaisie });
    sauvegarderDonnees(); afficherTableau(); fermerModalNouveau();
}

// ==========================================
// --- 6. SUPPRIMER PRODUIT (ROUGE FONCÉ) ---
// ==========================================
var modalSupprimer = document.getElementById('modal-supprimer');
var btnConfirmerSuppression = document.getElementById('btn-confirmer-suppression');

function ouvrirModalSupprimer() {
    modalSupprimer.style.display = 'flex';
    document.getElementById('supprimer-code').value = ""; document.getElementById('info-produit-supprimer').style.display = 'none'; document.getElementById('erreur-produit-supprimer').style.display = 'none'; btnConfirmerSuppression.classList.remove('actif'); btnConfirmerSuppression.disabled = true; setTimeout(() => document.getElementById('supprimer-code').focus(), 100);
}

function fermerModalSupprimer() { modalSupprimer.style.display = 'none'; }

document.getElementById('supprimer-code').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); 
        let produitTrouve = baseDeStock.find(item => item.code === this.value);
        if (produitTrouve) {
            document.getElementById('supprimer-designation-texte').innerText = produitTrouve.des; document.getElementById('supprimer-stock-texte').innerText = produitTrouve.qty; document.getElementById('erreur-produit-supprimer').style.display = 'none'; document.getElementById('info-produit-supprimer').style.display = 'block'; btnConfirmerSuppression.classList.add('actif'); btnConfirmerSuppression.disabled = false;
        } else {
            document.getElementById('info-produit-supprimer').style.display = 'none'; document.getElementById('erreur-produit-supprimer').style.display = 'block'; btnConfirmerSuppression.classList.remove('actif'); btnConfirmerSuppression.disabled = true;
        }
    }
});

function validerSupprimer() {
    let codeSaisi = document.getElementById('supprimer-code').value;
    let index = baseDeStock.findIndex(item => item.code === codeSaisi);
    
    if (index !== -1 && confirm("Êtes-vous sûr de vouloir supprimer DÉFINITIVEMENT ce produit ET tout son historique ?")) {
        baseDeStock.splice(index, 1);
        historiqueEntrees = historiqueEntrees.filter(h => h.code !== codeSaisi);
        historiqueSorties = historiqueSorties.filter(h => h.code !== codeSaisi);
        sauvegarderDonnees(); afficherTableau(); afficherHistoriques(); fermerModalSupprimer();
    }
}

// ==========================================
// --- 7. ÉDITEUR DE COMMANDE (BLEU) ---
// ==========================================
var modalCommande = document.getElementById('modal-commande');

function ouvrirModalCommande() {
    modalCommande.style.display = 'flex';
    
    // On charge la mémoire pour faire gagner du temps
    document.getElementById('cmd-num').value = ""; 
    document.getElementById('cmd-fournisseur').value = localStorage.getItem('farn_fournisseur') || "";
    document.getElementById('cmd-adresse').value = localStorage.getItem('farn_adresse') || "";
    document.getElementById('cmd-tel').value = localStorage.getItem('farn_tel') || "";
    document.getElementById('cmd-livraison').value = localStorage.getItem('farn_livraison') || "";

    let tbody = document.getElementById('tbody-articles-commande');
    tbody.innerHTML = "";

    // On trie : les alertes en premier
    let stockTrie = [...baseDeStock].sort((a, b) => {
        let alerteA = (a.qty < a.seuil) ? -1 : 1;
        let alerteB = (b.qty < b.seuil) ? -1 : 1;
        return alerteA - alerteB;
    });

    stockTrie.forEach(p => {
        let qteSuggeree = (p.qty < p.seuil) ? (p.seuil - p.qty) : 0; 
        let isAlert = (p.qty < p.seuil) ? "color: #e53e3e; font-weight:bold;" : "";

        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 6px; border-bottom: 1px solid #eee;">${p.code}</td>
            <td style="padding: 6px; border-bottom: 1px solid #eee;"><strong>${p.des}</strong></td>
            <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: center; ${isAlert}">${p.qty} / ${p.seuil}</td>
            <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: center;">
                <input type="number" id="cmd-qty-${p.code}" value="${qteSuggeree}" min="0" style="width: 70px; text-align: center; border: 2px solid #3182ce; border-radius: 4px; padding: 5px;">
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function fermerModalCommande() { modalCommande.style.display = 'none'; }

function validerImpressionCommande() {
    let numCmd = document.getElementById('cmd-num').value || "..................";
    let fournisseur = document.getElementById('cmd-fournisseur').value || "...................................";
    let adresse = document.getElementById('cmd-adresse').value || "...................................";
    let tel = document.getElementById('cmd-tel').value || "...................................";
    let livraison = document.getElementById('cmd-livraison').value || ".................................................................";

    // Sauvegarde en mémoire locale
    localStorage.setItem('farn_fournisseur', fournisseur);
    localStorage.setItem('farn_adresse', adresse);
    localStorage.setItem('farn_tel', tel);
    localStorage.setItem('farn_livraison', livraison); 

    let articlesACommander = [];
    baseDeStock.forEach(p => {
        let inputQte = document.getElementById(`cmd-qty-${p.code}`);
        if (inputQte) {
            let val = parseInt(inputQte.value);
            if (val > 0) {
                articlesACommander.push({ code: p.code, des: p.des, qtyToOrder: val });
            }
        }
    });

    if (articlesACommander.length === 0) { alert("❌ Vous devez indiquer une quantité > 0 pour au moins un produit !"); return; }

    let printWindow = window.open('', '_blank');
    let dateDuJour = new Date().toLocaleDateString('fr-FR');
    
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Bon de Commande - EDF</title>
            <style>
                @page { size: A4 portrait; margin: 5mm; }
                body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; font-size: 11px; color: #000; box-sizing: border-box; }
                .page-border { border: 4px double #000; padding: 10px; height: 260mm; box-sizing: border-box; display: flex; flex-direction: column; overflow: hidden; margin: 0 auto; max-width: 190mm; }
                .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
                .logo-container { width: 30%; }
                .logo-container img { max-height: 45px; } 
                .title-container { width: 40%; text-align: center; }
                .title-container h2 { margin: 0; font-size: 16px; font-style: italic; font-weight: bold; }
                .date-container { width: 30%; text-align: right; font-weight: bold; margin-top: 10px; }
                .adresses { display: flex; border: 2px solid #000; margin-bottom: 10px; }
                .adr-gauche { width: 45%; border-right: 2px solid #000; padding: 8px; line-height: 1.4; }
                .adr-droite { width: 55%; padding: 8px; }
                .adr-droite table { width: 100%; border: none; font-size: 11px; }
                .adr-droite td { padding: 2px 0; vertical-align: top; border: none; }
                .table-container { flex-grow: 1; } 
                table.main-table { width: 100%; border-collapse: collapse; border: 2px solid #000; }
                table.main-table th, table.main-table td { border: 1px solid #000; padding: 3px 5px; }
                table.main-table th { background-color: #e2e8f0; font-weight: bold; text-align: center; border: 2px solid #000; }
                table.main-table td { height: 18px; } 
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .footer-grid { display: flex; justify-content: space-between; margin-top: 5px; }
                .conditions { font-size: 11px; font-weight: bold; line-height: 1.6; }
                .totaux { width: 280px; }
                table.totaux-table { width: 100%; border-collapse: collapse; border: 2px solid #000; margin-bottom: 4px; }
                table.totaux-table td { border: 1px solid #000; padding: 2px 5px; font-size: 11px; }
            </style>
        </head>
        <body>
            <div class="page-border">
                <div class="header">
                    <div class="logo-container"><img src="logo-edf.png" alt="EDF Logo"></div>
                    <div class="title-container"><h2>Bon de commande n° ${numCmd}</h2></div>
                    <div class="date-container">Date : ${dateDuJour}</div>
                </div>
                
                <div class="adresses">
                    <div class="adr-gauche">
                        <strong>EDF PALUEL</strong><br><br>
                        xxx<br>xxx<br>xxx<br>xxx<br>xxx
                    </div>
                    <div class="adr-droite">
                        <table>
                            <tr><td style="width: 80px;"><strong>A :</strong></td><td><strong>${fournisseur}</strong></td></tr>
                            <tr><td><strong>Adresse :</strong></td><td>${adresse}</td></tr>
                            <tr><td><strong>Téléphone :</strong></td><td>${tel}</td></tr>
                            <tr><td><strong>Adresse de<br>livraison :</strong></td><td>${livraison}</td></tr>
                        </table>
                    </div>
                </div>
                
                <div class="table-container">
                    <table class="main-table">
                        <thead>
                            <tr>
                                <th style="width: 12%;">Référence</th>
                                <th style="width: 43%;">Description</th>
                                <th style="width: 10%;">PU HT €</th>
                                <th style="width: 10%;">Quantité</th>
                                <th style="width: 15%;">Montant HT</th>
                                <th style="width: 10%;">Taux TVA</th>
                            </tr>
                        </thead>
                        <tbody>
    `;

    const TOTAL_LIGNES = 18; 
    for(let i = 0; i < TOTAL_LIGNES; i++) {
        if (i < articlesACommander.length) {
            let art = articlesACommander[i];
            html += `<tr><td class="text-center">${art.code}</td><td>${art.des}</td><td></td><td class="text-right">${art.qtyToOrder},0</td><td></td><td></td></tr>`;
        } else {
            html += `<tr><td></td><td></td><td></td><td></td><td></td><td></td></tr>`;
        }
    }

    html += `
                        </tbody>
                    </table>
                </div>
                
                <div class="footer-grid">
                    <div class="conditions">Échéance : <span style="font-weight: normal;">paiement à 30 jours</span><br>Règlement : <span style="font-weight: normal;">virement</span></div>
                    <div class="totaux">
                        <table class="totaux-table">
                            <tr><td rowspan="2" class="text-center" style="font-weight: bold; font-size: 14px; vertical-align: middle;">TOTAL €</td><td class="text-center">HT</td><td class="text-right">0,00</td></tr>
                            <tr><td class="text-center"><strong>TTC</strong></td><td class="text-right"><strong>0,00</strong></td></tr>
                        </table>
                        <table class="totaux-table">
                            <tr><td style="width: 60%; font-style: italic;">TVA à 5,5% :</td><td class="text-right">-</td></tr>
                            <tr><td style="font-style: italic;">TVA à 10% :</td><td class="text-right">-</td></tr>
                            <tr><td style="font-style: italic;">TVA à 20% :</td><td class="text-right">-</td></tr>
                            <tr><td><strong>Total TVA :</strong></td><td class="text-right"><strong>-</strong></td></tr>
                        </table>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
    fermerModalCommande();
}


// ==========================================
// --- 9. MODIFIER PRODUIT (BLEU CLAIR) ---
// ==========================================
var modalModifier = document.getElementById('modal-modifier');
var btnConfirmerModification = document.getElementById('btn-confirmer-modification');

function ouvrirModalModifier() {
    modalModifier.style.display = 'flex';
    document.getElementById('modifier-code').value = "";
    document.getElementById('formulaire-modifier').style.display = 'none';
    document.getElementById('erreur-produit-modifier').style.display = 'none';
    btnConfirmerModification.classList.remove('actif');
    btnConfirmerModification.disabled = true;
    setTimeout(() => document.getElementById('modifier-code').focus(), 100);
}

function fermerModalModifier() { 
    modalModifier.style.display = 'none'; 
}

// Recherche du produit quand on tape "Entrée"
document.getElementById('modifier-code').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); 
        let produitTrouve = baseDeStock.find(item => item.code === this.value);
        
        if (produitTrouve) {
            // On pré-remplit les cases avec les infos actuelles du produit !
            document.getElementById('modifier-des').value = produitTrouve.des;
            document.getElementById('modifier-seuil').value = produitTrouve.seuil;
            document.getElementById('modifier-loc').value = produitTrouve.loc;
            
            document.getElementById('erreur-produit-modifier').style.display = 'none';
            document.getElementById('formulaire-modifier').style.display = 'block';
            btnConfirmerModification.classList.add('actif');
            btnConfirmerModification.disabled = false;
            document.getElementById('modifier-des').focus();
        } else {
            document.getElementById('formulaire-modifier').style.display = 'none';
            document.getElementById('erreur-produit-modifier').style.display = 'block';
            btnConfirmerModification.classList.remove('actif');
            btnConfirmerModification.disabled = true;
        }
    }
});

// Sauvegarde des nouvelles informations
function validerModifier() {
    let codeSaisi = document.getElementById('modifier-code').value;
    let index = baseDeStock.findIndex(item => item.code === codeSaisi);
    
    if (index !== -1) {
        let nouvelleDes = document.getElementById('modifier-des').value.trim();
        let nouveauSeuil = parseInt(document.getElementById('modifier-seuil').value);
        let nouvelleLoc = document.getElementById('modifier-loc').value.trim();

        if (nouvelleDes === "" || isNaN(nouveauSeuil) || nouveauSeuil < 0) {
            alert("❌ Erreur : Informations invalides.");
            return;
        }

        // 1. On met à jour la base de données
        baseDeStock[index].des = nouvelleDes.toUpperCase();
        baseDeStock[index].seuil = nouveauSeuil;
        baseDeStock[index].loc = nouvelleLoc;

        // 2. 💡 MAGIE : On corrige aussi le nom du produit dans les historiques passés !
        historiqueEntrees.forEach(h => { if(h.code === codeSaisi) h.des = nouvelleDes.toUpperCase(); });
        historiqueSorties.forEach(h => { if(h.code === codeSaisi) h.des = nouvelleDes.toUpperCase(); });

        // 3. On sauvegarde et on rafraîchit
        sauvegarderDonnees(); 
        afficherTableau();
        afficherHistoriques();
        fermerModalModifier();
    }
}

// ==========================================
// --- DÉMARRAGE ---
// ==========================================
afficherTableau();
afficherHistoriques();