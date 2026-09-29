# GD_ATAS_R2_D21_OLD

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **112**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ID | NUMBER | 22 | 10 | 0 | N |  |  |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| CDRAMO | NUMBER | 22 | 3 | 0 | N |  |  |
| NMPOLIZA | NUMBER | 22 | 10 | 0 | N |  |  |
| DATA_EFEITO | DATE | 7 |  |  | Y |  |  |
| N_ATA | VARCHAR2 | 10 |  |  | Y |  |  |
| P_ATA | VARCHAR2 | 1 |  |  | Y |  |  |
| P_ALTERADOS | VARCHAR2 | 30 |  |  | Y |  |  |
| P_OUTROS | VARCHAR2 | 2000 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| ID_ATA | P | ID | 1 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| ID_ATA | UNIQUE | ID | 1 |

