# SVR_GESTAO_SIID_DIRECTORIAS

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **3**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AMBIENTE_ID | VARCHAR2 | 30 |  |  | N |  |  |
| DIRECTORIA | VARCHAR2 | 2000 |  |  | Y |  |  |
| TIPO_DIRECTORIA_RF | VARCHAR2 | 16 |  |  | N |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| PK_CHAVE_GSD | P | AMBIENTE_ID | 1 |
| PK_CHAVE_GSD | P | TIPO_DIRECTORIA_RF | 2 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| PK_CHAVE_GSD | UNIQUE | AMBIENTE_ID | 1 |
| PK_CHAVE_GSD | UNIQUE | TIPO_DIRECTORIA_RF | 2 |

