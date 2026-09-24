// ===================================================================
// ===== LOT 1 — MOTEUR DU FORMULAIRE (version clonage) ==============
// ===================================================================

document.addEventListener('DOMContentLoaded', function () {
  window.addEventListener('load', () => {
    const form = document.getElementById('rsvp-form');
    if (form) {
      form.reset();
    }
  });
  const MAX_PERSONNES = 8;

  // Présences donnant droit aux sous-blocs
  const AVEC_REPAS    = ['soir', 'journee', 'retour'];
  const AVEC_LOGEMENT = ['journee', 'retour'];
  const AVEC_AIDE     = ['soir', 'journee', 'retour'];

  // --- Version depuis l'URL ---
  const params = new URLSearchParams(window.location.search);
  let version = (params.get('v') || 'a').toLowerCase();
  if (!['a', 'b', 'c'].includes(version)) version = 'a';

  // --- DOM ---
  const container = document.getElementById('personnes-container');
  const btnAjouter = document.getElementById('btn-ajouter');
  const form = document.getElementById('rsvp-form');
  const endScreen = document.getElementById('end-screen');
  const modele = container ? container.querySelector('.fiche-personne') : null;

  if (!container || !btnAjouter || !form || !modele) {
    console.error('LOT 1 : élément manquant', { container, btnAjouter, modele });
    return;
  }

  // On garde une copie propre de la fiche 1 AVANT toute saisie utilisateur
  const gabarit = modele.cloneNode(true);


  // --- Filtrage des options selon la version -----------------------
function filtrerPresence(fiche) {
  const select = fiche.querySelector('.select-presence');
  if (!select) return;

  select.querySelectorAll('option[data-versions]').forEach(opt => {
    const versions = opt.getAttribute('data-versions').split(' ');
    if (!versions.includes(version)) opt.remove();
  });
}

  // --- Affichage conditionnel repas / logement ---------------------
  function majConditionnels(fiche) {
    const select = fiche.querySelector('.select-presence');
    if (!select) return;
    const val = select.value;

    fiche.querySelectorAll('.conditionnel').forEach(bloc => {
      const type = bloc.getAttribute('data-show-if');
      let visible = false;
      if (type === 'repas')    visible = AVEC_REPAS.includes(val);
      if (type === 'logement') visible = AVEC_LOGEMENT.includes(val);
      if (type === 'aide')     visible = AVEC_AIDE.includes(val);
      bloc.classList.toggle('hidden', !visible);
    });
  }

  // --- Renumérotation complète (noms, ids, labels, titres) ---------
  function renumeroter() {
    const fiches = container.querySelectorAll('.fiche-personne');

    fiches.forEach((fiche, i) => {
      const n = i + 1;
      fiche.setAttribute('data-index', n);

      const titre = fiche.querySelector('.fiche-numero');
      if (titre) titre.textContent = 'Personne ' + n;

      // Champs : name="pX_qqch" et id="pX_qqch"
      fiche.querySelectorAll('input, select, textarea').forEach(champ => {
        ['name', 'id'].forEach(attr => {
          const v = champ.getAttribute(attr);
          if (v && /^p\d+_/.test(v)) {
            champ.setAttribute(attr, v.replace(/^p\d+_/, 'p' + n + '_'));
          }
        });
      });

      // Labels : for="pX_qqch"
      fiche.querySelectorAll('label[for]').forEach(lab => {
        const v = lab.getAttribute('for');
        if (v && /^p\d+_/.test(v)) {
          lab.setAttribute('for', v.replace(/^p\d+_/, 'p' + n + '_'));
        }
      });

      // Le bouton supprimer n'apparaît qu'à partir de la fiche 2
      const btnSup = fiche.querySelector('.btn-supprimer');
      if (btnSup) btnSup.classList.toggle('hidden', n === 1);
    });

    // État du bouton d'ajout
    const total = fiches.length;
    btnAjouter.disabled = (total >= MAX_PERSONNES);
    btnAjouter.textContent = (total >= MAX_PERSONNES)
      ? 'Maximum atteint (' + MAX_PERSONNES + ' personnes)'
      : '+ Ajouter une personne';
  }
// --- Stroboscope écran de fin -------------------------------------
const IMAGES_FIN = [
  'images/mariagefamille.png',
  'images/mariagelicorne.png',
  'images/mariageaquaponey.png',
  'images/mariagenain.png'
];

const CYCLES_FIN = 3;
const DELAI_FIN  = 500;

IMAGES_FIN.forEach(src => { new Image().src = src; });

function lancerStroboscope() {
  const img = document.getElementById('img-fin');
  if (!img) return;
  let i = 0;
  const total = IMAGES_FIN.length * CYCLES_FIN;
  const timer = setInterval(() => {
    i++;
    if (i >= total) {
      clearInterval(timer);
      img.src = IMAGES_FIN[0];
      return;
    }
    img.src = IMAGES_FIN[i % IMAGES_FIN.length];
  }, DELAI_FIN);
}
// --- Guides visuels dynamiques -------------------------------------
const guidePere = document.getElementById('guide-pere');
const guideMere = document.getElementById('guide-mere');

const ETATS_GUIDE = {
  defaut:  { pere: 'images/pereparici.png',   mere: 'images/mereparici.png' },
  licorne: { pere: 'images/perelicorne.png',  mere: 'images/merelicorne.png' },
  nain:    { pere: 'images/perenain.png',     mere: 'images/merenaine.png' },
  regime:  { pere: 'images/enfantvegan.png',  mere: 'images/enfantvegan.png' },
  aquaponey:  { pere: 'images/filleaquaponey.png',  mere: 'images/filsaquaponey.png' },
  chanson: { pere: 'images/peredanse.gif',    mere: 'images/chatclac.gif' }
};

let regimeActif = false;

// Vrai des qu'au moins une fiche a le genre "licorne"
function licorneChoisie() {
  return Array.from(document.querySelectorAll('#personnes-container [id$="_genre"]'))
              .some(select => select.value === 'licorne');
}
function nainChoisie() {
  return Array.from(document.querySelectorAll('#personnes-container [id$="_genre"]'))
              .some(select => select.value === 'nain');
}
function aquaponeyChoisi() {
  return Array.from(document.querySelectorAll('.select-presence'))
              .some(select => select.value === 'absent');
}
function majGuides() {
  const chansonRemplie = Array.from(
    document.querySelectorAll('[id$="_chanson1"], [id$="_chanson2"]')
  ).some(input => input.value.trim().length > 0);

  let etat = 'defaut';
  if      (regimeActif)      etat = 'regime';
  else if (chansonRemplie)   etat = 'chanson';
  else if (aquaponeyChoisi())   etat = 'aquaponey';
  else if (nainChoisie())    etat = 'nain';
  else if (licorneChoisie()) etat = 'licorne';

  if (guidePere) guidePere.src = ETATS_GUIDE[etat].pere;
  if (guideMere) guideMere.src = ETATS_GUIDE[etat].mere;
const enChanson = (etat === 'chanson');
const guideFils  = document.getElementById('guide-fils');
const guideFille = document.getElementById('guide-fille');
  if (guideFils)  guideFils.classList.toggle('hidden', !enChanson);
  if (guideFille) guideFille.classList.toggle('hidden', !enChanson);
}

function brancherGuide(fiche) {
  const selectGenre = fiche.querySelector('[id$="_genre"]');
  if (selectGenre) selectGenre.addEventListener('change', majGuides);

  const selectRegime = fiche.querySelector('[id$="_regime"]');
  if (!selectRegime) return;

  selectRegime.addEventListener('focus', () => {
    regimeActif = true;
    majGuides();
  });
  selectRegime.addEventListener('blur', () => {
    regimeActif = false;
    majGuides();
  });
}


// --- Branchement des écouteurs sur une fiche ---------------------
function brancher(fiche) {
  brancherGuide(fiche);

  const select = fiche.querySelector('.select-presence');
  if (select) {
    select.addEventListener('change', function () {
      majConditionnels(fiche);
      majGuides();
    });
  }
fiche.querySelectorAll('[id$="_chanson1"], [id$="_chanson2"]').forEach(input => {
  input.addEventListener('input', majGuides);
});
  const btnSup = fiche.querySelector('.btn-supprimer');
  if (btnSup) {
    btnSup.addEventListener('click', () => {
      fiche.remove();
      renumeroter();

      majGuides(); // au cas où la fiche supprimée était la seule "licorne"
    });
  }
}

  // --- Ajout d'une personne ----------------------------------------
  btnAjouter.addEventListener('click', function () {
    const total = container.querySelectorAll('.fiche-personne').length;
    if (total >= MAX_PERSONNES) return;

    const nouvelle = gabarit.cloneNode(true);

    // On repart d'une fiche vierge
    nouvelle.querySelectorAll('input').forEach(i => i.value = '');
    nouvelle.querySelectorAll('select').forEach(s => s.selectedIndex = 0);
    nouvelle.querySelectorAll('.conditionnel').forEach(c => c.classList.add('hidden'));

    filtrerPresence(nouvelle);
    container.appendChild(nouvelle);
    brancher(nouvelle);
    renumeroter();

    nouvelle.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });


  // --- Neutralisation des champs masqués avant envoi ---------------
  function desactiverMasques() {
    container.querySelectorAll('.conditionnel.hidden').forEach(bloc => {
      bloc.querySelectorAll('input, select, textarea')
          .forEach(c => c.disabled = true);
    });
  }
  function reactiverTout() {
    container.querySelectorAll('input, select, textarea')
             .forEach(c => c.disabled = false);
  }
  // --- Envoi --------------------------------------------------------
function construirePayload() {
  const data = {};
  data['version'] = version;
  data['date_envoi'] = new Date().toISOString();

  const fiches = container.querySelectorAll('.fiche-personne');
  data['nb_personnes'] = fiches.length;

  fiches.forEach((fiche, i) => {
    const n = i + 1;
    const get = suffixe => {
      const champ = fiche.querySelector('#p' + n + '_' + suffixe);
      return champ && !champ.disabled ? champ.value.trim() : '';
    };

    const presence = get('presence');
    const vientVraiment = (presence === 'soir' || presence === 'journee' || presence === 'retour');
    const aide = vientVraiment ? get('aide') : '';

    data['p' + n + '_prenom']        = get('prenom');
    data['p' + n + '_nom']           = get('nom');
    data['p' + n + '_genre']         = get('genre');
    data['p' + n + '_email']         = get('email');
    data['p' + n + '_tel']           = get('tel');
    data['p' + n + '_presence']      = presence;
    data['p' + n + '_regime']        = get('regime');
    data['p' + n + '_allergies']     = get('allergies');
    data['p' + n + '_logement']      = get('logement');
    data['p' + n + '_aide']          = aide;
    data['p' + n + '_chanson1']      = get('chanson1');
    data['p' + n + '_chanson2']      = get('chanson2');
  });
// --- Commentaire général de la famille ---
  const champCommentaire = document.getElementById('commentaire');
  data['commentaire'] = champCommentaire ? champCommentaire.value.trim() : '';
  return data;
}
  // --- Envoi en arrière-plan vers FormBold -------------------------
  let envoiEnCours = false;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (envoiEnCours) return;
    envoiEnCours = true;

    desactiverMasques();

    const btnEnvoi = form.querySelector('button[type="submit"]');
    const texteInitial = btnEnvoi ? btnEnvoi.textContent : '';
    if (btnEnvoi) {
      btnEnvoi.disabled = true;
      btnEnvoi.textContent = 'Envoi en cours…';
    }

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        form.classList.add('hidden');
        if (endScreen) endScreen.classList.remove('hidden');
        lancerStroboscope();
      })
      .catch(function (err) {
        envoiEnCours = false;
        if (btnEnvoi) {
          btnEnvoi.disabled = false;
          btnEnvoi.textContent = texteInitial;
        }
        reactiverTout();
        console.error('Envoi échoué :', err);
        alert("L'envoi a échoué. Vérifiez votre connexion et réessayez.");
      });
  });

/* ===================================================================
 * FOND ANIMÉ — module isolé, décoratif et non interactif
 * =================================================================== */
(function initFondAnime() {
  const fond = document.getElementById('fond-anime');
  if (!fond || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const MAX_ELEMENTS = 34;
  const INTERVAL_MS = 420;
  const SYMBOLS = ['😻', '🎮', '🦄', '🃏', '🍷', '🥳'];
  let timerId = null;
  let paused = document.hidden;

  function createElement() {
    if (paused || fond.childElementCount >= MAX_ELEMENTS) return;

    const item = document.createElement('span');
    item.className = 'fond-anime-element';
    item.setAttribute('aria-hidden', 'true');
    item.textContent = Math.random() < 0.8 ? '❤️' : SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    item.style.left = `${Math.random() * 100}%`;
    item.style.fontSize = `${1.1 + Math.random() * 1.3}rem`;
    item.style.setProperty('--fall-duration', `${6 + Math.random() * 4}s`);
    item.addEventListener('animationend', () => item.remove(), { once: true });
    fond.appendChild(item);
  }

  function updateVisibility() {
    paused = document.hidden;
    if (paused) {
      if (timerId !== null) { clearInterval(timerId); timerId = null; }
      return;
    }
    if (timerId === null) timerId = window.setInterval(createElement, INTERVAL_MS);
  }

  document.addEventListener('visibilitychange', updateVisibility);
  updateVisibility();
})();
  // --- Report de la version dans le champ caché --------------------
  const inputVersion = document.getElementById('input-version');
  if (inputVersion) inputVersion.value = version;
  filtrerPresence(modele);
  brancher(modele);
  majConditionnels(modele);
  renumeroter();
  majGuides();
});
