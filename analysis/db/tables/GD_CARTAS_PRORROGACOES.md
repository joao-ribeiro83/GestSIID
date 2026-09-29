# GD_CARTAS_PRORROGACOES

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **7648**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| NMCOMPRG | NUMBER | 22 |  |  | N |  |  |
| REF_DOCUMENTO | VARCHAR2 | 60 |  |  | Y |  |  |
| DATA_DOCUMENTO | DATE | 7 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| PK_NMCOMPRG_GCP | P | NMCOMPRG | 1 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| PK_NMCOMPRG_GCP | UNIQUE | NMCOMPRG | 1 |
| UK_DOCPRORROG_GDP | UNIQUE | REF_DOCUMENTO | 1 |
| UK_DOCPRORROG_GDP | UNIQUE | NMCOMPRG | 2 |

