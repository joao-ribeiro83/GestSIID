# GD_INTERV_PROPOSTA_MV

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **6904351**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| CDRAMO | NUMBER | 22 | 3 | 0 | N |  |  |
| NMPROPUE | NUMBER | 22 | 10 | 0 | N |  |  |
| NMGARANT | NUMBER | 22 | 6 | 0 | Y |  |  |
| CDROL | VARCHAR2 | 2 |  |  | Y |  |  |
| CDPERSON | NUMBER | 22 | 9 | 0 | N |  |  |
| STATUS | VARCHAR2 | 1 |  |  | N |  |  |
| CDTIPIDE | VARCHAR2 | 1 |  |  | N |  |  |
| CDIDEPER | VARCHAR2 | 20 |  |  | N |  |  |
| DSNOMBRE | VARCHAR2 | 160 |  |  | N |  |  |
| CDTIPPER | VARCHAR2 | 2 |  |  | Y |  |  |
| CDPAIS | VARCHAR2 | 3 |  |  | Y |  |  |
| SEGMENTO_APOLICE | VARCHAR2 | 4000 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| IDX_INTERV_PROPOSTA_GAP | NONUNIQUE | CDUNIECO | 1 |
| IDX_INTERV_PROPOSTA_GAP | NONUNIQUE | CDRAMO | 2 |
| IDX_INTERV_PROPOSTA_GAP | NONUNIQUE | NMPROPUE | 3 |
| IDX_INTERV_PROPOSTA_GAP | NONUNIQUE | NMGARANT | 4 |
| IDX_INTERV_PROPOSTA_GAP | NONUNIQUE | CDROL | 5 |

