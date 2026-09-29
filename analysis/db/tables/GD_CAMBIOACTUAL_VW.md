# GD_CAMBIOACTUAL_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDMONEDA | VARCHAR2 | 3 |  |  | N |  |  |
| CDMONBAS | VARCHAR2 | 3 |  |  | N |  |  |
| FEVALOR | DATE | 7 |  |  | N |  |  |
| PTCAMBIO | NUMBER | 22 | 17 | 10 | N |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT  
"CDMONEDA","CDMONBAS","FEVALOR","PTCAMBIO"  
FROM  
TCAMBIOS CAMBIO  
WHERE  
CAMBIO.cdmoneda  = (  
SELECT  
tk.cdeuro  
FROM  
tkrnlpar tk  
)  
AND CAMBIO.fevalor   = (  
SELECT  
MAX(fevalor)  
FROM  
tcambios X  
WHERE  
X.cdmoneda=CAMBIO.cdmoneda  
AND X.cdmonbas=CAMBIO.cdmonbas  
AND X.fevalor<=LAST_DAY(ADD_MONTHS(SYSDATE, -1))  
)

```
