# GD_SINISTROS_MIGRADOS

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **7**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AAAPERTU | NUMBER | 22 |  |  | N |  |  |
| CDRAMO | NUMBER | 22 |  |  | N |  |  |
| LIMITE_MIGRACAO | NUMBER | 22 |  |  | N |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| PK_CHAVE_GSM | P | AAAPERTU | 1 |
| PK_CHAVE_GSM | P | CDRAMO | 2 |
| PK_CHAVE_GSM | P | LIMITE_MIGRACAO | 3 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| PK_CHAVE_GSM | UNIQUE | AAAPERTU | 1 |
| PK_CHAVE_GSM | UNIQUE | CDRAMO | 2 |
| PK_CHAVE_GSM | UNIQUE | LIMITE_MIGRACAO | 3 |

