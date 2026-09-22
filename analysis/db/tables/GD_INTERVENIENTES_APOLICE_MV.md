# GD_INTERVENIENTES_APOLICE_MV

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **1982175**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| CDRAMO | NUMBER | 22 | 3 | 0 | N |  |  |
| ESTADO | VARCHAR2 | 1 |  |  | N |  |  |
| NMPOLIZA | NUMBER | 22 | 10 | 0 | N |  |  |
| NMSITUAC | NUMBER | 22 | 6 | 0 | N |  |  |
| CDROL | VARCHAR2 | 2 |  |  | N |  |  |
| CDPERSON | NUMBER | 22 | 9 | 0 | N |  |  |
| NMORDDOM | NUMBER | 22 | 2 | 0 | Y |  |  |
| FEINIVAL | DATE | 7 |  |  | N |  |  |
| FEFINVAL | DATE | 7 |  |  | N |  |  |
| NSUPLOGI | NUMBER | 22 | 10 | 0 | N |  |  |
| NSUPUSUA | NUMBER | 22 | 10 | 0 | Y |  |  |
| NSUPSESS | NUMBER | 22 | 10 | 0 | Y |  |  |
| FESESSIO | DATE | 7 |  |  | Y |  |  |
| CDTIPIDE | VARCHAR2 | 1 |  |  | N |  |  |
| CDIDEPER | VARCHAR2 | 20 |  |  | N |  |  |
| DSNOMBRE | VARCHAR2 | 160 |  |  | N |  |  |
| CDTIPPER | VARCHAR2 | 2 |  |  | Y |  |  |
| CDPAIS | VARCHAR2 | 3 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| IDX_APOLICE_GIA | UNIQUE | CDUNIECO | 1 |
| IDX_APOLICE_GIA | UNIQUE | CDRAMO | 2 |
| IDX_APOLICE_GIA | UNIQUE | ESTADO | 3 |
| IDX_APOLICE_GIA | UNIQUE | NMPOLIZA | 4 |
| IDX_APOLICE_GIA | UNIQUE | NMSITUAC | 5 |
| IDX_APOLICE_GIA | UNIQUE | CDROL | 6 |
| IDX_APOLICE_GIA | UNIQUE | CDPERSON | 7 |

