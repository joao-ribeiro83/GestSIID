# DOC_PARAMETROS_OMISSAO

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **440**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MODELO_ID | VARCHAR2 | 10 |  |  | N |  |  |
| N_PARAMETRO | NUMBER | 22 |  |  | N |  |  |
| DATA_INICIO | DATE | 7 |  |  | N |  |  |
| VALOR | VARCHAR2 | 240 |  |  | Y |  |  |
| DATA_FIM | DATE | 7 |  |  | Y |  |  |
| CRIADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_CRIACAO | DATE | 7 |  |  | Y |  |  |
| ACTUALIZADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_ACTUALIZACAO | DATE | 7 |  |  | Y |  |  |
| NOME_CONSULTA | VARCHAR2 | 240 |  |  | Y |  |  |
| CONSULTA_ONLINE | VARCHAR2 | 1 |  |  | Y | 'N' |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| PK_ID_DPO | P | MODELO_ID | 1 |
| PK_ID_DPO | P | N_PARAMETRO | 2 |
| PK_ID_DPO | P | DATA_INICIO | 3 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| PK_ID_DPO | UNIQUE | MODELO_ID | 1 |
| PK_ID_DPO | UNIQUE | N_PARAMETRO | 2 |
| PK_ID_DPO | UNIQUE | DATA_INICIO | 3 |

