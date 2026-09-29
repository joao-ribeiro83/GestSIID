# GD_NC_FAC_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| NMRECIBO | NUMBER | 22 | 10 | 0 | N |  |  |
| TIPORECI | NUMBER | 22 | 2 | 0 | N |  |  |
| TIPOFACTURA | VARCHAR2 | 40 |  |  | Y |  |  |
| NMFACTURA | VARCHAR2 | 40 |  |  | Y |  |  |


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
, NOTA_CREDITO.NMRECIBO  
, NOTA_CREDITO.TIPORECI  
, MAX(DECODE(NOTA_CREDITO.CDATRIBU, 2, NOTA_CREDITO.OTVALOR, NULL))        TIPOFACTURA  
, MAX(DECODE(NOTA_CREDITO.CDATRIBU, 1, NOTA_CREDITO.OTVALOR, NULL))        NMFACTURA  
FROM  
CO_TVALOREC NOTA_CREDITO  
WHERE  
DECODE(NOTA_CREDITO.TIPORECI, 84, 'S'  
, 85, 'S'  
, 86, 'S'  
, 87, 'S'  
, 88, 'S'  
, 89, 'S'  
, 'N') = 'S'  
GROUP BY  
NOTA_CREDITO.CDUNIECO  
, NOTA_CREDITO.NMRECIBO  
, NOTA_CREDITO.TIPORECI

```
