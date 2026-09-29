# GD_RATINGS_ENTIDADE_MV

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

> snapshot table for snapshot DISCOSEC.GD_RATINGS_ENTIDADE_MV

Row count: **0**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| NMORDINA | NUMBER | 22 | 18 | 0 | Y |  |  |
| CDPERSON | NUMBER | 22 | 9 | 0 | Y |  |  |
| NMMODELO | NUMBER | 22 | 4 | 0 | Y |  |  |
| CDVALOR | VARCHAR2 | 4 |  |  | Y |  |  |
| FEPROCES | DATE | 7 |  |  | Y |  |  |
| STATUS | VARCHAR2 | 1 |  |  | Y |  |  |
| CDANALIS | VARCHAR2 | 30 |  |  | Y |  |  |
| FEANALIS | DATE | 7 |  |  | Y |  |  |
| CDDECISO | VARCHAR2 | 30 |  |  | Y |  |  |
| FEDECISO | DATE | 7 |  |  | Y |  |  |
| NMPEDIDO | VARCHAR2 | 10 |  |  | Y |  |  |
| NMEVENTO | NUMBER | 22 | 3 | 0 | Y |  |  |
| CDIDUSR | VARCHAR2 | 30 |  |  | Y |  |  |
| CREATED_DATE | DATE | 7 |  |  | Y |  |  |
| SWMANUAL | VARCHAR2 | 1 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| IDX_ENTIDADE_GREM | UNIQUE | CDPERSON | 1 |
| IDX_RATING_GREM | UNIQUE | CDVALOR | 1 |
| IDX_RATING_GREM | UNIQUE | CDPERSON | 2 |

