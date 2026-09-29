# GD_CLIENTES_DILIGENCIA

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **1628**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDPERSON | NUMBER | 22 |  |  | N |  |  |
| DATA_INICIO | DATE | 7 |  |  | N |  |  |
| DATA_FIM | DATE | 7 |  |  | Y |  |  |
| CRIADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_CRIACAO | DATE | 7 |  |  | Y | SYSDATE |  |
| ACTUALIZADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_ACTUALIZACAO | DATE | 7 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| PK_CHAVE_GCD | P | CDPERSON | 1 |
| PK_CHAVE_GCD | P | DATA_INICIO | 2 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| PK_CHAVE_GCD | UNIQUE | CDPERSON | 1 |
| PK_CHAVE_GCD | UNIQUE | DATA_INICIO | 2 |

