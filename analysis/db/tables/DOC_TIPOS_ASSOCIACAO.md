# DOC_TIPOS_ASSOCIACAO

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **1**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ID | VARCHAR2 | 10 |  |  | N |  |  |
| NOME | VARCHAR2 | 60 |  |  | Y |  |  |
| DESCRICAO | VARCHAR2 | 240 |  |  | Y |  |  |
| CRIADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_CRIACAO | DATE | 7 |  |  | Y |  |  |
| ACTUALIZADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_ACTUALIZACAO | DATE | 7 |  |  | Y |  |  |
| VALIDO | VARCHAR2 | 1 |  |  | Y | 'S' |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| TIPOASSOC_PK | P | ID | 1 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| TIPOASSOC_PK | UNIQUE | ID | 1 |

