# GD_INTERVENIENTES_PROPOSTA_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| CDRAMO | NUMBER | 22 | 3 | 0 | N |  |  |
| NMPROPUE | NUMBER | 22 | 10 | 0 | N |  |  |
| NMGARANT | NUMBER | 22 | 6 | 0 | N |  |  |
| CDROL | VARCHAR2 | 2 |  |  | N |  |  |
| CDPERSON | NUMBER | 22 | 9 | 0 | N |  |  |
| STATUS | VARCHAR2 | 1 |  |  | N |  |  |
| CDTIPIDE | VARCHAR2 | 1 |  |  | N |  |  |
| CDIDEPER | VARCHAR2 | 20 |  |  | N |  |  |
| DSNOMBRE | VARCHAR2 | 160 |  |  | N |  |  |
| CDTIPPER | VARCHAR2 | 2 |  |  | Y |  |  |
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
INTERVENIENTE.CDUNIECO  
, INTERVENIENTE.CDRAMO  
, INTERVENIENTE.NMPROPUE  
, INTERVENIENTE.NMGARANT  
, INTERVENIENTE.CDROL  
, INTERVENIENTE.CDPERSON  
, INTERVENIENTE.STATUS  
, DADOS_INTERVENIENTE.CDTIPIDE  
, DADOS_INTERVENIENTE.CDIDEPER  
, DADOS_INTERVENIENTE.DSNOMBRE  
, DADOS_INTERVENIENTE.CDTIPPER  
, DADOS_INTERVENIENTE.CDPAIS  
FROM  
CO_PROROL INTERVENIENTE  
, MPERSONA  DADOS_INTERVENIENTE  
WHERE  
DADOS_INTERVENIENTE.CDPERSON = INTERVENIENTE.CDPERSON  
--AND INTERVENIENTE.status   = 'V'  
/*AND INTERVENIENTE.FEMODIF = (  
select  
max(X.FEMODIF)  
from  
CO_PROROL X  
where  
X.nmGARANT = INTERVENIENTE.nmGARANT  
and X.cdrol    = INTERVENIENTE.cdrol  
and X.nmpROPUE = INTERVENIENTE.nmpROPUE  
and X.cdramo   = INTERVENIENTE.cdramo  
AND X.cdunieco = INTERVENIENTE.cdunieco  
)*/  
AND INTERVENIENTE.nmORDINA = (  
select  
max(X.nmORDINA)  
from  
CO_PROROL X  
where  
X.nmGARANT = INTERVENIENTE.nmGARANT  
and X.cdrol    = INTERVENIENTE.cdrol  
and X.nmpROPUE = INTERVENIENTE.nmpROPUE  
and X.cdramo   = INTERVENIENTE.cdramo  
AND X.cdunieco = INTERVENIENTE.cdunieco  
)

```
