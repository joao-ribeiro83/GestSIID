# GD_PRORROGACOES_NACEITES_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| CDRAMO | NUMBER | 22 | 3 | 0 | N |  |  |
| ESTADO | VARCHAR2 | 1 |  |  | N |  |  |
| N_APOLICE | NUMBER | 22 | 10 | 0 | N |  |  |
| CDPERSON_TOMADOR | NUMBER | 22 | 10 | 0 | N |  |  |
| TOMADOR | VARCHAR2 | 160 |  |  | N |  |  |
| N_PRORROGACAO | NUMBER | 22 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT
  PRG.CDUNIECO
, PRG.CDRAMO
, PRG.ESTADO
, PRG.NMPOLIZA  N_APOLICE
, PRG.CDPERSTO  CDPERSON_TOMADOR
, TOMADOR.DSNOMBRE   TOMADOR
, COUNT(PRG.NMCOMPRG)  N_PRORROGACAO
FROM
  CO_COMPRG PRG
 ,MPERSONA  TOMADOR
WHERE
  NOT EXISTS (SELECT 1
                FROM GD_CARTAS_PRORROGACOES X
               WHERE X.NMCOMPRG = PRG.NMCOMPRG)
AND PRG.ESTCOPRG='N'
AND PRG.CDPERSTO = TOMADOR.CDPERSON
AND TRUNC(PRG.DTREGCOM) >= TO_DATE('02-12-2008','DD-MM-YYYY') /* Data de entrada em Produc?o.*/
GROUP BY
  PRG.CDUNIECO
, PRG.CDRAMO
, PRG.ESTADO
, PRG.NMPOLIZA
, PRG.CDPERSTO
, TOMADOR.DSNOMBRE
order by cdramo, nmpoliza desc --N_PRORROGACAO desc


```
