# GD_APOLICES_CVR

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **765**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 |  |  | N |  |  |
| CDRAMO | NUMBER | 22 |  |  | N |  |  |
| NMPOLIZA | NUMBER | 22 |  |  | N |  |  |
| DATA_INICIO | DATE | 7 |  |  | N |  |  |
| DATA_FIM | DATE | 7 |  |  | Y |  |  |
| CRIADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| CRIADO_EM | DATE | 7 |  |  | Y |  |  |
| ACTUALIZADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| ACTUALIZADO_EM | DATE | 7 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| APOLICES_CVR_PK | P | CDUNIECO | 1 |
| APOLICES_CVR_PK | P | CDRAMO | 2 |
| APOLICES_CVR_PK | P | NMPOLIZA | 3 |
| APOLICES_CVR_PK | P | DATA_INICIO | 4 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| APOLICES_CVR_PK | UNIQUE | CDUNIECO | 1 |
| APOLICES_CVR_PK | UNIQUE | CDRAMO | 2 |
| APOLICES_CVR_PK | UNIQUE | NMPOLIZA | 3 |
| APOLICES_CVR_PK | UNIQUE | DATA_INICIO | 4 |

