# CFG_TIPOS_MIDIA

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **7**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ID | VARCHAR2 | 10 |  |  | N |  |  |
| DESIGNACAO | VARCHAR2 | 200 |  |  | Y |  |  |
| DESCRICAO | VARCHAR2 | 2000 |  |  | Y |  |  |
| GEN_MEDIDA_RF | VARCHAR2 | 10 |  |  | Y |  |  |
| UNIDADE_MEDIDA_ID | VARCHAR2 | 10 |  |  | Y |  |  |
| TAMANHO_MIDIA | NUMBER | 22 |  |  | Y |  |  |
| TAMANHO_BYTES | NUMBER | 22 |  |  | Y |  |  |
| CRIADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_CRIACAO | DATE | 7 |  |  | Y |  |  |
| ACTUALIZADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_ACTUALIZACAO | DATE | 7 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| PK_ID_CTM | P | ID | 1 |


## Foreign keys

| CONSTRAINT_NAME | COLUMN_NAME | POSITION | R_OWNER | R_TABLE_NAME |
| --- | --- | --- | --- | --- |
| FK_UNIDADEMEDIDA_CTM | UNIDADE_MEDIDA_ID | 1 | SIID_TESTES | CFG_UNIDADES_MEDIDA |


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| PK_ID_CTM | UNIQUE | ID | 1 |


## First 200 rows

| ID | DESIGNACAO | DESCRICAO | GEN_MEDIDA_RF | UNIDADE_MEDIDA_ID | TAMANHO_MIDIA | TAMANHO_BYTES | CRIADO_POR | DATA_CRIACAO | ACTUALIZADO_POR | DATA_ACTUALIZACAO |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DVD+R47G | DVD+R 4,7 Gb |  | DIGITAL | GB | 4.7 | 4700000000 | DISCOSECFOR | Mon Feb 15 2010 12:57:38 GMT+0000 (Western European Standard Time) |  |  |
| DVD+R85G | DVD+R DL 8,54 Gb |  | DIGITAL | GB | 8.54 | 8540000000 | DISCOSECFOR | Mon Feb 15 2010 12:57:42 GMT+0000 (Western European Standard Time) |  |  |
| DVD-R47G | DVD-R 4,7 Gb |  | DIGITAL | GB | 4.7 | 4700000000 | DISCOSECFOR | Mon Feb 15 2010 12:57:32 GMT+0000 (Western European Standard Time) |  |  |
| DVD-R85G | DVD-R DL 8,54 Gb |  | DIGITAL | GB | 8.54 | 8540000000 | DISCOSECFOR | Mon Feb 15 2010 12:57:35 GMT+0000 (Western European Standard Time) |  |  |
| DVDRAM2G | DVD-RAM 2,6 Gb |  | DIGITAL | GB | 2.6 | 2600000000 | DISCOSECFOR | Mon Feb 15 2010 12:57:20 GMT+0000 (Western European Standard Time) |  |  |
| DVDRAM5G | DVD-RAM 5,2 Gb |  | DIGITAL | GB | 5.2 | 5200000000 | DISCOSECFOR | Mon Feb 15 2010 12:57:24 GMT+0000 (Western European Standard Time) |  |  |
| DVDRAM9G | DVD-RAM 9,4 Gb |  | DIGITAL | GB | 9.4 | 9400000000 | DISCOSECFOR | Mon Feb 15 2010 12:57:28 GMT+0000 (Western European Standard Time) |  |  |

