# GD_ATAS_R2_D21_OUTROS

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **467**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ID | NUMBER | 22 | 10 | 0 | N |  |  |
| LINHA | NUMBER | 22 | 3 | 0 | N |  |  |
| PONTO | VARCHAR2 | 30 |  |  | Y |  |  |
| CONDICAO | VARCHAR2 | 4000 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| ID_ATA_OUTROS_PK | P | ID | 1 |
| ID_ATA_OUTROS_PK | P | LINHA | 2 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| ID_ATA_OUTROS_PK | UNIQUE | ID | 1 |
| ID_ATA_OUTROS_PK | UNIQUE | LINHA | 2 |

