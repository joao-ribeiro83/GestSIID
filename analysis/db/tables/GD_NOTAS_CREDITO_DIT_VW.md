# GD_NOTAS_CREDITO_DIT_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| CDRAMO | NUMBER | 22 | 3 | 0 | N |  |  |
| NMPOLIZA | VARCHAR2 | 10 |  |  | Y |  |  |
| NMRECIBO | NUMBER | 22 | 10 | 0 | N |  |  |
| TIPORECI | NUMBER | 22 | 2 | 0 | N |  |  |
| FEINICIO | DATE | 7 |  |  | Y |  |  |
| FEFINAL | DATE | 7 |  |  | Y |  |  |
| FEEMISIO | DATE | 7 |  |  | N |  |  |
| CDESTADO | NUMBER | 22 | 2 | 0 | N |  |  |
| FEESTADO | DATE | 7 |  |  | N |  |  |
| PTIMPORT | NUMBER | 22 | 17 | 5 | N |  |  |
| CDMOTANU | NUMBER | 22 | 2 | 0 | Y |  |  |
| NMRECINUE | VARCHAR2 | 10 |  |  | Y |  |  |
| CDPERSON | NUMBER | 22 | 9 | 0 | N |  |  |
| TIPOFACTURA | VARCHAR2 | 0 |  |  | Y |  |  |
| NMFACTURA | VARCHAR2 | 10 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT  
  NOTA_CREDITO.CDUNIECO  
, NOTA_CREDITO.CDRAMO  
, NOTA_CREDITO.NMPOLIZA  
, NOTA_CREDITO.NMRECIBO  
, NOTA_CREDITO.TIPORECI  
, NOTA_CREDITO.FEINICIO  
, NOTA_CREDITO.FEFINAL  
, NOTA_CREDITO.FEEMISIO  
, NOTA_CREDITO.CDESTADO  
, NOTA_CREDITO.FEESTADO  
, NOTA_CREDITO.PTIMPORT  
, NOTA_CREDITO.CDMOTANU  
, NOTA_CREDITO.NMRECINUE  
, NOTA_CREDITO.CDPERSON_TO CDPERSON
, NULL              TIPOFACTURA  
, NMRECIPRE         NMFACTURA  
FROM  
  CO_DIT_MRECIBO     NOTA_CREDITO  
WHERE 1=1
AND DECODE(NOTA_CREDITO.TIPORECI,88, 'S', 60, 'S' , 'N') = 'S'
```
