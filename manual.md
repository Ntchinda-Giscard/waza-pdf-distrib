# MANUEL UTILISATEUR - eBulletin

**Application de Distribution Automatisée des Fiches de Paie**  
**Version 1.0 | Waza Solutions**

---

## Table des matières

1. [Présentation générale](#présentation)
2. [Premiers pas](#premiers-pas)
3. [Activation de la licence](#activation-licence)
4. [Configuration initiale](#configuration-initiale)
5. [Utilisation quotidienne](#utilisation-quotidienne)
6. [Résolution des problèmes](#dépannage)

---

## 1. PRÉSENTATION GÉNÉRALE {#présentation}

eBulletin automatise la distribution des bulletins de paie par email à vos employés. L'application lit les fichiers PDF depuis vos dossiers, identifie le matricule de chaque employé, récupère son adresse email depuis votre base de données, puis envoie le bulletin par courrier électronique.

### Points importants

- **Une seule instance** : L'application ne peut être ouverte qu'une seule fois à la fois.
- **Notifications** : Les messages de confirmation ou d'erreur s'affichent en haut à droite de l'écran.
- **Configuration requise** : Tous les paramètres doivent être configurés avant le premier envoi.

---

## 2. PREMIERS PAS {#premiers-pas}

### Lancement de l'application

1. Ouvrez **eBulletin** depuis le menu Démarrer ou le raccourci sur votre bureau.
2. La fenêtre principale s'affiche avec deux onglets : **Accueil** et **Paramètres**.

### Navigation

- **Onglet Accueil** : Lancez la distribution et consultez l'état de la configuration.
- **Onglet Paramètres** : Configurez toutes les options (5 sous-onglets).

---

## 3. ACTIVATION DE LA LICENCE {#activation-licence}

### Étapes d'activation

1. Cliquez sur l'onglet **Paramètres** en haut.
2. Sélectionnez le sous-onglet **Paramètres** (icône d'engrenage).
3. Dans la section "Gestion de la Licence", cliquez sur **Modifier**.
4. Saisissez votre clé de licence fournie par Waza Solutions.
5. Cliquez sur **Activer la Licence**.

### Vérification

- Un message "Licence activée avec succès" confirme l'activation.
- Sur l'écran d'accueil, le statut affiche maintenant "Licence Activée" en vert.

⚠️ **Important** : Sans licence valide, l'application ne peut pas envoyer de bulletins.

---

## 4. CONFIGURATION INITIALE {#configuration-initiale}

Configurez les paramètres dans l'ordre suivant pour un démarrage optimal :

### 4.1 Configuration de la Base de Données

**Onglet : Paramètres > Bases de Données**

#### Connexion ODBC (recommandée)

1. Cliquez sur **Actualiser ODBC** pour voir les sources disponibles.
2. Sélectionnez **Connexion ODBC**.
3. Choisissez votre **Source de Données (DSN)** dans le menu déroulant.
4. Saisissez le **Nom d'utilisateur** et le **Mot de passe**.
5. Cliquez sur **Ajouter**.

#### Connexion Native

1. Sélectionnez **Connexion SQL Native**.
2. Choisissez le **Type de Base de Données** (PostgreSQL, MySQL, MSSQL).
3. Saisissez le **Nom du Serveur** (ex: `localhost` ou adresse IP).
4. Renseignez le **Nom d'utilisateur** et le **Mot de passe**.
5. Cliquez sur **Ajouter**.

#### Gestion des connexions

- **Modifier** : Cliquez sur l'icône crayon pour modifier une connexion.
- **Supprimer** : Cliquez sur l'icône poubelle rouge pour supprimer.

---

### 4.2 Configuration Email

**Onglet : Paramètres > Email**

Configurez les paramètres d'envoi des emails :

1. **Serveur SMTP** : Adresse du serveur email (ex: `smtp.gmail.com`, `smtp.office365.com`).
2. **Port SMTP** : Numéro de port (587 pour TLS, 465 pour SSL).
3. **Email d'Expédition** : Adresse email utilisée pour envoyer les bulletins.
4. **Mot de Passe** : Mot de passe ou mot de passe d'application.
5. **Options de Sécurité** :
   - ☑ **Utiliser SSL** : Cochez si votre serveur utilise SSL (port 465).
   - ☑ **Utiliser TLS** : Cochez si votre serveur utilise TLS (port 587).
6. Cliquez sur **Sauvegarder**.

📧 **Exemples courants** :

- **Gmail** : smtp.gmail.com, port 587, TLS activé
- **Outlook/Office 365** : smtp.office365.com, port 587, TLS activé

---

### 4.3 Configuration de la Détection des Matricules

**Onglet : Paramètres > Matricules**

Cette section permet à l'application de détecter le matricule dans le nom des fichiers PDF.

#### Format des noms de fichiers

Vos fichiers doivent suivre ce format : `[TEXTE][MATRICULE]_autres_informations.pdf`

**Exemple** : `MAT123456_JohnDoe_Janvier2025.pdf`

- Texte de référence : `MAT`
- Matricule : `123456` (6 caractères)

#### Configuration

1. **Nombre de Caractères du Matricule** : Saisissez le nombre de chiffres (ex: 6).
2. **Texte de Référence** : Saisissez le préfixe avant le matricule (ex: `MAT`).
3. Cliquez sur **Tester et trouver le matricule** pour valider avec un fichier test.
4. Cliquez sur **Sauvegarder**.

⚠️ **Attention** : Si le format n'est pas respecté, les bulletins ne seront pas distribués correctement.

---

### 4.4 Liaison Dossiers / Bases de Données

**Onglet : Paramètres > Dossiers**

Créez des liaisons entre vos dossiers de bulletins et vos bases de données.

#### Ajout d'une liaison

1. **Dossier Principal** :

   - Cliquez sur l'icône 📁 pour sélectionner le dossier contenant vos bulletins.
   - Ou saisissez le chemin complet (ex: `E:/Bulletins_Paie_2025`).

2. **Sous-dossier** :

   - Une fois le dossier principal sélectionné, les sous-dossiers s'affichent automatiquement.
   - Choisissez le sous-dossier à traiter (ex: `Janvier`, `Service_RH`).

3. **Base de Données Liée** :

   - Saisissez le nom de la base de données contenant les informations des employés.

4. **Dossier d'Archivage** :

   - Cliquez sur 📁 pour sélectionner où archiver les bulletins après envoi.

5. **Dossier de Journalisation** :

   - Cliquez sur 📁 pour sélectionner où enregistrer les rapports d'envoi.

6. **Type de Base de Données** :

   - ⚪ **Base SAGE** : Sélectionnez si vous utilisez SAGE Paie.
   - ⚪ **Autre Base de Données** : Sélectionnez pour les autres systèmes.

7. **Si "Autre Base de Données"** (saisissez) :

   - **Nom de la Table** : Nom de la table contenant les données employés (ex: `T_SAL`).
   - **Champ Matricule** : Nom de la colonne du matricule (ex: `MatriculeSalarie`).
   - **Champ Email** : Nom de la colonne de l'email (ex: `EMail`).

8. Cliquez sur **Ajouter cette Liaison**.

#### Gestion des liaisons

- **Modifier** : Cliquez sur l'icône crayon.
- **Supprimer** : Cliquez sur l'icône poubelle rouge.
- **Effacer Tout** : Bouton en haut à droite pour réinitialiser le formulaire.

#### Détection des doublons

L'application détecte automatiquement :

- ✗ Les configurations identiques
- ✗ Les noms de dossiers en conflit
- ✗ Les chemins imbriqués qui se chevauchent

Un message d'alerte rouge s'affiche si un conflit est détecté.

---

## 5. UTILISATION QUOTIDIENNE {#utilisation-quotidienne}

### Vérification avant l'envoi

**Onglet : Accueil**

Consultez l'état de la configuration :

- ✅ **Licence Activée** (statut vert)
- ✅ **Bases de données configurées** : Nombre affiché
- ✅ **Liaisons dossiers configurées** : Nombre affiché
- ✅ **Configuration email** : Active

Si un élément manque, un message rouge indique les actions nécessaires :

- • Activez votre licence
- • Configurez au moins une base de données
- • Configurez au moins une liaison dossier/BDD
- • Configurez votre serveur mail

---

### Lancement de la distribution

1. Placez vos fichiers PDF dans les dossiers configurés.
2. Vérifiez que les noms de fichiers respectent le format configuré.
3. Cliquez sur **Lancer l'Envoi des Bulletins**.

#### Suivi en temps réel

Une barre de progression s'affiche avec :

- Le pourcentage d'avancement
- Le matricule en cours de traitement
- L'email du destinataire

#### Messages de statut

- 📄 **Matricule: 123456 → 📧 exemple@email.com** : En cours d'envoi
- ✅ **Distribution complétée** : Tous les bulletins ont été envoyés
- 🎉 **Distribution terminée !** : Confirmation finale

---

### Consultation des journaux

Cliquez sur **Ouvrir dossier de journalisation** pour :

- Consulter les rapports d'envoi
- Vérifier les bulletins envoyés avec succès
- Identifier les envois échoués

---

## 6. RÉSOLUTION DES PROBLÈMES {#dépannage}

### Le bouton "Lancer l'Envoi" est grisé

**Causes possibles** :

- ✗ Licence non activée → Allez dans Paramètres > Paramètres
- ✗ Aucune base de données → Allez dans Paramètres > Bases de Données
- ✗ Aucune liaison dossier → Allez dans Paramètres > Dossiers
- ✗ Email non configuré → Allez dans Paramètres > Email

---

### Erreur "Échec de l'envoi"

**Solutions** :

1. Vérifiez les paramètres email (serveur SMTP, port, identifiants).
2. Testez votre connexion internet.
3. Vérifiez que le mot de passe email est correct.
4. Si Gmail : créez un "mot de passe d'application" au lieu du mot de passe habituel.

---

### Matricules non détectés

**Solutions** :

1. Vérifiez le format des noms de fichiers.
2. Utilisez le bouton **Tester et trouver le matricule** dans Paramètres > Matricules.
3. Ajustez le "Nombre de Caractères" et le "Texte de Référence".
4. Exemple correct : `MAT123456_nom.pdf` (si texte = `MAT` et 6 caractères).

---

### Erreur "Connexion à la base de données impossible"

**Solutions** :

1. Vérifiez les identifiants (nom d'utilisateur et mot de passe).
2. Pour ODBC : Cliquez sur **Actualiser ODBC** et re-sélectionnez la source.
3. Pour Native : Vérifiez l'adresse du serveur et le port.
4. Assurez-vous que le service de base de données est démarré.

---

### Email non envoyé à certains employés

**Causes** :

- ✗ Adresse email manquante dans la base de données
- ✗ Adresse email invalide
- ✗ Fichier PDF manquant pour ce matricule

**Vérification** :

- Consultez le dossier de journalisation pour identifier les employés concernés.
- Mettez à jour les emails dans votre base de données.

---

### L'application refuse de s'ouvrir

**Cause** : Une instance est déjà ouverte.

**Solution** : Fermez l'application existante :

1. Recherchez l'icône dans la barre des tâches.
2. Cliquez-droit > Fermer.
3. Relancez l'application.

---

### Conflit de dossiers détecté

**Message** : "Conflit de chemin détecté..."

**Explication** : Vous essayez d'ajouter un dossier qui entre en conflit avec une liaison existante.

**Solutions** :

- Modifiez le chemin du dossier principal ou du sous-dossier.
- Supprimez l'ancienne liaison si elle n'est plus utilisée.
- Utilisez des sous-dossiers distincts pour chaque liaison.

---

## BONNES PRATIQUES

### Organisation des fichiers

✅ Créez une structure claire : `Année/Mois/Service/`  
✅ Respectez toujours le format de nommage configuré  
✅ Testez avec quelques fichiers avant un envoi massif

### Sécurité

🔒 Ne partagez jamais votre clé de licence  
🔒 Utilisez des mots de passe forts pour les connexions  
🔒 Vérifiez les permissions d'accès aux dossiers

### Maintenance

📅 Archivez régulièrement les bulletins envoyés  
📅 Consultez les journaux après chaque distribution  
📅 Sauvegardez votre configuration

---

## SUPPORT TECHNIQUE

**Waza Solutions**  
📧 Email : contact@waza-solutions.world  
📞 Téléphone : +237 699 91 24 98  
🌐 Site web : www.waza-solutions.world  
📍 Adresse : Dla-3ème Pk08-ESG

**Informations à fournir lors d'une demande de support** :

- Capture d'écran du message d'erreur
- Configuration utilisée (nombre de caractères, texte de référence)
- Exemple de nom de fichier
- Version de l'application

---

**© 2025 Waza Solutions - Tous droits réservés**  
**Document version 1.0 - Dernière mise à jour : 09/10/2025**
