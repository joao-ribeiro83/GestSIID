# GD_COMISSOES_RECIBO_MV

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **1172113**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| NMRECIBO | NUMBER | 22 | 10 | 0 | N |  |  |
| CDAGENTE | VARCHAR2 | 15 |  |  | Y |  |  |
| CDTIPCOM | VARCHAR2 | 1 |  |  | Y |  |  |
| PTIMPORT | NUMBER | 22 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| IDX_CHAVE_GCOMR | NONUNIQUE | CDUNIECO | 1 |
| IDX_CHAVE_GCOMR | NONUNIQUE | NMRECIBO | 2 |
| IDX_CHAVE_GCOMR | NONUNIQUE | CDAGENTE | 3 |
| IDX_CHAVE_GCOMR | NONUNIQUE | CDTIPCOM | 4 |

