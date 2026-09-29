# brahimmahmoudi.com

Site personnel de Brahim Mahmoudi, codé en HTML, CSS et JavaScript, sans framework ni dépendance.

## Structure

```
index.html            Page unique avec toutes les sections
404.html              Page affichée pour une adresse inexistante
assets/css/style.css  Styles (les couleurs sont définies en haut du fichier)
assets/js/main.js     Menu mobile, mode sombre, filtres, copie de citation, visionneuse d'images
assets/img/           Images du site
CNAME                 Domaine utilisé par GitHub Pages
favicon.svg           Icône de l'onglet
```

## Modifier le contenu

Tout le texte est dans `index.html`. Chaque section commence par un commentaire repère, par exemple `<!-- ============ PUBLICATIONS ============ -->`.

- **Ajouter une publication** : copier un bloc `<li class="pub"> ... </li>`, le coller en haut de la liste, puis modifier le texte. `data-type` vaut `conference`, `journal` ou `preprint` (utilisé par les filtres). Le bouton « Copy citation » construit la citation APA à partir des auteurs, de l'année, du titre, du lieu de publication et du premier lien.
- **Ajouter un article de blog** : copier un bloc `<article class="post-card">`.
- **Ajouter un projet** : copier un bloc `<article class="project">`.
- **Changer une image** : placer le fichier dans `assets/img/` et modifier l'attribut `src`.
- **Changer les couleurs** : variables `--brand`, `--brand-2` et `--accent` en haut de `assets/css/style.css`.

Les présentations, posters et rapports sont hébergés sur Google Drive : les fichiers doivent rester partagés en « Tous les utilisateurs disposant du lien ».

## Voir le site en local

```bash
python3 -m http.server 8080
```

Puis ouvrir http://localhost:8080 dans le navigateur.

## Mise en ligne avec GitHub Pages (gratuit)

1. Pousser les fichiers sur le dépôt `Brahim-Mahmoudi.github.io`.
2. Sur GitHub : dépôt > Settings > Pages. Source : branche `main`, dossier `/ (root)`. Custom domain : `www.brahimmahmoudi.com`.
3. Configurer le DNS chez Network Solutions (section suivante).
4. Quand GitHub a créé le certificat, cocher « Enforce HTTPS » dans Settings > Pages.

Ensuite, chaque `git push` met le site à jour en une minute environ.

## DNS chez Network Solutions

Chemin : Domains > brahimmahmoudi.com > Advanced Tools > Advanced DNS Records > Manage.

1. Supprimer ou modifier les enregistrements A existants pour `@` et `www` (ils pointent vers la page de parking de Network Solutions).
2. Ajouter ces enregistrements :

| Type  | Hôte | Valeur                      |
|-------|------|-----------------------------|
| A     | @    | 185.199.108.153             |
| A     | @    | 185.199.109.153             |
| A     | @    | 185.199.110.153             |
| A     | @    | 185.199.111.153             |
| CNAME | www  | brahim-mahmoudi.github.io   |

3. Optionnel (IPv6), enregistrements AAAA sur `@` : `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`.
4. Désactiver toute redirection (« Web Forwarding ») active sur le domaine.

La propagation prend de quelques minutes à 48 heures. Pour vérifier :

```bash
dig www.brahimmahmoudi.com +short
```

La réponse doit afficher `brahim-mahmoudi.github.io.` puis des adresses `185.199.x.153`.

## Sécurité recommandée

Vérifier le domaine dans les paramètres du compte GitHub (Settings > Pages > Add a domain). GitHub fournit un enregistrement TXT à ajouter chez Network Solutions. Cette vérification empêche un autre compte GitHub d'utiliser ton domaine.

Ne jamais créer d'enregistrement générique `*` pointant vers GitHub.
