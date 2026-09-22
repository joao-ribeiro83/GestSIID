# SVR_BACKUPS

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **0**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ID | NUMBER | 22 |  |  | N |  |  |
| NOME | VARCHAR2 | 60 |  |  | Y |  |  |
| MES_BACKUP | DATE | 7 |  |  | Y |  |  |
| TIPO_MIDIA_ID | VARCHAR2 | 10 |  |  | Y |  |  |
| DESTINO | VARCHAR2 | 200 |  |  | Y |  |  |
| OBSERVACOES | VARCHAR2 | 2000 |  |  | Y |  |  |
| MEDIA_ONLINE | VARCHAR2 | 1 |  |  | Y | 'N' |  |
| DRIVE_ONLINE | VARCHAR2 | 200 |  |  | Y |  |  |
| CRIADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_CRIACAO | DATE | 7 |  |  | Y | SYSDATE |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| PK_CHAVE_SBK | P | ID | 1 |
| UN_NOME_SBK | U | NOME | 1 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| PK_CHAVE_SBK | UNIQUE | ID | 1 |
| UN_NOME_SBK | UNIQUE | NOME | 1 |

