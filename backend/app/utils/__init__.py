text = """  BULLETIN DE PAIE
Période du :
au :
Paiement le :
par :
01/04/25
30/04/25
30/04/25
Virement
Matricule
Date embauche
Catégorie
Echélon
Ancienneté
N° de Sécurité Sociale
00679
2
C
 8
an(s) et
 0
mois
Catégorie
Emploi occupé
Département
OUVRIER
SOUS-GERANT
STATION SERVICE
Qualification
Horaire
30,0000
CCN Transport & Prestations de Service

MEFOUDE MBIATEU MARIE MADELEINE
Mme
Commentaire :


N°
Désignation
Nombre
Base
Part salariale
Part patronale
Taux
Gain
Retenue
Taux
Retenue (+)
Retenue (-)
3561049286
6
YOSSI SARL
01/05/17
STATION SERVICE BLESSING NKOLNDA
 900 Salaire de Base
          30
     2466,67

       74000




1010 Prime d'ancienneté

    50000,00
   14,00
        7000




1100 Prime  de responsabilité



       10000




1170 Indemnité de Logement



       20000




1340 Prime  panier



       10000




1720 Total  Avantages en nature OK

    15150,00
    0,00
           0




2590 Prime  salissure



       10000




Total Brut
____________
____________
      131000

2400 Retenue CRTV




        1950



2500 Credit Foncier Salarial

   126150,00
    1,00

        1262
    0,00

           0
2600 Caisse de Retraite CNPS

   131000,00
    4,20

        5502
    4,20

        5502
2660 I.R.P.P




        4114



2670 CAC sur IRPP




         411



3000 Fonds national de l'emploi





    1,00

        1310
3050 Credit Foncier Patronal

   131000,00
    0,00

           0
    1,50

        1965
3100 Prestation Familiale

   131000,00
    0,00

           0
    7,00

        9170
3200 Accident de travail

   131000,00
    0,00

           0
    5,00

        6550
Total Cotisations
____________
____________
____________
____________

       13239

       24497
4710 Cotisation  Mutuelle Yossi




        2500



4730 Retenue Assurance




        6952



Cumuls
Salaire brut
Net imposable
Charges salariales Charges patronales Heures travaillées
Heures sup.
Avantages en
nature
NET A PAYER
Période
      131000
      126150
       13239
       24497
          30
           0
           0
Année
      513743
      494855
       46212
       88133
          79
           0
           0
     108 309
Pour vous aider à faire valoir vos droits, conservez ce bulletin de paie sans limitation de durée.
Sage
"""

def text_extractor(full_text: str, reference: str, num_chars: int, ignore_spaces_in_count: bool = False) -> str:
    idx = full_text.find(reference)
    if idx == -1:
        return ""
    post = full_text[idx + len(reference):].lstrip()
    if not ignore_spaces_in_count:
        return post[:num_chars]
    else:
        result = []
        count = 0
        for ch in post:
            result.append(ch)
            if not ch.isspace():
                count += 1
                if count >= num_chars:
                    break
        return "".join(result)

mat = text_extractor(text, "N° de Sécurité Sociale", 5)
print(mat)