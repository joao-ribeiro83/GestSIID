# GD_PRE_FACTURAS_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| CDRAMO | NUMBER | 22 | 3 | 0 | N |  |  |
| NMPROPUE | NUMBER | 22 | 10 | 0 | N |  |  |
| TIPRECI | NUMBER | 22 | 5 | 0 | N |  |  |
| CDOPERA | VARCHAR2 | 2 |  |  | N |  |  |
| FEPEDIDO | DATE | 7 |  |  | N |  |  |
| NMFACTUR | NUMBER | 22 | 10 | 0 | N |  |  |
| NMPOLIZA | NUMBER | 22 | 10 | 0 | Y |  |  |
| NMGARANT | NUMBER | 22 | 6 | 0 | N |  |  |
| INDCOBRO | VARCHAR2 | 1 |  |  | Y |  |  |
| FEFACTUR | DATE | 7 |  |  | Y |  |  |
| NUMREC | NUMBER | 22 | 10 | 0 | Y |  |  |
| QTD | NUMBER | 22 |  |  | Y |  |  |
| TAXA_IVA | NUMBER | 22 |  |  | Y |  |  |
| VALOR | NUMBER | 22 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT  
CDUNIECO  
, CDRAMO  
, NMPROPUE  
, TIPRECI  
, CDOPERA  
, FEPEDIDO  
, NMFACTUR  
, NMPOLIZA  
, NMGARANT  
, INDCOBRO  
, FEFACTUR  
, NUMREC  
, NVL(NMCANTID,1)				 				QTD  
, MAX(DECODE(CODCONC,'IVA', IMPCOSTE,0))                          TAXA_IVA  
, SUM(DECODE(CODCONC,'IVA', 0,IMPCOSTE))                          VALOR  
FROM  
CO_FACTUR  
GROUP BY  
CDUNIECO  
, CDRAMO  
, NMPROPUE  
, TIPRECI  
, CDOPERA  
, FEPEDIDO  
, NMFACTUR  
, NMPOLIZA  
, NMGARANT  
, INDCOBRO  
, FEFACTUR  
, NUMREC  
, NVL(NMCANTID,1)

```
