# SVR_IMPRESSORAS

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **38**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ID | VARCHAR2 | 30 |  |  | N |  |  |
| DESCRICAO | VARCHAR2 | 240 |  |  | Y |  |  |
| ENDERECO | VARCHAR2 | 240 |  |  | Y |  |  |
| SERVIDOR | VARCHAR2 | 60 |  |  | Y |  |  |
| VALIDO | VARCHAR2 | 1 |  |  | Y |  |  |
| CRIADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_CRIACAO | DATE | 7 |  |  | Y |  |  |
| ACTUALIZADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_ACTUALIZACAO | DATE | 7 |  |  | Y |  |  |
| GSDEVICE_RF | VARCHAR2 | 30 |  |  | Y | 'PXLCOLOR' |  |
| GSPAPERSIZE_RF | VARCHAR2 | 30 |  |  | Y | 'A4' |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| IMPRESSORA_PK | P | ID | 1 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| IMPRESSORA_PK | UNIQUE | ID | 1 |

