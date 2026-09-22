# CFG_VALORES_EXTENSO

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **37**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ORDEM | VARCHAR2 | 15 |  |  | N |  |  |
| VALOR | NUMBER | 22 | 2 | 0 | N |  |  |
| EXTENSO | VARCHAR2 | 50 |  |  | N |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| PK_CHAVE_CVE | P | ORDEM | 1 |
| PK_CHAVE_CVE | P | VALOR | 2 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| PK_CHAVE_CVE | UNIQUE | ORDEM | 1 |
| PK_CHAVE_CVE | UNIQUE | VALOR | 2 |

