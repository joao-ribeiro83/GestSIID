# GD_APOLICES_RETENCAO

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **253**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 |  |  | N |  |  |
| CDRAMO | NUMBER | 22 |  |  | N |  |  |
| NMPOLIZA | NUMBER | 22 |  |  | N |  |  |
| CRIADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| CRIADO_EM | DATE | 7 |  |  | Y |  |  |
| ACTUALIZADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| ACTUALIZADO_EM | DATE | 7 |  |  | Y |  |  |
| GARANT_BN | VARCHAR2 | 1 |  |  | N |  |  |
| TITULO_BN | VARCHAR2 | 1 |  |  | N |  |  |
| RECIBO_BN | VARCHAR2 | 1 |  |  | N |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| GD_APOLICES_RETENCAO_PK | P | CDUNIECO | 1 |
| GD_APOLICES_RETENCAO_PK | P | CDRAMO | 2 |
| GD_APOLICES_RETENCAO_PK | P | NMPOLIZA | 3 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| GD_APOLICES_RETENCAO_PK | UNIQUE | CDUNIECO | 1 |
| GD_APOLICES_RETENCAO_PK | UNIQUE | CDRAMO | 2 |
| GD_APOLICES_RETENCAO_PK | UNIQUE | NMPOLIZA | 3 |

