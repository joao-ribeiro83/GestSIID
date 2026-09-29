# GD_ENT_CAPITAL_CRED_M91B

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **326580**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDPERSON | NUMBER | 22 | 9 | 0 | N |  |  |
| CAPITAL_DINAMICO | NUMBER | 22 |  |  | Y |  |  |
| CAPITAL_NOMINATIVO | NUMBER | 22 |  |  | Y |  |  |
| CAPITAL_NOMINATIVO_TOM | NUMBER | 22 |  |  | Y |  |  |
| CAPITAL_NOMINATIVO_DOM | NUMBER | 22 |  |  | Y |  |  |
| N_GARANTIAS_NOMINATIVAS | NUMBER | 22 |  |  | Y |  |  |
| N_GARANTIAS_DINAMICAS | NUMBER | 22 |  |  | Y |  |  |
| N_APOLICES | NUMBER | 22 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| GD_ENT_CAPITAL_CRED_M91B_INDX | UNIQUE | CDPERSON | 1 |
| GD_ENT_CAPITAL_CRED_M91B_INDX_2 | NONUNIQUE | CDPERSON | 1 |
| GD_ENT_CAPITAL_CRED_M91B_INDX_2 | NONUNIQUE | CAPITAL_NOMINATIVO | 2 |

