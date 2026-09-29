# GD_INTERVENIENTES_APOLICE_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| CDRAMO | NUMBER | 22 | 3 | 0 | N |  |  |
| ESTADO | VARCHAR2 | 1 |  |  | N |  |  |
| NMPOLIZA | NUMBER | 22 | 10 | 0 | N |  |  |
| NMSITUAC | NUMBER | 22 | 6 | 0 | N |  |  |
| CDROL | VARCHAR2 | 2 |  |  | N |  |  |
| CDPERSON | NUMBER | 22 | 9 | 0 | N |  |  |
| NMORDDOM | NUMBER | 22 | 2 | 0 | Y |  |  |
| FEINIVAL | DATE | 7 |  |  | N |  |  |
| FEFINVAL | DATE | 7 |  |  | N |  |  |
| NSUPLOGI | NUMBER | 22 | 10 | 0 | N |  |  |
| NSUPUSUA | NUMBER | 22 | 10 | 0 | Y |  |  |
| NSUPSESS | NUMBER | 22 | 10 | 0 | Y |  |  |
| FESESSIO | DATE | 7 |  |  | Y |  |  |
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
, INTERVENIENTE.ESTADO 
, INTERVENIENTE.NMPOLIZA 
, INTERVENIENTE.NMSITUAC 
, INTERVENIENTE.CDROL 
, INTERVENIENTE.CDPERSON 
, INTERVENIENTE.NMORDDOM 
, SUPLEMENTO.FEINIVAL 
, SUPLEMENTO.FEFINVAL 
, SUPLEMENTO.NSUPLOGI 
, SUPLEMENTO.NSUPUSUA 
, SUPLEMENTO.NSUPSESS 
, SUPLEMENTO.FESESSIO 
, DADOS_INTERVENIENTE.CDTIPIDE 
, DADOS_INTERVENIENTE.CDIDEPER 
, DADOS_INTERVENIENTE.DSNOMBRE 
, DADOS_INTERVENIENTE.CDTIPPER 
, DADOS_INTERVENIENTE.CDPAIS 
FROM 
  MSUPLEME SUPLEMENTO 
, MPOLIPER INTERVENIENTE 
, MPERSONA DADOS_INTERVENIENTE 
WHERE 
    DADOS_INTERVENIENTE.CDPERSON = INTERVENIENTE.CDPERSON 
AND INTERVENIENTE.status   = 'V'		        
AND INTERVENIENTE.nmsuplem = ( 
                               select  
                                 max(X.nmsuplem)  
                               from  
                                 mpoliper X 
                               where  
                                   X.nmsituac = INTERVENIENTE.nmsituac 
                               and X.cdrol    = INTERVENIENTE.cdrol 
                               and X.cdperson = INTERVENIENTE.cdperson 
                               and X.nmpoliza = INTERVENIENTE.nmpoliza	 
                               and X.estado   = INTERVENIENTE.estado	 
                               and X.cdramo   = INTERVENIENTE.cdramo 
                               AND X.cdunieco = INTERVENIENTE.cdunieco 
                             ) 
AND INTERVENIENTE.nmsuplem = SUPLEMENTO.nmsuplem 
AND INTERVENIENTE.nmpoliza = SUPLEMENTO.nmpoliza 
AND INTERVENIENTE.estado   = SUPLEMENTO.estado 
AND INTERVENIENTE.cdramo   = SUPLEMENTO.cdramo 
AND INTERVENIENTE.cdunieco = SUPLEMENTO.cdunieco

```
