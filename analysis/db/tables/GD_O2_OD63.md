# GD_O2_OD63

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| NMPROPUE | NUMBER | 22 | 10 | 0 | N |  |  |
| FEMODIF | DATE | 7 |  |  | N |  |  |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| CDRAMO | NUMBER | 22 | 3 | 0 | N |  |  |
| FESOLICI | DATE | 7 |  |  | N |  |  |
| FEBAJA | DATE | 7 |  |  | Y |  |  |
| SWESTADO | VARCHAR2 | 1 |  |  | N |  |  |
| CDMOEDA | VARCHAR2 | 3 |  |  | Y |  |  |
| DSRAMO | VARCHAR2 | 30 |  |  | N |  |  |
| CDPERSON | NUMBER | 22 | 9 | 0 | N |  |  |
| DSNOMBRE | VARCHAR2 | 160 |  |  | N |  |  |
| CDIDEPER | VARCHAR2 | 20 |  |  | N |  |  |
| CDTIPIDE | VARCHAR2 | 1 |  |  | N |  |  |
| TIPO_IDE | VARCHAR2 | 15 |  |  | N |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT /*+ leading(ramo) USE_NL(PROPOSTA) */  
Proposta.nmpropue  
, Proposta.femodif  
, Proposta.cdunieco  
, Proposta.cdramo  
, Proposta.fesolici  
, Proposta.febaja  
, Proposta.swestado  
, Proposta.cdmoeda  
, Ramo.dsramo  
, TomProposta.cdperson  
, Tomador.dsnombre  
, Tomador.cdideper  
, Tomador.cdtipide  
, TIPOIDE.DESCRIPC	TIPO_IDE  
FROM  
tramos    Ramo  
, mparapro  ROLES  
, mpersona  Tomador  
, co_prorol TomProposta  
, co_propol Proposta  
, tmanteni  tipoide  
WHERE  
1=1  
-- Calculo do Nome do Tomador  
AND TIPOIDE.CODIGO             = TOMADOR.CDTIPIDE  
AND TIPOIDE.CDTABLA            = 'TTIPOIDE'  
AND Tomador.cdperson           = TomProposta.cdperson  
AND TomProposta.cdunieco       = Proposta.cdunieco  
AND TomProposta.cdramo         = Proposta.cdramo  
AND TomProposta.nmpropue       = Proposta.nmpropue  
AND TomProposta.femodif        = (  
SELECT  
MAX(x.femodif)  
FROM  
co_prorol X  
WHERE  
1=1  
AND X.femodif <= SYSDATE  
AND x.nmgarant = TomProposta.nmgarant  
AND X.CDROL    = TOMPROPOSTA.CDROL  
AND X.cdramo   = TomProposta.cdramo  
AND X.cdunieco = TomProposta.cdunieco  
AND X.nmpropue = TomProposta.nmpropue  
)  
AND TomProposta.status          = 'V'  
AND TomProposta.cdrol           = ROLES.cdrolTOM  
-- Calculo do Roles associados ao Produto  
AND ROLES.cdramo                = Proposta.cdramo  
-- Calculo da Proposta Associada  
AND Proposta.TASACOM IS NOT NULL  
AND Proposta.cdramo              = Ramo.cdramo  
AND Proposta.swestado NOT IN ('A','AP')  
AND NVL(Proposta.femodif,SYSDATE) = (  
SELECT  
NVL(MAX(X.femodif),SYSDATE)  
FROM  
co_propol X  
WHERE  
X.swestado = Proposta.swestado  
AND X.femodif <= SYSDATE  
AND X.cdramo   = Proposta.cdramo  
AND X.cdunieco = Proposta.cdunieco  
AND X.nmpropue = Proposta.nmpropue  
)  
AND Ramo.cdtipora = 2

```
