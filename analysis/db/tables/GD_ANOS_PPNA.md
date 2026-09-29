# GD_ANOS_PPNA

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **130**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ANO | NUMBER | 22 |  |  | N |  |  |
| TIPO | VARCHAR2 | 30 |  |  | N |  |  |
| DESCRICAO | VARCHAR2 | 200 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| PK_TIPOANO_GPPNAA | P | ANO | 1 |
| PK_TIPOANO_GPPNAA | P | TIPO | 2 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| PK_TIPOANO_GPPNAA | UNIQUE | ANO | 1 |
| PK_TIPOANO_GPPNAA | UNIQUE | TIPO | 2 |

