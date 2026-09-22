# SVR_DOCUMENTO_COMENTARIOS

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **3596**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| COMENTARIO_ID | NUMBER | 22 |  |  | N |  |  |
| DATA | DATE | 7 |  |  | Y |  |  |
| COMENTARIO | VARCHAR2 | 2000 |  |  | Y |  |  |
| USER_ID | VARCHAR2 | 50 |  |  | Y |  |  |
| DOCUMENTO_ID | NUMBER | 22 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| SDOCOMENTS_PK | P | COMENTARIO_ID | 1 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| IDX_SVRDOCCOM_DOCID | NONUNIQUE | DOCUMENTO_ID | 1 |
| SDOCOMENTS_PK | UNIQUE | COMENTARIO_ID | 1 |

