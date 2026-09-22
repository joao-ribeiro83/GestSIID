# DOC_LOTES_IMPRESSAO

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **12**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ID | NUMBER | 22 |  |  | N |  |  |
| NOME | VARCHAR2 | 60 |  |  | Y |  |  |
| DESCRICAO | VARCHAR2 | 200 |  |  | Y |  |  |
| TIPO_ORDENACAO_RF | NUMBER | 22 |  |  | Y | 1 |  |
| DOCUMENTO_GERADO_ID | VARCHAR2 | 10 |  |  | Y |  |  |
| CRIADO_POR | VARCHAR2 | 30 |  |  | Y | user |  |
| DATA_CRIACAO | DATE | 7 |  |  | Y | sysdate |  |
| ACTUALIZADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_ACTUALIZACAO | DATE | 7 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| PK_ID_DLI | P | ID | 1 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| PK_ID_DLI | UNIQUE | ID | 1 |

