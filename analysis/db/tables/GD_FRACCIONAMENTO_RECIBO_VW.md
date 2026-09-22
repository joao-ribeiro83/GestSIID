# GD_FRACCIONAMENTO_RECIBO_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 |  |  | N |  |  |
| NMRECIBO | NUMBER | 22 |  |  | N |  |  |
| ANO | NUMBER | 22 |  |  | N |  |  |
| TIPO | VARCHAR2 | 30 |  |  | N |  |  |
| JANEIRO | NUMBER | 22 |  |  | Y |  |  |
| FEVEREIRO | NUMBER | 22 |  |  | Y |  |  |
| MARCO | NUMBER | 22 |  |  | Y |  |  |
| ABRIL | NUMBER | 22 |  |  | Y |  |  |
| MAIO | NUMBER | 22 |  |  | Y |  |  |
| JUNHO | NUMBER | 22 |  |  | Y |  |  |
| JULHO | NUMBER | 22 |  |  | Y |  |  |
| AGOSTO | NUMBER | 22 |  |  | Y |  |  |
| SETEMBRO | NUMBER | 22 |  |  | Y |  |  |
| OUTUBRO | NUMBER | 22 |  |  | Y |  |  |
| NOVEMBRO | NUMBER | 22 |  |  | Y |  |  |
| DEZEMBRO | NUMBER | 22 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT 
  P.CDUNIECO 
, P.NMRECIBO  
, FY.ANO 
, FY.TIPO 
, SUM(DECODE(TO_CHAR(P.MES_FRACCAO,'MM'),'01',NVL(P.FRACCAO,0),0))   JANEIRO 
, SUM(DECODE(TO_CHAR(P.MES_FRACCAO,'MM'),'02',NVL(P.FRACCAO,0),0))   FEVEREIRO 
, SUM(DECODE(TO_CHAR(P.MES_FRACCAO,'MM'),'03',NVL(P.FRACCAO,0),0))   MARCO 
, SUM(DECODE(TO_CHAR(P.MES_FRACCAO,'MM'),'04',NVL(P.FRACCAO,0),0))   ABRIL 
, SUM(DECODE(TO_CHAR(P.MES_FRACCAO,'MM'),'05',NVL(P.FRACCAO,0),0))   MAIO 
, SUM(DECODE(TO_CHAR(P.MES_FRACCAO,'MM'),'06',NVL(P.FRACCAO,0),0))   JUNHO 
, SUM(DECODE(TO_CHAR(P.MES_FRACCAO,'MM'),'07',NVL(P.FRACCAO,0),0))   JULHO 
, SUM(DECODE(TO_CHAR(P.MES_FRACCAO,'MM'),'08',NVL(P.FRACCAO,0),0))   AGOSTO 
, SUM(DECODE(TO_CHAR(P.MES_FRACCAO,'MM'),'09',NVL(P.FRACCAO,0),0))   SETEMBRO 
, SUM(DECODE(TO_CHAR(P.MES_FRACCAO,'MM'),'10',NVL(P.FRACCAO,0),0))   OUTUBRO 
, SUM(DECODE(TO_CHAR(P.MES_FRACCAO,'MM'),'11',NVL(P.FRACCAO,0),0))   NOVEMBRO 
, SUM(DECODE(TO_CHAR(P.MES_FRACCAO,'MM'),'12',NVL(P.FRACCAO,0),0))   DEZEMBRO 
from 
  GD_ANOS_PPNA FY  
, gd_FRACCIONAMENTO_ppna p 
where 
    FY.ANO      = TO_CHAR(P.MES_FRACCAO,'YYYY') 
AND FY.TIPO     = 'FRACCIONAMENTO' 
GROUP BY 
  P.CDUNIECO 
, P.NMRECIBO  
, FY.ANO 
, FY.TIPO

```
