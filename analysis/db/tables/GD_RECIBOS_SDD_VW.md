# GD_RECIBOS_SDD_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDPROCES | NUMBER | 22 | 9 | 0 | N |  |  |
| CDGESTOR | VARCHAR2 | 10 |  |  | N |  |  |
| DATA_PROCESSO | DATE | 7 |  |  | N |  |  |
| ESTADO_PROCESSO | VARCHAR2 | 1 |  |  | N |  |  |
| REFERENCIA | VARCHAR2 | 3 |  |  | Y |  |  |
| TIPO_REGISTO | VARCHAR2 | 1 |  |  | Y |  |  |
| TIPO_OPERACAO | VARCHAR2 | 2 |  |  | Y |  |  |
| SITUACAO_CONTA | VARCHAR2 | 2 |  |  | Y |  |  |
| SITUACAO_REG | VARCHAR2 | 1 |  |  | Y |  |  |
| NIB | VARCHAR2 | 21 |  |  | Y |  |  |
| BANCO | VARCHAR2 | 4 |  |  | Y |  |  |
| BALCAO | VARCHAR2 | 4 |  |  | Y |  |  |
| CONTA | VARCHAR2 | 11 |  |  | Y |  |  |
| CONTROL_DGT | VARCHAR2 | 2 |  |  | Y |  |  |
| VALOR | NUMBER | 22 |  |  | Y |  |  |
| NUC | VARCHAR2 | 9 |  |  | Y |  |  |
| DIGITO_ADC97 | VARCHAR2 | 2 |  |  | Y |  |  |
| FILLER | VARCHAR2 | 9 |  |  | Y |  |  |
| TIPO_RECIBO | NUMBER | 22 |  |  | Y |  |  |
| RECIBO | NUMBER | 22 |  |  | Y |  |  |
| NADA | VARCHAR2 | 1 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT
  PROCESSOS_SDD.CDPROCES
, PROCESSOS_SDD.CDGESTOR
, PROCESSOS_SDD.FEPROCES                          DATA_PROCESSO
, PROCESSOS_SDD.SWVALIDA                          ESTADO_PROCESSO
, SUBSTR(LISTA_SDD.DETALLE,1,3)                   REFERENCIA
, SUBSTR(LISTA_SDD.DETALLE,4,1)                   TIPO_REGISTO
, SUBSTR(LISTA_SDD.DETALLE,5,2)                   TIPO_OPERACAO
, SUBSTR(LISTA_SDD.DETALLE,7,2)                   SITUACAO_CONTA
, SUBSTR(LISTA_SDD.DETALLE,9,1)                   SITUACAO_REG
, SUBSTR(LISTA_SDD.DETALLE,10,21)                 NIB
, SUBSTR(LISTA_SDD.DETALLE,10,4)                  BANCO
, SUBSTR(LISTA_SDD.DETALLE,14,4)                  BALCAO
, SUBSTR(LISTA_SDD.DETALLE,18,11)                 CONTA
, SUBSTR(LISTA_SDD.DETALLE,29,2)                  CONTROL_DGT
, TO_NUMBER(SUBSTR(LISTA_SDD.DETALLE,31,13))/100  VALOR
, SUBSTR(LISTA_SDD.DETALLE,44,9)                  NUC
, SUBSTR(LISTA_SDD.DETALLE,53,2)                  DIGITO_ADC97
, SUBSTR(LISTA_SDD.DETALLE,55,9)                  FILLER
, TO_nUMBER(SUBSTR(LISTA_SDD.DETALLE,64,2))       TIPO_RECIBO
, TO_NUMBER(SUBSTR(LISTA_SDD.DETALLE,66,14))      RECIBO
, SUBSTR(LISTA_SDD.DETALLE,80,1)                  NADA
FROM
  CO_TLOGDEVB  PROCESSOS_SDD
, TDOMBANC     LISTA_SDD
WHERE
    PROCESSOS_SDD.CDPROCES = LISTA_SDD.CDPROCES
AND LISTA_SDD.CDTIPREG     = 2
AND LISTA_SDD.CDPROCES     > 101

```
