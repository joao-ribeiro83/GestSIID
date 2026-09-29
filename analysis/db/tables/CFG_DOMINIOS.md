# CFG_DOMINIOS

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **37**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ID | VARCHAR2 | 60 |  |  | N |  |  |
| DESCRICAO | VARCHAR2 | 200 |  |  | Y |  |  |
| TIPO_INFORMACAO_RF | VARCHAR2 | 30 |  |  | Y | 'STRING' |  |
| TIPO_DOMINIO_RF | VARCHAR2 | 1 |  |  | Y | 'L' |  |
| TIPO_STRING_RF | VARCHAR2 | 1 |  |  | Y | 'A' |  |
| FORMATACAO_STRING_RF | VARCHAR2 | 1 |  |  | Y | 'M' /* MAIUSCULAS */ |  |
| TAMANHO_MAXIMO | NUMBER | 22 | 3 | 0 | Y |  |  |
| PRECISAO | NUMBER | 22 | 1 | 0 | Y |  |  |
| VALOR_MINIMO | VARCHAR2 | 40 |  |  | Y |  |  |
| VALOR_MAXIMO | VARCHAR2 | 40 |  |  | Y |  |  |
| DOMINIO_SISTEMA_BN | VARCHAR2 | 1 |  |  | Y | 'N' |  |
| VALOR_COMUM | VARCHAR2 | 30 |  |  | Y |  |  |
| OBSERVACAO | VARCHAR2 | 2000 |  |  | Y |  |  |
| ESTADO_REGISTO_RF | VARCHAR2 | 2 |  |  | Y | 'N' /* NOVO */ |  |
| DATA_ESTADO | DATE | 7 |  |  | Y | SYSDATE |  |
| VERSAO | NUMBER | 22 |  |  | Y | 0.0 |  |
| DATA_REGISTO | DATE | 7 |  |  | Y | SYSDATE |  |
| REGISTADO_POR | VARCHAR2 | 30 |  |  | Y | USER |  |
| DATA_ACTUALIZACAO | DATE | 7 |  |  | Y |  |  |
| ACTUALIZADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| PK_ID_CDMN | P | ID | 1 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| PK_ID_CDMN | UNIQUE | ID | 1 |

