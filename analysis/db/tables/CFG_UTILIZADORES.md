# CFG_UTILIZADORES

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **13**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| USERNAME | VARCHAR2 | 30 |  |  | N |  |  |
| PASSWORD | VARCHAR2 | 100 |  |  | Y |  |  |
| NOME | VARCHAR2 | 100 |  |  | Y |  |  |
| AMBIENTE_ID | VARCHAR2 | 30 |  |  | Y |  |  |
| UNIDADE_NEGOCIO_RF | VARCHAR2 | 3 |  |  | Y |  |  |
| TIPO_UTILIZADOR_RF | VARCHAR2 | 4 |  |  | Y |  |  |
| DATA_INICIO | DATE | 7 |  |  | Y |  |  |
| DATA_FIM | DATE | 7 |  |  | Y |  |  |
| NIVEL_ACESSO_RF | NUMBER | 22 | 2 | 0 | Y |  |  |
| CRIADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_CRIACAO | DATE | 7 |  |  | Y |  |  |
| ACTUALIZADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_ACTUALIZACAO | DATE | 7 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| PK_USERNAME_CUT | P | USERNAME | 1 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| PK_USERNAME_CUT | UNIQUE | USERNAME | 1 |

