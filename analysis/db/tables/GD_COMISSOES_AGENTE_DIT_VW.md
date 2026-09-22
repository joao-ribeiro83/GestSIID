# GD_COMISSOES_AGENTE_DIT_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| NMRECIBO | NUMBER | 22 | 10 | 0 | N |  |  |
| CDAGENTE | VARCHAR2 | 15 |  |  | N |  |  |
| CDTIPCOM | VARCHAR2 | 1 |  |  | N |  |  |
| PTIMPORT | NUMBER | 22 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT  /*+ INDEX_ASC(COMISSAO TRECCOM1) */ 
  COMISSAO.CDUNIECO   
, COMISSAO.NMRECIBO   
, COMISSAO.CDAGENTE   
, COMISSAO.CDTIPCOM   
, SUM(COMISSAO.PTIMPORT)     PTIMPORT   
FROM   
CO_DIT_TRECCOM COMISSAO   
GROUP BY   
COMISSAO.CDUNIECO   
, COMISSAO.NMRECIBO   
, COMISSAO.CDAGENTE   
, COMISSAO.CDTIPCOM
```
