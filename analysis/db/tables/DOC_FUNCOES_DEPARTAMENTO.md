# DOC_FUNCOES_DEPARTAMENTO

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **13**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ID | VARCHAR2 | 15 |  |  | N |  |  |
| NOME | VARCHAR2 | 60 |  |  | Y |  |  |
| DESCRICAO | VARCHAR2 | 240 |  |  | Y |  |  |
| REGISTO_VALIDO | VARCHAR2 | 1 |  |  | Y | 'S' |  |
| DATA_CRIACAO | DATE | 7 |  |  | Y | SYSDATE |  |
| CRIADO_POR | VARCHAR2 | 30 |  |  | Y | USER |  |
| DATA_ACTUALIZACAO | DATE | 7 |  |  | Y |  |  |
| ACTUALIZADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| PK_ID_FUNCDEP | P | ID | 1 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| PK_ID_FUNCDEP | UNIQUE | ID | 1 |

