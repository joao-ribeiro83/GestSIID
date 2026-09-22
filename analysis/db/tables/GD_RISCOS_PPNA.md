# GD_RISCOS_PPNA

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **1625935**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 |  |  | N |  |  |
| NMRECIBO | NUMBER | 22 |  |  | N |  |  |
| MES | DATE | 7 |  |  | N |  |  |
| RISCO | NUMBER | 22 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| PK_RISCO_PPNAR | P | CDUNIECO | 1 |
| PK_RISCO_PPNAR | P | NMRECIBO | 2 |
| PK_RISCO_PPNAR | P | MES | 3 |


## Foreign keys

| CONSTRAINT_NAME | COLUMN_NAME | POSITION | R_OWNER | R_TABLE_NAME |
| --- | --- | --- | --- | --- |
| FK_RECIBO_PPNAR | CDUNIECO | 1 | SIID_TESTES | GD_RECIBOS_PPNA |
| FK_RECIBO_PPNAR | NMRECIBO | 2 | SIID_TESTES | GD_RECIBOS_PPNA |


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| PK_RISCO_PPNAR | UNIQUE | CDUNIECO | 1 |
| PK_RISCO_PPNAR | UNIQUE | NMRECIBO | 2 |
| PK_RISCO_PPNAR | UNIQUE | MES | 3 |

