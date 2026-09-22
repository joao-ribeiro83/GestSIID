# GD_TFECIERR_HIST

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **160**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 | 3 | 0 | Y |  |  |
| DTABERTURA | DATE | 7 |  |  | Y |  |  |
| DTFECHO | DATE | 7 |  |  | Y |  |  |
| DTPROCES | DATE | 7 |  |  | Y |  |  |
| CDIDUSR | VARCHAR2 | 30 |  |  | Y |  |  |
| DT_INIT | DATE | 7 |  |  | Y |  |  |
| DT_FIM | DATE | 7 |  |  | Y |  |  |
| DT_REGISTO | DATE | 7 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| GD_TFECIERR_HIST_INDX | NONUNIQUE | CDUNIECO | 1 |
| GD_TFECIERR_HIST_INDX | NONUNIQUE | DTABERTURA | 2 |
| GD_TFECIERR_HIST_INDX | NONUNIQUE | DTFECHO | 3 |

