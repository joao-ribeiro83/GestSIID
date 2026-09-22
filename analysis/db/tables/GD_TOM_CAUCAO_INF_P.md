# GD_TOM_CAUCAO_INF_P

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

> Tabela de apoio ao ecrã FD_O2_OD73 para listagem de entidades tomadoras de caução para envio automático de notificação por email para as respectivas entidades.

Row count: **500**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ENT_ID | NUMBER | 22 | 9 | 0 | N |  | Identificador único desta tabela |
| CDPERSON | NUMBER | 22 | 9 | 0 | N |  | Identificador da entidade a enviar notificação |
| EMAIL | VARCHAR2 | 255 |  |  | Y |  | Email da entidade a enviar notificação |
| SWENVIANOTIF | VARCHAR2 | 1 |  |  | N | 'N'  | switch que identifica se envia ou não a notificação |
| SWEMAILVALIDO | VARCHAR2 | 1 |  |  | N | 'N'  | switch que identifica se o email se encontra válido para envio de notificação |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| GD_TOM_CAUCAO_INF_P_PK | P | ENT_ID | 1 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| GD_TOM_CAUCAO_INF_P_INDX | NONUNIQUE | CDPERSON | 1 |
| GD_TOM_CAUCAO_INF_P_PK | UNIQUE | ENT_ID | 1 |

