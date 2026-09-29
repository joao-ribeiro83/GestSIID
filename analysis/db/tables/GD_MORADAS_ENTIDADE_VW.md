# GD_MORADAS_ENTIDADE_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDPERSON | NUMBER | 22 | 9 | 0 | N |  |  |
| NMORDDOM | NUMBER | 22 | 2 | 0 | N |  |  |
| CDTIPDOM | VARCHAR2 | 2 |  |  | N |  |  |
| DSDOMICI | VARCHAR2 | 240 |  |  | Y |  |  |
| CDPAIS | VARCHAR2 | 3 |  |  | Y |  |  |
| CDPROVIN | NUMBER | 22 | 2 | 0 | Y |  |  |
| CDPOBLAC | VARCHAR2 | 3 |  |  | Y |  |  |
| CDPOSTAL | VARCHAR2 | 9 |  |  | Y |  |  |
| CDSIGLAS | VARCHAR2 | 2 |  |  | Y |  |  |
| OTPISO | VARCHAR2 | 50 |  |  | Y |  |  |
| NMNUMERO | VARCHAR2 | 50 |  |  | Y |  |  |
| NMEDFCAS | VARCHAR2 | 25 |  |  | Y |  |  |
| CDZONA | VARCHAR2 | 3 |  |  | Y |  |  |
| NMTELEFO | VARCHAR2 | 18 |  |  | Y |  |  |
| NMTELEX | VARCHAR2 | 12 |  |  | Y |  |  |
| NMFAX | VARCHAR2 | 18 |  |  | Y |  |  |
| CDIDIOMA | VARCHAR2 | 1 |  |  | Y |  |  |
| DSEMAIL | VARCHAR2 | 70 |  |  | Y |  |  |
| CDLATITUD | VARCHAR2 | 2 |  |  | Y |  |  |
| NMGRALATI | NUMBER | 22 | 4 | 0 | Y |  |  |
| NMMINLATI | NUMBER | 22 | 4 | 0 | Y |  |  |
| CDLONGITUD | VARCHAR2 | 2 |  |  | Y |  |  |
| NMGRALONG | NUMBER | 22 | 4 | 0 | Y |  |  |
| NMMINLONG | NUMBER | 22 | 4 | 0 | Y |  |  |
| OTPOBLAC | VARCHAR2 | 40 |  |  | Y |  |  |
| CDCONCEJ | NUMBER | 22 | 2 | 0 | Y |  |  |
| CDFREGUE | VARCHAR2 | 2 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT /*+ FIRST_ROWS */
  CDPERSON
, NMORDDOM
, CDTIPDOM
, DSDOMICI
, CDPAIS
, CDPROVIN
, CDPOBLAC
, CDPOSTAL
, CDSIGLAS
, OTPISO
, NMNUMERO
, NMEDFCAS
, CDZONA
, NMTELEFO
, NMTELEX
, NMFAX
, CDIDIOMA
, DSEMAIL
, CDLATITUD
, NMGRALATI
, NMMINLATI
, CDLONGITUD
, NMGRALONG
, NMMINLONG
, OTPOBLAC
, CDCONCEJ
, CDFREGUE
FROM
  MDOMICIL MORADA
WHERE
   MORADA.NMORDDOM       = (
                              SELECT
                                MAX(X.NMORDDOM)
                              FROM
                                MDOMICIL X
                              WHERE
                                  X.CDTIPDOM=MORADA.CDTIPDOM
                              AND X.CDPERSON=MORADA.CDPERSON
                            )
AND MORADA.CDTIPDOM       = '01'

```
