# DOC_TIPOS_SECCAO

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **61**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ID | VARCHAR2 | 10 |  |  | N |  |  |
| NOME | VARCHAR2 | 60 |  |  | Y |  |  |
| DESCRICAO | VARCHAR2 | 240 |  |  | Y |  |  |
| CRIADO_POR | VARCHAR2 | 30 |  |  | Y | USER |  |
| DATA_CRIACAO | DATE | 7 |  |  | Y | SYSDATE |  |
| ACTUALIZADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_ACTUALIZACAO | DATE | 7 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| TIPOSEC_PK | P | ID | 1 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| TIPOSEC_PK | UNIQUE | ID | 1 |

