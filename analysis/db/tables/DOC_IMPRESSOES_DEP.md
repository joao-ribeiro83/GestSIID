# DOC_IMPRESSOES_DEP

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **0**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDDEPARTA | VARCHAR2 | 20 |  |  | N |  |  |
| AMBIENTE_ID | VARCHAR2 | 30 |  |  | N |  |  |
| IMPRESSORA_ID | VARCHAR2 | 30 |  |  | N |  |  |
| GUARDA_COPIA | VARCHAR2 | 1 |  |  | Y |  |  |
| VISUALIZA | VARCHAR2 | 1 |  |  | Y |  |  |
| DATA_INICIO | DATE | 7 |  |  | N |  |  |
| DATA_FIM | DATE | 7 |  |  | Y |  |  |
| CRIADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_CRIACAO | DATE | 7 |  |  | Y |  |  |
| ACTUALIZADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_ACTUALIZACAO | DATE | 7 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| PK_CHAVE_DID | P | AMBIENTE_ID | 1 |
| PK_CHAVE_DID | P | CDDEPARTA | 2 |
| PK_CHAVE_DID | P | IMPRESSORA_ID | 3 |
| PK_CHAVE_DID | P | DATA_INICIO | 4 |


## Foreign keys

| CONSTRAINT_NAME | COLUMN_NAME | POSITION | R_OWNER | R_TABLE_NAME |
| --- | --- | --- | --- | --- |
| FK_AMBIENTE_DID | AMBIENTE_ID | 1 | SIID_TESTES | SVR_AMBIENTES_IMPRESSAO |
| FK_IMPRESSORA_DID | IMPRESSORA_ID | 1 | SIID_TESTES | SVR_IMPRESSORAS |


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| IDX_AMBIENTE_DID | NONUNIQUE | AMBIENTE_ID | 1 |
| IDX_CDDEPARTA_DID | NONUNIQUE | CDDEPARTA | 1 |
| IDX_IMPRESSORA_DID | NONUNIQUE | IMPRESSORA_ID | 1 |
| PK_CHAVE_DID | UNIQUE | AMBIENTE_ID | 1 |
| PK_CHAVE_DID | UNIQUE | CDDEPARTA | 2 |
| PK_CHAVE_DID | UNIQUE | IMPRESSORA_ID | 3 |
| PK_CHAVE_DID | UNIQUE | DATA_INICIO | 4 |

