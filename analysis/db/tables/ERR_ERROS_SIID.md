# ERR_ERROS_SIID

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **7455387**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ID | NUMBER | 22 |  |  | N |  |  |
| TIPO_ERROSIID | VARCHAR2 | 10 |  |  | Y |  |  |
| MODELO_ID | VARCHAR2 | 15 |  |  | Y |  |  |
| QUEUE_ID | NUMBER | 22 |  |  | Y |  |  |
| DATA_ERRO | DATE | 7 |  |  | Y |  |  |
| ERROTIPO_ID | NUMBER | 22 |  |  | Y |  |  |
| DESCRICAO | VARCHAR2 | 2000 |  |  | Y |  |  |
| DOCUMENTO_ID | NUMBER | 22 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| ERROSIID_PK | P | ID | 1 |


## Foreign keys

| CONSTRAINT_NAME | COLUMN_NAME | POSITION | R_OWNER | R_TABLE_NAME |
| --- | --- | --- | --- | --- |
| ERROSIID_ERROTIPO_FK | ERROTIPO_ID | 1 | SIID_TESTES | ERR_ERROS_TIPO |


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| DOCUMENTO_ID_EES_IDX | NONUNIQUE | DOCUMENTO_ID | 1 |
| ERROSIID_ERROTIPO_FK_I | NONUNIQUE | ERROTIPO_ID | 1 |
| ERROSIID_MODELO_FK_I | NONUNIQUE | MODELO_ID | 1 |
| ERROSIID_PK | UNIQUE | ID | 1 |
| ERROSIID_QUEUE_FK_I | NONUNIQUE | QUEUE_ID | 1 |
| IDX_DATAERRO_EES | NONUNIQUE | DATA_ERRO | 1 |

