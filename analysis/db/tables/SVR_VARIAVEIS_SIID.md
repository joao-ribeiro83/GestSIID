# SVR_VARIAVEIS_SIID

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **11**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AMBIENTE_ID | VARCHAR2 | 30 |  |  | N |  |  |
| VALOR | VARCHAR2 | 2000 |  |  | Y |  |  |
| TIPO_VARIAVEL_RF | VARCHAR2 | 16 |  |  | N |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| PK_CHAVE_SVS | P | AMBIENTE_ID | 1 |
| PK_CHAVE_SVS | P | TIPO_VARIAVEL_RF | 2 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| PK_CHAVE_SVS | UNIQUE | AMBIENTE_ID | 1 |
| PK_CHAVE_SVS | UNIQUE | TIPO_VARIAVEL_RF | 2 |


## First 200 rows

| AMBIENTE_ID | VALOR | TIPO_VARIAVEL_RF |
| --- | --- | --- |
| GADOR_TESTES | 14 | LIMITE_NOTIF |
| GADOR_TESTES | 15 | PERIODO_GRACA |
| GADOR_TESTES | C:\Program Files\gs\gs9.56.1\bin\gswin64.exe | GS |
| GADOR_TESTES | *** | PASSWORD |
| GADOR_TESTES | D:\ | ONLINE |
| GADOR_TESTES | *** | PASSWORD_OLD |
| GADOR_TESTES | \\\ssiidt\DOCUMENTOS\TESTE\pdf\; | PDF |
| GADOR_TESTES | \\\ssiidt\documentos\backup\teste | BACKUP |
| GADOR_TESTES | \\ssiidt\DOCUMENTOS\TESTE\pdf\; | PDF_ONLINE |
| GADOR_TESTES | c:\Program Files\gs\gs8.70\bin\gswin32.exe | GS_OLD |
| Testjd |  | SLB |

