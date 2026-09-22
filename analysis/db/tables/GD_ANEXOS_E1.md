# GD_ANEXOS_E1

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **122**

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
| E12_BN | VARCHAR2 | 1 |  |  | Y |  |  |
| E13_BN | VARCHAR2 | 1 |  |  | Y |  |  |
| E16_BN | VARCHAR2 | 1 |  |  | Y |  |  |
| E17_BN | VARCHAR2 | 1 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| GD_ANEXOS_E1_PK | P | CDUNIECO | 1 |
| GD_ANEXOS_E1_PK | P | CDRAMO | 2 |
| GD_ANEXOS_E1_PK | P | NMPOLIZA | 3 |
| GD_ANEXOS_E1_PK | P | DATA_INICIO | 4 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| GD_ANEXOS_E1_PK | UNIQUE | CDUNIECO | 1 |
| GD_ANEXOS_E1_PK | UNIQUE | CDRAMO | 2 |
| GD_ANEXOS_E1_PK | UNIQUE | NMPOLIZA | 3 |
| GD_ANEXOS_E1_PK | UNIQUE | DATA_INICIO | 4 |

