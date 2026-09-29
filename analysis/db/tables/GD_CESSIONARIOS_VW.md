# GD_CESSIONARIOS_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| CDRAMO | NUMBER | 22 | 3 | 0 | N |  |  |
| ESTADO | VARCHAR2 | 1 |  |  | N |  |  |
| NMPOLIZA | NUMBER | 22 | 10 | 0 | N |  |  |
| NMSITUAC | NUMBER | 22 | 6 | 0 | N |  |  |
| CDPERSON | NUMBER | 22 | 9 | 0 | N |  |  |
| CDTIPIDE | VARCHAR2 | 1 |  |  | N |  |  |
| CDIDEPER | VARCHAR2 | 20 |  |  | N |  |  |
| DSNOMBRE | VARCHAR2 | 160 |  |  | N |  |  |
| CDPAIS | VARCHAR2 | 3 |  |  | Y |  |  |
| CDNATJUR | VARCHAR2 | 4 |  |  | Y |  |  |
| E_MAIL | VARCHAR2 | 70 |  |  | Y |  |  |
| PAG_WEB | VARCHAR2 | 60 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT 
  CESSAPOL.CDUNIECO 
, CESSAPOL.CDRAMO 
, CESSAPOL.ESTADO 
, CESSAPOL.NMPOLIZA 
, CESSAPOL.NMSITUAC 
, CESSIONARIO.CDPERSON 
, CESSIONARIO.CDTIPIDE 
, CESSIONARIO.CDIDEPER 
, CESSIONARIO.DSNOMBRE 
, CESSIONARIO.CDPAIS 
, CESSIONARIO.CDNATJUR 
, CESSIONARIO.E_MAIL 
, CESSIONARIO.PAG_WEB 
FROM 
  MPOLIPER  CESSAPOL 
, MPERSONA  CESSIONARIO 
WHERE 
    CESSIONARIO.cdperson  = CESSAPOL.cdperson 
AND CESSAPOL.NMSUPLEM = ( 
                          select 
                            max(X.nmsuplem) 
                          from 
                            mpoliper X 
                          where  
                              X.cdunieco  = CESSAPOL.cdunieco 
                          and X.cdramo    = CESSAPOL.cdramo 
                          and X.estado    = CESSAPOL.estado 
                          and X.nmpoliza  = CESSAPOL.nmpoliza 
                          and X.nmsituac  = CESSAPOL.nmsituac 
                          and X.cdrol     = CESSAPOL.cdrol 
                          and X.cdperson  = CESSAPOL.cdperson 
                        ) 
AND CESSAPOL.CDROL = 'CE' 
AND CESSAPOL.STATUS = 'V' 
AND CESSAPOL.ESTADO = 'M'

```
