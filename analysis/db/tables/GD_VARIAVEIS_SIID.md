# GD_VARIAVEIS_SIID

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **4**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| NOME | VARCHAR2 | 30 |  |  | N |  |  |
| TIPO | VARCHAR2 | 3 |  |  | N | 'DIR' |  |
| VALOR | VARCHAR2 | 2000 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| PK_CHAVE_GVS | P | NOME | 1 |
| PK_CHAVE_GVS | P | TIPO | 2 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| PK_CHAVE_GVS | UNIQUE | NOME | 1 |
| PK_CHAVE_GVS | UNIQUE | TIPO | 2 |

