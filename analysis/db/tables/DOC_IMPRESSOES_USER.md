# DOC_IMPRESSOES_USER

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **0**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| PK_CHAVE_DIU | P | CDEMPLEA | 1 |
| PK_CHAVE_DIU | P | IMPRESSORA_ID | 2 |
| PK_CHAVE_DIU | P | DATA_INICIO | 3 |


## Foreign keys

| CONSTRAINT_NAME | COLUMN_NAME | POSITION | R_OWNER | R_TABLE_NAME |
| --- | --- | --- | --- | --- |
| FK_IMPRESSORA_DIU | IMPRESSORA_ID | 1 | SIID_TESTES | SVR_IMPRESSORAS |


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| IDX_IMPRESSORA_DIU | NONUNIQUE | IMPRESSORA_ID | 1 |
| PK_CHAVE_DIU | UNIQUE | CDEMPLEA | 1 |
| PK_CHAVE_DIU | UNIQUE | IMPRESSORA_ID | 2 |
| PK_CHAVE_DIU | UNIQUE | DATA_INICIO | 3 |

