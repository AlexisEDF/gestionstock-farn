// ==========================================
// --- DÉMARRAGE DU MODE APPLICATION (PWA) ---
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log('Erreur PWA :', err));
    });
}

// ==========================================
// --- 1. FIREBASE & AUTHENTIFICATION ---
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyCK0Mhu9aK0WUdYodmqwONJt7QuyEZwIJ8",
    authDomain: "stock-farn.firebaseapp.com",
    databaseURL: "https://stock-farn-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "stock-farn",
    storageBucket: "stock-farn.firebasestorage.app",
    messagingSenderId: "771346813248",
    appId: "1:771346813248:web:27b7fd427d4a12f32aaaa5"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

let baseDeStock = [];
let historiqueSorties = [];
let historiqueEntrees = [];

// Le vigile de sécurité
auth.onAuthStateChanged((user) => {
    if (user) {
        document.getElementById('ecran-connexion').style.display = 'none';
        chargerLesDonneesDepuisLeCloud();
    } else {
        document.getElementById('ecran-connexion').style.display = 'flex';
    }
});

function seConnecter() {
    let pseudoSaisi = document.getElementById('login-username').value.trim();
    let mdp = document.getElementById('login-mdp').value;
    let fauxEmailFirebase = pseudoSaisi + "@farn.fr"; // L'astuce magique !
    
    auth.signInWithEmailAndPassword(fauxEmailFirebase, mdp)
        .catch((error) => {
            document.getElementById('erreur-connexion').style.display = 'block';
        });
}

function seDeconnecter() {
    auth.signOut().then(() => window.location.reload());
}

// ==========================================
// --- 2. BASE DE DONNÉES EN TEMPS RÉEL ---
// ==========================================
function chargerLesDonneesDepuisLeCloud() {
    db.ref('farn_stock').on('value', (snapshot) => {
        baseDeStock = snapshot.val() || [];
        afficherTableau(); 
    });
    db.ref('farn_sorties').on('value', (snapshot) => {
        historiqueSorties = snapshot.val() || [];
        afficherHistoriques();
    });
    db.ref('farn_entrees').on('value', (snapshot) => {
        historiqueEntrees = snapshot.val() || [];
        afficherHistoriques();
    });
}

function sauvegarderDonnees() {
    db.ref('farn_stock').set(baseDeStock);
    db.ref('farn_sorties').set(historiqueSorties);
    db.ref('farn_entrees').set(historiqueEntrees);
}

// ==========================================
// --- 3. AFFICHAGE DES TABLEAUX ---
// ==========================================
function afficherTableau() {
    let tbody = document.getElementById('tableau-stock');
    tbody.innerHTML = ""; 

    for(let i = 0; i < baseDeStock.length; i++) {
        let produit = baseDeStock[i];
        let couleurQuantite = (produit.qty < produit.seuil) ? "stock-alerte" : "stock-ok"; 

        let tr = document.createElement('tr');
        tr.innerHTML = `<td><strong>${produit.code}</strong></td><td>${produit.des}</td><td class="${couleurQuantite}">${produit.qty}</td><td>${produit.seuil}</td><td>${produit.loc}</td>`;
        tbody.appendChild(tr);
    }
    mettreAJourStatistiques();
}

function mettreAJourStatistiques() {
    document.getElementById('stat-total').innerText = baseDeStock.length;
    document.getElementById('stat-alertes').innerText = baseDeStock.filter(p => p.qty < p.seuil).length;
    let dateAuj = new Date().toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: 'numeric'});
    document.getElementById('stat-mouvements').innerText = historiqueEntrees.filter(h => h.date.includes(dateAuj)).length + historiqueSorties.filter(h => h.date.includes(dateAuj)).length;
}

function afficherHistoriques() {
    let filtreE = document.getElementById('filtre-entrees-colonne').value;
    let filtreS = document.getElementById('filtre-sorties-colonne').value;

    document.getElementById('tableau-entrees').innerHTML = historiqueEntrees.slice().reverse().filter(h => filtreE === "TOUS" || (h.colonne || "-").toString() === filtreE)
        .map(h => `<tr><td>${h.date}</td><td>${h.nom}</td><td><strong>${h.colonne||"-"}</strong></td><td>${h.code}</td><td><strong>${h.des}</strong></td><td style="color:#38a169;">+${h.qty}</td><td>${h.justif}</td></tr>`).join("");

    document.getElementById('tableau-sorties').innerHTML = historiqueSorties.slice().reverse().filter(h => filtreS === "TOUS" || (h.colonne || "-").toString() === filtreS)
        .map(h => `<tr><td>${h.date}</td><td>${h.nom}</td><td><strong>${h.colonne||"-"}</strong></td><td>${h.code}</td><td><strong>${h.des}</strong></td><td style="color:#e53e3e;">-${h.qty}</td><td>${h.justif}</td></tr>`).join("");
}

// ==========================================
// --- 4. GESTION DES MODALES & ACTIONS ---
// ==========================================
// OUTILS COMMUNS
function configurerModalRecherche(inputId, btnId, boxInfoId, boxErrId, fillDataFunc) {
    document.getElementById(inputId).addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            let produit = baseDeStock.find(item => item.code === this.value);
            if (produit) {
                fillDataFunc(produit);
                document.getElementById(boxErrId).style.display = 'none';
                document.getElementById(boxInfoId).style.display = 'block';
                if(btnId) { document.getElementById(btnId).disabled = false; document.getElementById(btnId).classList.add('actif'); }
            } else {
                document.getElementById(boxInfoId).style.display = 'none';
                document.getElementById(boxErrId).style.display = 'block';
                if(btnId) { document.getElementById(btnId).disabled = true; document.getElementById(btnId).classList.remove('actif'); }
            }
        }
    });
}

// SORTIE
function ouvrirModalSortie() { document.getElementById('modal-sortie').style.display = 'flex'; document.getElementById('sortie-code').value = ""; document.getElementById('info-produit-sortie').style.display = 'none'; setTimeout(() => document.getElementById('sortie-code').focus(), 100); }
function fermerModalSortie() { document.getElementById('modal-sortie').style.display = 'none'; }
configurerModalRecherche('sortie-code', null, 'info-produit-sortie', 'erreur-produit-sortie', p => {
    document.getElementById('sortie-designation-texte').innerText = p.des; document.getElementById('sortie-stock-texte').innerText = p.qty; document.getElementById('sortie-qty').focus();
});
function validerSortie() {
    let produit = baseDeStock.find(item => item.code === document.getElementById('sortie-code').value);
    let qty = parseInt(document.getElementById('sortie-qty').value);
    if (!produit || isNaN(qty) || qty <= 0) return alert("Produit ou quantité invalide.");
    if (produit.qty < qty) return alert("Pas assez de stock !");
    produit.qty -= qty;
    historiqueSorties.push({ date: new Date().toLocaleString('fr-FR'), nom: document.getElementById('sortie-nom').value || "N/A", colonne: document.getElementById('sortie-colonne').value, code: produit.code, des: produit.des, qty: qty, justif: document.getElementById('sortie-justif').value || "-" });
    sauvegarderDonnees(); fermerModalSortie();
}

// ENTREE
function ouvrirModalEntree() { document.getElementById('modal-entree').style.display = 'flex'; document.getElementById('entree-code').value = ""; document.getElementById('info-produit-entree').style.display = 'none'; setTimeout(() => document.getElementById('entree-code').focus(), 100); }
function fermerModalEntree() { document.getElementById('modal-entree').style.display = 'none'; }
configurerModalRecherche('entree-code', null, 'info-produit-entree', 'erreur-produit-entree', p => {
    document.getElementById('entree-designation-texte').innerText = p.des; document.getElementById('entree-qty').focus();
});
function validerEntree() {
    let produit = baseDeStock.find(item => item.code === document.getElementById('entree-code').value);
    let qty = parseInt(document.getElementById('entree-qty').value);
    if (!produit || isNaN(qty) || qty <= 0) return alert("Produit ou quantité invalide.");
    produit.qty += qty;
    historiqueEntrees.push({ date: new Date().toLocaleString('fr-FR'), nom: document.getElementById('entree-nom').value || "N/A", colonne: document.getElementById('entree-colonne').value, code: produit.code, des: produit.des, qty: qty, justif: document.getElementById('entree-justif').value || "-" });
    sauvegarderDonnees(); fermerModalEntree();
}

// NOUVEAU
function ouvrirModalNouveau() { document.getElementById('modal-nouveau').style.display = 'flex'; document.getElementById('nouveau-code').value = ""; document.getElementById('nouveau-des').value = ""; setTimeout(() => document.getElementById('nouveau-code').focus(), 100); }
function fermerModalNouveau() { document.getElementById('modal-nouveau').style.display = 'none'; }
function validerNouveau() {
    let code = document.getElementById('nouveau-code').value.trim();
    if (code === "" || document.getElementById('nouveau-des').value.trim() === "") return alert("Code et désignation obligatoires.");
    if (baseDeStock.find(item => item.code === code)) return alert("Code déjà existant !");
    baseDeStock.push({ code: code, des: document.getElementById('nouveau-des').value.toUpperCase(), qty: parseInt(document.getElementById('nouveau-qty').value)||0, seuil: parseInt(document.getElementById('nouveau-seuil').value)||0, loc: document.getElementById('nouveau-loc').value });
    sauvegarderDonnees(); fermerModalNouveau();
}

// SUPPRIMER
function ouvrirModalSupprimer() { document.getElementById('modal-supprimer').style.display = 'flex'; document.getElementById('supprimer-code').value = ""; document.getElementById('info-produit-supprimer').style.display = 'none'; document.getElementById('btn-confirmer-suppression').disabled = true; document.getElementById('btn-confirmer-suppression').classList.remove('actif'); setTimeout(() => document.getElementById('supprimer-code').focus(), 100); }
function fermerModalSupprimer() { document.getElementById('modal-supprimer').style.display = 'none'; }
configurerModalRecherche('supprimer-code', 'btn-confirmer-suppression', 'info-produit-supprimer', 'erreur-produit-supprimer', p => { document.getElementById('supprimer-designation-texte').innerText = p.des; });
function validerSupprimer() {
    let code = document.getElementById('supprimer-code').value;
    if (confirm("Supprimer DÉFINITIVEMENT ce produit et son historique ?")) {
        baseDeStock = baseDeStock.filter(item => item.code !== code);
        historiqueEntrees = historiqueEntrees.filter(h => h.code !== code);
        historiqueSorties = historiqueSorties.filter(h => h.code !== code);
        sauvegarderDonnees(); fermerModalSupprimer();
    }
}

// MODIFIER
function ouvrirModalModifier() { document.getElementById('modal-modifier').style.display = 'flex'; document.getElementById('modifier-code').value = ""; document.getElementById('formulaire-modifier').style.display = 'none'; document.getElementById('btn-confirmer-modification').disabled = true; document.getElementById('btn-confirmer-modification').classList.remove('actif'); setTimeout(() => document.getElementById('modifier-code').focus(), 100); }
function fermerModalModifier() { document.getElementById('modal-modifier').style.display = 'none'; }
configurerModalRecherche('modifier-code', 'btn-confirmer-modification', 'formulaire-modifier', 'erreur-produit-modifier', p => {
    document.getElementById('modifier-des').value = p.des; document.getElementById('modifier-seuil').value = p.seuil; document.getElementById('modifier-loc').value = p.loc; document.getElementById('modifier-des').focus();
});
function validerModifier() {
    let code = document.getElementById('modifier-code').value;
    let index = baseDeStock.findIndex(item => item.code === code);
    if (index !== -1) {
        let nDes = document.getElementById('modifier-des').value.toUpperCase();
        baseDeStock[index].des = nDes;
        baseDeStock[index].seuil = parseInt(document.getElementById('modifier-seuil').value)||0;
        baseDeStock[index].loc = document.getElementById('modifier-loc').value;
        historiqueEntrees.forEach(h => { if(h.code === code) h.des = nDes; });
        historiqueSorties.forEach(h => { if(h.code === code) h.des = nDes; });
        sauvegarderDonnees(); fermerModalModifier();
    }
}

// COMMANDE
function ouvrirModalCommande() {
    document.getElementById('modal-commande').style.display = 'flex';
    document.getElementById('cmd-fournisseur').value = localStorage.getItem('farn_fournisseur') || "";
    document.getElementById('cmd-adresse').value = localStorage.getItem('farn_adresse') || "";
    document.getElementById('cmd-tel').value = localStorage.getItem('farn_tel') || "";
    document.getElementById('cmd-livraison').value = localStorage.getItem('farn_livraison') || "";
    let tbody = document.getElementById('tbody-articles-commande');
    tbody.innerHTML = [...baseDeStock].sort((a,b) => (a.qty<a.seuil?-1:1)-(b.qty<b.seuil?-1:1)).map(p => `<tr><td style="padding:6px;border-bottom:1px solid #eee;">${p.code}</td><td style="padding:6px;border-bottom:1px solid #eee;"><strong>${p.des}</strong></td><td style="padding:6px;border-bottom:1px solid #eee;text-align:center;${p.qty<p.seuil?'color:#e53e3e;font-weight:bold;':''}">${p.qty} / ${p.seuil}</td><td style="padding:6px;border-bottom:1px solid #eee;text-align:center;"><input type="number" id="cmd-qty-${p.code}" value="${p.qty<p.seuil?p.seuil-p.qty:0}" min="0" style="width:70px;"></td></tr>`).join("");
}
function fermerModalCommande() { document.getElementById('modal-commande').style.display = 'none'; }
function validerImpressionCommande() {
    localStorage.setItem('farn_fournisseur', document.getElementById('cmd-fournisseur').value);
    localStorage.setItem('farn_adresse', document.getElementById('cmd-adresse').value);
    localStorage.setItem('farn_tel', document.getElementById('cmd-tel').value);
    localStorage.setItem('farn_livraison', document.getElementById('cmd-livraison').value); 
    
    let articles = [];
    baseDeStock.forEach(p => { let i = document.getElementById(`cmd-qty-${p.code}`); if(i && parseInt(i.value)>0) articles.push({code:p.code, des:p.des, qty:parseInt(i.value)}); });
    if(articles.length === 0) return alert("Indiquez au moins 1 article à commander.");

    let html = `<html><body onload="window.print()"><h2 style="text-align:center;">BON DE COMMANDE - FARN</h2><table border="1" width="100%" style="border-collapse:collapse; text-align:center;"><tr><th>Code</th><th>Désignation</th><th>Qté</th></tr>`;
    articles.forEach(a => html += `<tr><td>${a.code}</td><td>${a.des}</td><td>${a.qty}</td></tr>`);
    html += `</table></body></html>`;
    
    let w = window.open(); w.document.write(html); w.document.close();
    fermerModalCommande();
}