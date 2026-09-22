# GD_TIPODOC_R2_D40

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **26**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TIPO_DOC_ID | NUMBER | 22 |  |  | N |  |  |
| TIPO_DOC_DESC | VARCHAR2 | 60 |  |  | Y |  |  |
| ATRIB11 | NUMBER | 22 |  |  | N |  | Grupo de Cobertura |
| ATRIB13 | NUMBER | 22 |  |  | N |  | Tipo de Vigência |
| ATRIB17 | NUMBER | 22 |  |  | N |  | Quadro Legal |
| ATRIB18 | NUMBER | 22 |  |  | N |  | Tipo de Condições Geral |
| ATRIB40 | NUMBER | 22 |  |  | N |  | Natureza Segurado |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| GD_TIPODOC_R2_D40_PK | P | ATRIB11 | 1 |
| GD_TIPODOC_R2_D40_PK | P | ATRIB13 | 2 |
| GD_TIPODOC_R2_D40_PK | P | ATRIB17 | 3 |
| GD_TIPODOC_R2_D40_PK | P | ATRIB18 | 4 |
| GD_TIPODOC_R2_D40_PK | P | ATRIB40 | 5 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| GD_TIPODOC_R2_D40_PK | UNIQUE | ATRIB11 | 1 |
| GD_TIPODOC_R2_D40_PK | UNIQUE | ATRIB13 | 2 |
| GD_TIPODOC_R2_D40_PK | UNIQUE | ATRIB17 | 3 |
| GD_TIPODOC_R2_D40_PK | UNIQUE | ATRIB18 | 4 |
| GD_TIPODOC_R2_D40_PK | UNIQUE | ATRIB40 | 5 |

