# DOC_IMPRESSOES_MODELO_USR

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **9**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MODELO_ID | VARCHAR2 | 10 |  |  | N |  |  |
| CDEMPLEA | VARCHAR2 | 30 |  |  | N |  |  |
| IMPRESSORA_ID | VARCHAR2 | 30 |  |  | N |  |  |
| DATA_INICIO | DATE | 7 |  |  | N |  |  |
| DATA_FIM | DATE | 7 |  |  | Y |  |  |
| CRIADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_CRIACAO | DATE | 7 |  |  | Y |  |  |
| ACTUALIZADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_ACTUALIZACAO | DATE | 7 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| PK_CHAVE_DIMU | P | MODELO_ID | 1 |
| PK_CHAVE_DIMU | P | CDEMPLEA | 2 |
| PK_CHAVE_DIMU | P | IMPRESSORA_ID | 3 |
| PK_CHAVE_DIMU | P | DATA_INICIO | 4 |


## Foreign keys

| CONSTRAINT_NAME | COLUMN_NAME | POSITION | R_OWNER | R_TABLE_NAME |
| --- | --- | --- | --- | --- |
| FK_IMPRESSORA_DIMU | IMPRESSORA_ID | 1 | SIID_TESTES | SVR_IMPRESSORAS |


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| IDX_IMPRESSORA_DIMU | NONUNIQUE | IMPRESSORA_ID | 1 |
| PK_CHAVE_DIMU | UNIQUE | MODELO_ID | 1 |
| PK_CHAVE_DIMU | UNIQUE | CDEMPLEA | 2 |
| PK_CHAVE_DIMU | UNIQUE | IMPRESSORA_ID | 3 |
| PK_CHAVE_DIMU | UNIQUE | DATA_INICIO | 4 |

