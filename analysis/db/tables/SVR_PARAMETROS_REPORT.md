# SVR_PARAMETROS_REPORT

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **1589**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| REPORT_ID | NUMBER | 22 |  |  | N |  |  |
| N_PARAMETRO | NUMBER | 22 |  |  | N |  |  |
| NOME | VARCHAR2 | 240 |  |  | Y |  |  |
| TIPO_PARAMETRO_RF | VARCHAR2 | 10 |  |  | Y |  |  |
| OBRIGATORIO | VARCHAR2 | 1 |  |  | Y | 'N' |  |
| CHECK_UNIQUE | VARCHAR2 | 1 |  |  | Y | 'N' |  |
| VALIDO | VARCHAR2 | 1 |  |  | Y | 'S' |  |
| DESCRICAO | VARCHAR2 | 240 |  |  | Y |  |  |
| CRIADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_CRIACAO | DATE | 7 |  |  | Y |  |  |
| ACTUALIZADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_ACTUALIZACAO | DATE | 7 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| PK_CHAVE_SPR | P | REPORT_ID | 1 |
| PK_CHAVE_SPR | P | N_PARAMETRO | 2 |


## Foreign keys

| CONSTRAINT_NAME | COLUMN_NAME | POSITION | R_OWNER | R_TABLE_NAME |
| --- | --- | --- | --- | --- |
| FK_REPORT_SPR | REPORT_ID | 1 | SIID_TESTES | SVR_REPORT_SIID |


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| IDX_REPORT_SPR | NONUNIQUE | REPORT_ID | 1 |
| PK_CHAVE_SPR | UNIQUE | REPORT_ID | 1 |
| PK_CHAVE_SPR | UNIQUE | N_PARAMETRO | 2 |

