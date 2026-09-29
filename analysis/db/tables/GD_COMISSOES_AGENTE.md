# GD_COMISSOES_AGENTE

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **223289**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| NMRECIBO | NUMBER | 22 | 10 | 0 | N |  |  |
| CDAGENTE | VARCHAR2 | 15 |  |  | N |  |  |
| PTIMPORT | NUMBER | 22 |  |  | Y |  |  |
| VALOR_NORMAL | NUMBER | 22 |  |  | Y |  |  |
| VALOR_REPERCUTIDO | NUMBER | 22 |  |  | Y |  |  |
| VALOR_IRS | NUMBER | 22 |  |  | Y |  |  |
| VALOR_SELO | NUMBER | 22 |  |  | Y |  |  |
| VALOR_IVA | NUMBER | 22 |  |  | Y |  |  |
| VALOR_OUTROS | NUMBER | 22 |  |  | Y |  |  |
| DATA_CRIACAO | DATE | 7 |  |  | Y |  |  |
| DATA_LIQUIDACAO | DATE | 7 |  |  | Y |  |  |
| DATA_ACTUALIZACAO | DATE | 7 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| SYS_C0060396 | P | CDUNIECO | 1 |
| SYS_C0060396 | P | NMRECIBO | 2 |
| SYS_C0060396 | P | CDAGENTE | 3 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| SYS_C0060396 | UNIQUE | CDUNIECO | 1 |
| SYS_C0060396 | UNIQUE | NMRECIBO | 2 |
| SYS_C0060396 | UNIQUE | CDAGENTE | 3 |

