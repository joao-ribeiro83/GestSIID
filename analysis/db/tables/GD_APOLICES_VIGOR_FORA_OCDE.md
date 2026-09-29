# GD_APOLICES_VIGOR_FORA_OCDE

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| CDRAMO | NUMBER | 22 | 3 | 0 | N |  |  |
| NMPOLIZA | NUMBER | 22 | 10 | 0 | N |  |  |
| INIVIG | DATE | 7 |  |  | N |  |  |
| FIMVIG | DATE | 7 |  |  | Y |  |  |
| TOMADOR | VARCHAR2 | 160 |  |  | N |  |  |
| TIPO | VARCHAR2 | 1 |  |  | N |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
select
  APOLICE.CDUNIECO
, APOLICE.CDRAMO
, APOLICE.NMPOLIZA
, APOLICE.FEEFECTO INIVIG
, DECODE(OTTEMPOT,'T', APOLICE.FEVENCIM,APOLICE.FEPROREN) FIMVIG
, Tomador.DSNOMBRE TOMADOR
, APOLICE.ottempot TIPO
from
 mpolizas APOLICE
,mpoliper TomApolice
,mpersona Tomador
where 1=1
-- filtro apolices
and APOLICE.cdunieco = 2
and APOLICE.cdramo   = 150   
and APOLICE.estado = 'M'
and APOLICE.status='V'
and APOLICE.NMSUPLEM = (
                             SELECT
                               MAX(NMSUPLEM)
                             FROM
                               MPOLIZAS X
                             WHERE
                                 X.NMPOLIZA = APOLICE.NMPOLIZA
                             AND X.ESTADO   = APOLICE.ESTADO
                             AND X.CDRAMO   = APOLICE.CDRAMO
                             AND X.CDUNIECO = APOLICE.CDUNIECO
                             and x.STATUS   ='V'
                           )
-- Calculo de cdperson do Tomador
and TomApolice.cdramo   = apolice.cdramo
and TomApolice.cdunieco = apolice.cdunieco
and TomApolice.nmpoliza = apolice.nmpoliza
and TomApolice.estado   = apolice.estado
and TomApolice.status   = 'V'
and TomApolice.CDROL='TO'
and TomApolice.nmsuplem = (
            SELECT 
              MAX(MPOLIPERA.NMSUPLEM)
              FROM MPOLIPER MPOLIPERA
              WHERE 1=1 
                AND MPOLIPERA.CDROL    = TomApolice.CDROL  
                AND MPOLIPERA.NMSUPLEM <= TO_CHAR(APOLICE.FEEFECTO,'J')||'99999999999'  
                AND MPOLIPERA.NMPOLIZA = TomApolice.NMPOLIZA  
                AND MPOLIPERA.ESTADO   = TomApolice.ESTADO  
                AND MPOLIPERA.CDRAMO   = TomApolice.CDRAMO  
                AND MPOLIPERA.CDUNIECO = TomApolice.CDUNIECO  
            )   
-- Calculo do Nome do Tomador
and Tomador.cdperson=TomApolice.cdperson
--APOLICE EM VIGOR
--AND PKG_FORMULAS_COSEC.IS_APOLICE_VALIDA(APOLICE.CDUNIECO, APOLICE.CDRAMO, APOLICE.ESTADO, APOLICE.NMPOLIZA) = 'S'
--n?o contemplar as anuladas (seja ou n?o no futuro)
AND PKG_FORMULAS_COSEC.GET_DT_ANULACAO_APOLICE (APOLICE.CDUNIECO, APOLICE.CDRAMO,APOLICE.NMPOLIZA) IS NULL
```
