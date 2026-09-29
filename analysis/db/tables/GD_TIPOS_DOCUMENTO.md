# GD_TIPOS_DOCUMENTO

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **84**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ID | NUMBER | 22 |  |  | N |  |  |
| DESCRICAO | VARCHAR2 | 200 |  |  | Y |  |  |
| DATA_INICIO | DATE | 7 |  |  | N |  |  |
| DATA_FIM | DATE | 7 |  |  | Y |  |  |
| TIPORECI | NUMBER | 22 |  |  | N |  |  |
| SINAL_VALOR | NUMBER | 22 |  |  | N |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| PK_CHAVE_GTD | P | ID | 1 |
| PK_CHAVE_GTD | P | TIPORECI | 2 |
| PK_CHAVE_GTD | P | SINAL_VALOR | 3 |
| PK_CHAVE_GTD | P | DATA_INICIO | 4 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| IDX_TIPORECI_GTD | UNIQUE | TIPORECI | 1 |
| IDX_TIPORECI_GTD | UNIQUE | SINAL_VALOR | 2 |
| IDX_TIPORECI_GTD | UNIQUE | DATA_INICIO | 3 |
| PK_CHAVE_GTD | UNIQUE | ID | 1 |
| PK_CHAVE_GTD | UNIQUE | TIPORECI | 2 |
| PK_CHAVE_GTD | UNIQUE | SINAL_VALOR | 3 |
| PK_CHAVE_GTD | UNIQUE | DATA_INICIO | 4 |

