# ERR_TECNICOS_SUPORTE

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **0**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PROGRAMADOR_ID | NUMBER | 22 |  |  | N |  |  |
| TEMPLATE_ID | VARCHAR2 | 10 |  |  | N |  |  |
| DATA_INICIO | DATE | 7 |  |  | N |  |  |
| DATA_FIM | DATE | 7 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| ETECSUP_PK | P | PROGRAMADOR_ID | 1 |
| ETECSUP_PK | P | TEMPLATE_ID | 2 |
| ETECSUP_PK | P | DATA_INICIO | 3 |


## Foreign keys

| CONSTRAINT_NAME | COLUMN_NAME | POSITION | R_OWNER | R_TABLE_NAME |
| --- | --- | --- | --- | --- |
| ETECSUP_DPRGRM_FK | PROGRAMADOR_ID | 1 | SIID_TESTES | DOC_PROGRAMADORES |


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| ETECSUP_DPRGRM_FK_I | NONUNIQUE | PROGRAMADOR_ID | 1 |
| ETECSUP_PK | UNIQUE | PROGRAMADOR_ID | 1 |
| ETECSUP_PK | UNIQUE | TEMPLATE_ID | 2 |
| ETECSUP_PK | UNIQUE | DATA_INICIO | 3 |
| ETECSUP_TEMPLATE_FK_I | NONUNIQUE | TEMPLATE_ID | 1 |

