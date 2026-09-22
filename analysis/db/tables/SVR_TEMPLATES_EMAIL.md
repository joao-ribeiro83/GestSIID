# SVR_TEMPLATES_EMAIL

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **21**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ID | NUMBER | 22 |  |  | N |  |  |
| MODELO_ID | VARCHAR2 | 10 |  |  | N |  |  |
| NOME | VARCHAR2 | 100 |  |  | N |  |  |
| MAIL_FROM | VARCHAR2 | 100 |  |  | N |  |  |
| MAIL_SUBJECT | VARCHAR2 | 500 |  |  | N |  |  |
| MAIL_MESSAGE | VARCHAR2 | 2000 |  |  | Y |  |  |
| MAIL_BCC | VARCHAR2 | 100 |  |  | Y |  |  |
| VALIDO | CHAR | 1 |  |  | N | 'S'  |  |
| CRIADO_POR | VARCHAR2 | 30 |  |  | N |  |  |
| DATA_CRIACAO | DATE | 7 |  |  | N |  |  |
| ACTUALIZADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_ACTUALIZACAO | DATE | 7 |  |  | Y |  |  |
| XLSX_ATTACH | VARCHAR2 | 255 |  |  | Y |  |  |
| MAIL_CC | VARCHAR2 | 100 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| PK_ID_STEM | P | ID | 1 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| PK_ID_STEM | UNIQUE | ID | 1 |

