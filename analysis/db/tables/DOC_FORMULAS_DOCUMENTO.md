# DOC_FORMULAS_DOCUMENTO

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **71**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ID | NUMBER | 22 |  |  | N |  |  |
| NOME | VARCHAR2 | 60 |  |  | Y |  |  |
| DESCRICAO | VARCHAR2 | 200 |  |  | Y |  |  |
| TIPOFORMULA_ID | VARCHAR2 | 60 |  |  | Y |  |  |
| TIPORESULT_ID | VARCHAR2 | 60 |  |  | Y |  |  |
| ACTIVO | VARCHAR2 | 1 |  |  | Y | 'S' |  |
| SQL_TEXT | VARCHAR2 | 2000 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| PK_ID_DFD | P | ID | 1 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| PK_ID_DFD | UNIQUE | ID | 1 |

