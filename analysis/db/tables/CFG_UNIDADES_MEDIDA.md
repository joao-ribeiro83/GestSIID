# CFG_UNIDADES_MEDIDA

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **11**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GEN_MEDIDA_RF | VARCHAR2 | 10 |  |  | Y |  |  |
| ID | VARCHAR2 | 10 |  |  | N |  |  |
| NOME | VARCHAR2 | 60 |  |  | Y |  |  |
| UNIDADE_BASE_ID | VARCHAR2 | 10 |  |  | Y |  |  |
| FACTOR | NUMBER | 22 |  |  | Y |  |  |
| CRIADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_CRIACAO | DATE | 7 |  |  | Y |  |  |
| ACTUALIZADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_ACTUALIZACAO | DATE | 7 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| PK_CHAVE_CUM | P | ID | 1 |


## Foreign keys

| CONSTRAINT_NAME | COLUMN_NAME | POSITION | R_OWNER | R_TABLE_NAME |
| --- | --- | --- | --- | --- |
| FK_UNIDADEBASE_CUM | UNIDADE_BASE_ID | 1 | SIID_TESTES | CFG_UNIDADES_MEDIDA |


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| PK_CHAVE_CUM | UNIQUE | ID | 1 |


## First 200 rows

| GEN_MEDIDA_RF | ID | NOME | UNIDADE_BASE_ID | FACTOR | CRIADO_POR | DATA_CRIACAO | ACTUALIZADO_POR | DATA_ACTUALIZACAO |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DIGITAL | BYTES | Bytes |  | 1 | DISCOSECFOR | Mon Feb 15 2010 12:52:27 GMT+0000 (Western European Standard Time) |  |  |
| DIGITAL | GB | Gigabytes | BYTES | 1000000000 | DISCOSECFOR | Mon Feb 15 2010 12:52:41 GMT+0000 (Western European Standard Time) |  |  |
| DIGITAL | GIB | Gibibytes | BYTES | 1073741824 | DISCOSECFOR | Mon Feb 15 2010 12:52:57 GMT+0000 (Western European Standard Time) |  |  |
| DIGITAL | KB | Kilobytes | BYTES | 1000 | DISCOSECFOR | Mon Feb 15 2010 12:52:33 GMT+0000 (Western European Standard Time) |  |  |
| DIGITAL | KIB | Kibibytes | BYTES | 1024 | DISCOSECFOR | Mon Feb 15 2010 12:53:01 GMT+0000 (Western European Standard Time) |  |  |
| DIGITAL | MB | Megabytes | BYTES | 1000000 | DISCOSECFOR | Mon Feb 15 2010 12:52:37 GMT+0000 (Western European Standard Time) |  |  |
| DIGITAL | MIB | Mebibytes | BYTES | 1048576 | DISCOSECFOR | Mon Feb 15 2010 12:53:06 GMT+0000 (Western European Standard Time) |  |  |
| DIGITAL | PB | Petabytes | BYTES | 1000000000000000 | DISCOSECFOR | Mon Feb 15 2010 12:52:53 GMT+0000 (Western European Standard Time) |  |  |
| DIGITAL | PIB | Pebibytes | BYTES | 1125899906842624 | DISCOSECFOR | Mon Feb 15 2010 12:53:13 GMT+0000 (Western European Standard Time) |  |  |
| DIGITAL | TB | Terabytes | BYTES | 1000000000000 | DISCOSECFOR | Mon Feb 15 2010 12:52:46 GMT+0000 (Western European Standard Time) |  |  |
| DIGITAL | TIB | Tebibytes | BYTES | 1099511627776 | DISCOSECFOR | Mon Feb 15 2010 12:53:09 GMT+0000 (Western European Standard Time) |  |  |

