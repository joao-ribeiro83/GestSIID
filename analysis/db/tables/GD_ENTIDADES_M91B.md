# GD_ENTIDADES_M91B

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **1605446**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDIDEPER | VARCHAR2 | 20 |  |  | N |  |  |
| CDPERSON | NUMBER | 22 | 9 | 0 | N |  |  |
| DSNOMBRE | VARCHAR2 | 160 |  |  | N |  |  |
| CDPAIS | VARCHAR2 | 3 |  |  | Y |  |  |
| DESC_PAIS | VARCHAR2 | 80 |  |  | N |  |  |
| CDCAE | VARCHAR2 | 5 |  |  | Y |  |  |
| SETOR_ATIVIDADE | VARCHAR2 | 80 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| GD_ENTIDADES_M91B_INDX | UNIQUE | CDPERSON | 1 |
| GD_ENTIDADES_M91B_INDX_2 | NONUNIQUE | CDPERSON | 1 |
| GD_ENTIDADES_M91B_INDX_2 | NONUNIQUE | CDPAIS | 2 |

