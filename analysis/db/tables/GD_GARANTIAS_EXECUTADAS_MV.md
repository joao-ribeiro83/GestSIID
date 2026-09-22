# GD_GARANTIAS_EXECUTADAS_MV

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

> snapshot table for snapshot DISCOSEC.GD_GARANTIAS_EXECUTADAS_MV

Row count: **0**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DEPARTAMENTO | VARCHAR2 | 3 |  |  | Y |  |  |
| UTILIZADOR | VARCHAR2 | 30 |  |  | Y |  |  |
| NUMERO_SPOOL | NUMBER | 22 |  |  | Y |  |  |
| N_REFERENCIA | VARCHAR2 | 30 |  |  | Y |  |  |
| DESTINATARIO | VARCHAR2 | 240 |  |  | Y |  |  |
| MODELO_ID | VARCHAR2 | 10 |  |  | Y |  |  |
| DATA_PEDIDO | DATE | 7 |  |  | Y |  |  |
| DATA_IMPRESSAO | DATE | 7 |  |  | Y |  |  |
| IMPRESSORA | VARCHAR2 | 240 |  |  | Y |  |  |
| CDUNIECO | VARCHAR2 | 2000 |  |  | Y |  |  |
| CDRAMO | VARCHAR2 | 2000 |  |  | Y |  |  |
| NMPOLIZA | VARCHAR2 | 2000 |  |  | Y |  |  |
| NMGARANT | VARCHAR2 | 2000 |  |  | Y |  |  |
| CDPERSON | VARCHAR2 | 2000 |  |  | Y |  |  |
| LISTA_GARANTIAS | VARCHAR2 | 2001 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| TESTE_GGEM | NONUNIQUE | NMPOLIZA | 1 |

