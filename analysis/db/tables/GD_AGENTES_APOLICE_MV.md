# GD_AGENTES_APOLICE_MV

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **66040**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| CDRAMO | NUMBER | 22 | 3 | 0 | N |  |  |
| ESTADO | VARCHAR2 | 1 |  |  | N |  |  |
| NMPOLIZA | NUMBER | 22 | 10 | 0 | N |  |  |
| CDTIPOAG | VARCHAR2 | 1 |  |  | N |  |  |
| PORREDAU | NUMBER | 22 | 5 | 2 | N |  |  |
| STATUS | VARCHAR2 | 1 |  |  | N |  |  |
| CDAGENTE | VARCHAR2 | 15 |  |  | N |  |  |
| CDCLAAGE | VARCHAR2 | 2 |  |  | N |  |  |
| FEDESDE | DATE | 7 |  |  | N |  |  |
| FEHASTA | DATE | 7 |  |  | Y |  |  |
| CDPERSON | NUMBER | 22 | 9 | 0 | N |  |  |
| NMORDDOM | NUMBER | 22 | 2 | 0 | Y |  |  |
| CDTIPIDE | VARCHAR2 | 1 |  |  | N |  |  |
| CDIDEPER | VARCHAR2 | 20 |  |  | N |  |  |
| NOME_AGENTE | VARCHAR2 | 160 |  |  | N |  |  |
| CDPAIS | VARCHAR2 | 3 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| IDX_APOLIAGE_GAGA | UNIQUE | CDUNIECO | 1 |
| IDX_APOLIAGE_GAGA | UNIQUE | CDRAMO | 2 |
| IDX_APOLIAGE_GAGA | UNIQUE | ESTADO | 3 |
| IDX_APOLIAGE_GAGA | UNIQUE | NMPOLIZA | 4 |
| IDX_APOLIAGE_GAGA | UNIQUE | CDAGENTE | 5 |

