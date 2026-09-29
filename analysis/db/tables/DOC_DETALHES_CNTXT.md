# DOC_DETALHES_CNTXT

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **0**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CONTEXTO_ID | NUMBER | 22 |  |  | N |  |  |
| NUMERO_CAMPO | NUMBER | 22 |  |  | N |  |  |
| DESCRICAO | VARCHAR2 | 240 |  |  | Y |  |  |
| TIPO | VARCHAR2 | 60 |  |  | Y |  |  |
| PRECISAO | NUMBER | 22 |  |  | Y |  |  |
| TABELA | VARCHAR2 | 60 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| DETALHE_PK | P | NUMERO_CAMPO | 1 |
| DETALHE_PK | P | CONTEXTO_ID | 2 |


## Foreign keys

| CONSTRAINT_NAME | COLUMN_NAME | POSITION | R_OWNER | R_TABLE_NAME |
| --- | --- | --- | --- | --- |
| DETALHE_CONTEXTO_FK | CONTEXTO_ID | 1 | SIID_TESTES | DOC_CONTEXTOS_APR |


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| DETALHE_CONTEXTO_FK_I | NONUNIQUE | CONTEXTO_ID | 1 |
| DETALHE_PK | UNIQUE | NUMERO_CAMPO | 1 |
| DETALHE_PK | UNIQUE | CONTEXTO_ID | 2 |

