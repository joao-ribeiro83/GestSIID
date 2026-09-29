# GD_RECIBOS_EXECUTADOS_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DEPARTAMENTO | VARCHAR2 | 3 |  |  | Y |  |  |
| UTILIZADOR | VARCHAR2 | 30 |  |  | Y |  |  |
| NUMERO_SPOOL | NUMBER | 22 |  |  | N |  |  |
| MODELO_ID | VARCHAR2 | 10 |  |  | Y |  |  |
| DATA_PEDIDO | DATE | 7 |  |  | Y |  |  |
| DATA_IMPRESSAO | DATE | 7 |  |  | Y |  |  |
| IMPRESSORA | VARCHAR2 | 240 |  |  | Y |  |  |
| DATA_REFERENCIA | VARCHAR2 | 2000 |  |  | Y |  |  |
| UNIDADE_NEGOCIO | VARCHAR2 | 2000 |  |  | Y |  |  |
| NMRECIBO | VARCHAR2 | 2000 |  |  | Y |  |  |
| N_DOCUMENTO | NUMBER | 22 | 10 | 0 | Y |  |  |
| INICIO_VIG | DATE | 7 |  |  | N |  |  |
| FIM_VIG | DATE | 7 |  |  | N |  |  |
| CDRAMO | NUMBER | 22 | 3 | 0 | N |  |  |
| ESTADO | VARCHAR2 | 1 |  |  | N |  |  |
| NMPOLIZA | NUMBER | 22 | 10 | 0 | N |  |  |
| NUC_TOMADOR | NUMBER | 22 | 9 | 0 | Y |  |  |
| CDGESTOR | VARCHAR2 | 10 |  |  | Y |  |  |
| TIPO_AVISO | VARCHAR2 | 4000 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT  
D.DEPARTAMENTO  
, D.UTILIZADOR  
, D.NUMERO_SPOOL  
, D.MODELO_ID  
, D.DATA_PEDIDO  
, D.DATA_IMPRESSAO  
, D.IMPRESSORA  
, D.DATA_REFERENCIA  
, D.CDUNIECO	   UNIDADE_NEGOCIO  
, D.NMRECIBO  
, R.NMRECINUE	   N_DOCUMENTO  
, R.FEINICIO	   INICIO_VIG  
, R.FEFINAL		   FIM_VIG  
, R.CDRAMO  
, R.ESTADO  
, R.NMPOLIZA  
, R.CDPERSON 	   NUC_TOMADOR  
, R.CDGESTOR  
, PKG_FORMULAS_COSEC.FUN_TIPOAVISO(D.CDUNIECO, D.NMRECIBO) TIPO_AVISO  
FROM  
GD_RECGADOR_EXECUTADOS_VW D  
, MRECIBO					R  
WHERE  
D.CDUNIECO = R.CDUNIECO  
AND D.NMRECIBO = R.NMRECIBO

```
