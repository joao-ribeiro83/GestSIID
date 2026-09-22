# GD_ENT_PEDIDO_INFO_M91

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **893405**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDPERSON | NUMBER | 22 | 9 | 0 | N |  |  |
| CDFUERES | VARCHAR2 | 4 |  |  | Y |  |  |
| FEPEDIDO | DATE | 7 |  |  | N |  |  |
| FERESPOS | DATE | 7 |  |  | Y |  |  |
| CDESTADO | VARCHAR2 | 1 |  |  | Y |  |  |
| NMPEDIDO | VARCHAR2 | 10 |  |  | N |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| GD_ENT_PEDIDO_INFO_M91_INDX | UNIQUE | CDPERSON | 1 |

