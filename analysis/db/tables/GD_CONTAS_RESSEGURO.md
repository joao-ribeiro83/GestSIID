# GD_CONTAS_RESSEGURO

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **55**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ID | NUMBER | 22 |  |  | N |  |  |
| DESCRICAO | VARCHAR2 | 100 |  |  | Y |  |  |
| LABEL_INGLES | VARCHAR2 | 100 |  |  | Y |  |  |
| TIPO_EMISSAO | VARCHAR2 | 1 |  |  | Y |  |  |
| FORMA_CALCULO | VARCHAR2 | 2 |  |  | Y | 'S' |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| PK_ID_GDR | P | ID | 1 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| PK_ID_GDR | UNIQUE | ID | 1 |

