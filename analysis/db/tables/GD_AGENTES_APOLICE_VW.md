# GD_AGENTES_APOLICE_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| CDRAMO | NUMBER | 22 | 3 | 0 | N |  |  |
| ESTADO | VARCHAR2 | 1 |  |  | N |  |  |
| NMPOLIZA | NUMBER | 22 | 10 | 0 | N |  |  |
| CDTIPOAG | VARCHAR2 | 1 |  |  | N |  |  |
| PORREDAU | NUMBER | 22 | 5 | 2 | N |  |  |
| STATUS | VARCHAR2 | 1 |  |  | N |  |  |
| CDAGENTE | VARCHAR2 | 15 |  |  | N |  |  |
| CDCLAAGE | VARCHAR2 | 2 |  |  | N |  |  |
| FEDESDE | DATE | 7 |  |  | N |  |  |
| FEHASTA | DATE | 7 |  |  | Y |  |  |
| CDPERSON | NUMBER | 22 | 9 | 0 | N |  |  |
| NMORDDOM | NUMBER | 22 | 2 | 0 | Y |  |  |
| CDTIPIDE | VARCHAR2 | 1 |  |  | N |  |  |
| CDIDEPER | VARCHAR2 | 20 |  |  | N |  |  |
| NOME_AGENTE | VARCHAR2 | 160 |  |  | N |  |  |
| CDPAIS | VARCHAR2 | 3 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT
  AGEAPOL.CDUNIECO
, AGEAPOL.CDRAMO
, AGEAPOL.ESTADO
, AGEAPOL.NMPOLIZA
, AGEAPOL.CDTIPOAG
, AGEAPOL.PORREDAU
, AGEAPOL.STATUS
, AGENTE.CDAGENTE
, AGENTE.CDCLAAGE
, AGENTE.FEDESDE
, AGENTE.FEHASTA
, AGENTE.CDPERSON
, AGENTE.NMORDDOM
, DADOS_AGENTE.CDTIPIDE
, DADOS_AGENTE.CDIDEPER
, DADOS_AGENTE.DSNOMBRE          NOME_AGENTE
, DADOS_AGENTE.CDPAIS
FROM
  MAGENTES AGENTE
, MPOLIAGE AGEAPOL
, MPERSONA DADOS_AGENTE
WHERE
    DADOS_AGENTE.CDPERSON = AGENTE.CDPERSON
AND AGENTE.CDAGENTE       =  AGEAPOL.CDAGENTE
--AND AGEAPOL.STATUS        = 'V'
AND AGEAPOL.NMSUPLEM      = (
                              SELECT
                                MAX(X.NMSUPLEM)
                              FROM
                                MPOLIAGE X
                              WHERE
                                  X.CDAGENTE = AGEAPOL.CDAGENTE
                              AND X.NMPOLIZA = AGEAPOL.NMPOLIZA
                              AND X.ESTADO   = AGEAPOL.ESTADO
                              AND X.CDRAMO   = AGEAPOL.CDRAMO
                              AND X.CDUNIECO = AGEAPOL.CDUNIECO
                            )

```
