# GD_GENERO_RECIBO

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **181**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ID | NUMBER | 22 |  |  | Y |  |  |
| DESCRICAO | VARCHAR2 | 200 |  |  | Y |  |  |
| VALIDO | VARCHAR2 | 1 |  |  | Y |  |  |
| TIPORECI | NUMBER | 22 |  |  | N |  |  |
| TIPOAVISO | VARCHAR2 | 5 |  |  | N |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| PK_CHAVE_GGR | P | TIPORECI | 1 |
| PK_CHAVE_GGR | P | TIPOAVISO | 2 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| PK_CHAVE_GGR | UNIQUE | TIPORECI | 1 |
| PK_CHAVE_GGR | UNIQUE | TIPOAVISO | 2 |

