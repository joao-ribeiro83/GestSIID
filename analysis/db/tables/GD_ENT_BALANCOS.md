# GD_ENT_BALANCOS

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **725729**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDPERSON | NUMBER | 22 | 9 | 0 | N |  |  |
| ANOBAL | NUMBER | 22 | 4 | 0 | N |  |  |
| TIPOBALAN | VARCHAR2 | 2 |  |  | N |  |  |
| VOLUME_NEGOCIO | NUMBER | 22 |  |  | Y |  |  |
| TOTAL_PASSIVO | NUMBER | 22 |  |  | Y |  |  |
| VOL_NEGOCIOS_INTERNO | NUMBER | 22 |  |  | Y |  |  |
| VOL_NEGOCIOS_COMUNITARIO | NUMBER | 22 |  |  | Y |  |  |
| VOL_NEGOCIOS_EXTRA | NUMBER | 22 |  |  | Y |  |  |
| PASSIVO_VOL_NEG | NUMBER | 22 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| GD_ENT_BALANCOS_INDX | UNIQUE | CDPERSON | 1 |

