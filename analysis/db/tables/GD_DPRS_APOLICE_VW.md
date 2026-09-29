# GD_DPRS_APOLICE_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| CDRAMO | NUMBER | 22 | 3 | 0 | N |  |  |
| ESTADO | VARCHAR2 | 1 |  |  | N |  |  |
| NMPOLIZA | NUMBER | 22 | 10 | 0 | N |  |  |
| NUC_TOMADOR | NUMBER | 22 | 9 | 0 | N |  |  |
| TIPO_ID | VARCHAR2 | 1 |  |  | N |  |  |
| NUM_ID | VARCHAR2 | 20 |  |  | N |  |  |
| NOME_TOMADOR | VARCHAR2 | 160 |  |  | N |  |  |
| PERIODIC | VARCHAR2 | 175 |  |  | Y |  |  |
| DATA_INI | DATE | 7 |  |  | N |  |  |
| DATA_FIM | DATE | 7 |  |  | Y |  |  |
| DIAS_AP | NUMBER | 22 |  | 0 | Y |  |  |
| DIAS_DEC | NUMBER | 22 |  | 0 | Y |  |  |
| TOTAL_DEC | NUMBER | 22 |  |  | Y |  |  |
| DEC_DEVIDAS | NUMBER | 22 |  |  | Y |  |  |
| DEC_ENTREGUES | NUMBER | 22 |  |  | Y |  |  |
| GESTOR_CONTRATUAL | VARCHAR2 | 175 |  |  | Y |  |  |
| DESCRICAO_PERIODICIDADE | VARCHAR2 | 80 |  |  | N |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT /*+ LEADING (APOLICE) ALL_ROWS */
  APOLICE.CDUNIECO
, APOLICE.CDRAMO
, APOLICE.ESTADO
, APOLICE.NMPOLIZA
, TOMADOR.CDPERSON                                                                                              NUC_TOMADOR
, TOMADOR.CDTIPIDE                                                                                              TIPO_ID
, TOMADOR.CDIDEPER                                                                                              NUM_ID
, TOMADOR.DSNOMBRE                                                                                              NOME_TOMADOR
, PERIDDPR.OTVALOR                              PERIODIC
, APOLICE.FEEFECTO                              DATA_INI
, DECODE(APOLICE.OTTEMPOT, 'T', APOLICE.FEVENCIM, FEPROREN)                              DATA_FIM
, DECODE(APOLICE.OTTEMPOT, 'T', APOLICE.FEVENCIM, FEPROREN)-APOLICE.FEEFECTO                              DIAS_AP
, TRUNC(DECODE(SIGN(SYSDATE - DECODE(APOLICE.OTTEMPOT, 'T', APOLICE.FEVENCIM, FEPROREN))
               ,-1, SYSDATE
               ,DECODE(APOLICE.OTTEMPOT, 'T', APOLICE.FEVENCIM, FEPROREN)))-TRUNC(APOLICE.FEEFECTO)                              DIAS_DEC
, TRUNC(MONTHS_BETWEEN(TRUNC(DECODE(APOLICE.OTTEMPOT, 'T', APOLICE.FEVENCIM, FEPROREN),'MONTH'),TRUNC(APOLICE.FEEFECTO,'MONTH'))/PERIDDPR.OTVALOR) TOTAL_DEC
, TRUNC(MONTHS_BETWEEN(DECODE(SIGN(ADD_MONTHS(TRUNC(SYSDATE,'MONTH'),- 1) - TRUNC(DECODE(APOLICE.OTTEMPOT, 'T', APOLICE.FEVENCIM, FEPROREN),'MONTH'))
                              ,-1, ADD_MONTHS(TRUNC(SYSDATE,'MONTH'),- 1)
                              , TRUNC(DECODE(APOLICE.OTTEMPOT, 'T', APOLICE.FEVENCIM, FEPROREN),'MONTH'))
                              , TRUNC(APOLICE.FEEFECTO,'MONTH'))/PERIDDPR.OTVALOR)                              DEC_DEVIDAS
, PKG_FORMULAS_COSEC.GET_NUMDPR(APOLICE.CDUNIECO, APOLICE.CDRAMO, APOLICE.ESTADO, APOLICE.NMPOLIZA, DECODE(APOLICE.OTTEMPOT, 'T', APOLICE.FEVENCIM, FEPROREN) - 0.00001)  DEC_ENTREGUES
, ATRIBUTO_APOLICE.OTVALOR GESTOR_CONTRATUAL
, DESCRICAO_PERIODICIDADE.DESCRIPL DESCRICAO_PERIODICIDADE
FROM
  TMANTENI DESCRICAO_PERIODICIDADE
, TVALOPOL PERIDDPR
, MPERSONA TOMADOR
, TVALOPOL ATRIBUTO_APOLICE
, MPOLIZAS APOLICE
, MPOLIPER TOMAPOL
WHERE 1=1
AND DESCRICAO_PERIODICIDADE.CDTABLA = 'TPERPAG'
AND DESCRICAO_PERIODICIDADE.CODIGO = PERIDDPR.OTVALOR
AND PERIDDPR.STATUS   = 'V'
AND PERIDDPR.CDATRIBU = 15
AND PERIDDPR.NMSUPLEM = (
                          SELECT
                            MAX(NMSUPLEM)
                          FROM
                            TVALOPOL X
                          WHERE
                              X.CDATRIBU  = PERIDDPR.CDATRIBU
                          AND X.NMPOLIZA  = PERIDDPR.NMPOLIZA
                          AND X.ESTADO    = PERIDDPR.ESTADO
                          AND X.CDRAMO    = PERIDDPR.CDRAMO
                          AND X.CDUNIECO  = PERIDDPR.CDUNIECO
                        )
AND PERIDDPR.NMPOLIZA = APOLICE.NMPOLIZA
AND PERIDDPR.ESTADO   = APOLICE.ESTADO
AND PERIDDPR.CDRAMO   = APOLICE.CDRAMO
AND PERIDDPR.CDUNIECO = APOLICE.CDUNIECO
AND TOMADOR.CDPERSON  = TOMAPOL.CDPERSON
AND TOMAPOL.STATUS    = 'V'
AND TOMAPOL.NMSUPLEM  = (
                          SELECT
                            MAX(NMSUPLEM)
                          FROM
                            MPOLIPER X
                          WHERE
                              X.CDPERSON  = TOMAPOL.CDPERSON
                          AND X.NMSITUAC  = TOMAPOL.NMSITUAC
                          AND X.CDROL     = TOMAPOL.CDROL
                          AND X.NMPOLIZA  = TOMAPOL.NMPOLIZA
                          AND X.ESTADO    = TOMAPOL.ESTADO
                          AND X.CDRAMO    = TOMAPOL.CDRAMO
                          AND X.CDUNIECO  = TOMAPOL.CDUNIECO
                        )
AND TOMAPOL.CDROL     = 'TO'
AND TOMAPOL.NMPOLIZA  = APOLICE.NMPOLIZA
AND TOMAPOL.ESTADO    = APOLICE.ESTADO
AND TOMAPOL.CDRAMO    = APOLICE.CDRAMO
AND TOMAPOL.CDUNIECO  = APOLICE.CDUNIECO
AND ATRIBUTO_APOLICE.CDATRIBU = 4
AND ATRIBUTO_APOLICE.NMPOLIZA = APOLICE.NMPOLIZA
AND ATRIBUTO_APOLICE.ESTADO   = APOLICE.ESTADO
AND ATRIBUTO_APOLICE.CDRAMO   = APOLICE.CDRAMO
AND ATRIBUTO_APOLICE.CDUNIECO = APOLICE.CDUNIECO
AND ATRIBUTO_APOLICE.NMSUPLEM  = (
                                   SELECT
                                     MAX(NMSUPLEM)
                                   FROM
                                      TVALOPOL X
                                   WHERE
                                       X.STATUS = 'V'
                                   AND X.CDATRIBU  = ATRIBUTO_APOLICE.CDATRIBU
                                   AND X.NMPOLIZA  = APOLICE.NMPOLIZA
                                   AND X.ESTADO    = APOLICE.ESTADO
                                   AND X.CDRAMO    = APOLICE.CDRAMO
                                   AND X.CDUNIECO  = APOLICE.CDUNIECO
                                 )
AND APOLICE.CDMOTANU IS NULL
AND APOLICE.NMSUPLEM          = (
                                  SELECT
                                    MAX(X.NMSUPLEM)
                                  FROM
                                    MPOLIZAS X
                                  WHERE
                                  1=1
                                  --AND X.STATUS   = APOLICE.STATUS
                                  AND X.CDUNIECO = APOLICE.CDUNIECO
                                  AND X.CDRAMO   = APOLICE.CDRAMO
                                  AND X.NMPOLIZA = APOLICE.NMPOLIZA
                                  AND X.ESTADO   = APOLICE.ESTADO
                                  AND X.FEEFECTO = APOLICE.FEEFECTO
                                )
AND APOLICE.STATUS    = 'V'
AND APOLICE.CDRAMO LIKE '1%'
AND APOLICE.ESTADO   = 'M'
--and apolice.cdunieco = 1
--and apolice.cdramo = 100
--and apolice.nmpoliza = 2463011002
--and atributo_apolice.otvalor = 'MMCARVALH'
--and PKG_FORMULAS_COSEC.GET_NUMDPR(APOLICE.CDUNIECO, APOLICE.CDRAMO, APOLICE.ESTADO, APOLICE.NMPOLIZA, DECODE(APOLICE.OTTEMPOT, 'T', APOLICE.FEVENCIM, FEPROREN) - 0.00001) > 1
```
