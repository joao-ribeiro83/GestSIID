# SVR_AMBIENTES_IMPRESSAO

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **1**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ID | VARCHAR2 | 30 |  |  | N |  |  |
| DESCRICAO | VARCHAR2 | 240 |  |  | Y |  |  |
| USERNAME | VARCHAR2 | 30 |  |  | Y |  |  |
| PASSWORD | VARCHAR2 | 240 |  |  | Y |  |  |
| CONNECT_STRING | VARCHAR2 | 240 |  |  | Y |  |  |
| DATA_INICIO | DATE | 7 |  |  | Y |  |  |
| DATA_FIM | DATE | 7 |  |  | Y |  |  |
| CRIADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_CRIACAO | DATE | 7 |  |  | Y |  |  |
| ACTUALIZADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_ACTUALIZACAO | DATE | 7 |  |  | Y |  |  |
| IMPRESSORA_ID | VARCHAR2 | 30 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| AMBIENTE_PK | P | ID | 1 |


## Foreign keys

| CONSTRAINT_NAME | COLUMN_NAME | POSITION | R_OWNER | R_TABLE_NAME |
| --- | --- | --- | --- | --- |
| SYS_C0065411 | IMPRESSORA_ID | 1 | SIID_TESTES | SVR_IMPRESSORAS |


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| AMBIENTE_PK | UNIQUE | ID | 1 |


## First 200 rows

| ID | DESCRICAO | USERNAME | PASSWORD | CONNECT_STRING | DATA_INICIO | DATA_FIM | CRIADO_POR | DATA_CRIACAO | ACTUALIZADO_POR | DATA_ACTUALIZACAO | IMPRESSORA_ID |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GADOR_TESTES | TESTES | SIID_TESTES | *** | COSEC | Mon Jan 01 2001 00:00:00 GMT+0000 (Western European Standard Time) | Wed Jan 01 2200 00:00:00 GMT+0000 (Western European Standard Time) | SIID_TESTES | Thu Oct 07 2010 12:02:28 GMT+0100 (Western European Summer Time) |  |  |  |

