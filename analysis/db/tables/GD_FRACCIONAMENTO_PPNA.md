# GD_FRACCIONAMENTO_PPNA

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **2304547**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 |  |  | N |  |  |
| NMRECIBO | NUMBER | 22 |  |  | N |  |  |
| MES_RISCO | DATE | 7 |  |  | N |  |  |
| MES_FRACCAO | DATE | 7 |  |  | N |  |  |
| FRACCAO | NUMBER | 22 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| PK_FRAC_PPNAF | P | CDUNIECO | 1 |
| PK_FRAC_PPNAF | P | NMRECIBO | 2 |
| PK_FRAC_PPNAF | P | MES_RISCO | 3 |
| PK_FRAC_PPNAF | P | MES_FRACCAO | 4 |


## Foreign keys

| CONSTRAINT_NAME | COLUMN_NAME | POSITION | R_OWNER | R_TABLE_NAME |
| --- | --- | --- | --- | --- |
| FK_RISCO_PPNAF | CDUNIECO | 1 | SIID_TESTES | GD_RISCOS_PPNA |
| FK_RISCO_PPNAF | NMRECIBO | 2 | SIID_TESTES | GD_RISCOS_PPNA |
| FK_RISCO_PPNAF | MES_RISCO | 3 | SIID_TESTES | GD_RISCOS_PPNA |


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| PK_FRAC_PPNAF | UNIQUE | CDUNIECO | 1 |
| PK_FRAC_PPNAF | UNIQUE | NMRECIBO | 2 |
| PK_FRAC_PPNAF | UNIQUE | MES_RISCO | 3 |
| PK_FRAC_PPNAF | UNIQUE | MES_FRACCAO | 4 |

