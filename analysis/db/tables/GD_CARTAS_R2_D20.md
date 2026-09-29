# GD_CARTAS_R2_D20

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **18025**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ID | NUMBER | 22 | 10 | 0 | N |  |  |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| CDRAMO | NUMBER | 22 | 3 | 0 | N |  |  |
| NMPROPUE | NUMBER | 22 | 10 | 0 | Y |  |  |
| NMPOLIZA | NUMBER | 22 | 10 | 0 | Y |  |  |
| DT_INI_VIG | DATE | 7 |  |  | Y |  |  |
| DT_FIM_VIG | DATE | 7 |  |  | Y |  |  |
| TIPO_APOL | VARCHAR2 | 1 |  |  | Y |  |  |
| P_ALTERADOS | VARCHAR2 | 30 |  |  | Y |  |  |
| P_OUTROS | VARCHAR2 | 4000 |  |  | Y |  |  |
| TX_FAB | VARCHAR2 | 175 |  |  | Y |  |  |
| LS_FAB | VARCHAR2 | 175 |  |  | Y |  |  |
| LC_FAB | VARCHAR2 | 175 |  |  | Y |  |  |
| TX_CRE | VARCHAR2 | 175 |  |  | Y |  |  |
| LS_CRE | VARCHAR2 | 175 |  |  | Y |  |  |
| LC_CRE | VARCHAR2 | 175 |  |  | Y |  |  |
| PREMIO_SIMP | VARCHAR2 | 175 |  |  | Y |  |  |
| PREMIO_CIMP | VARCHAR2 | 175 |  |  | Y |  |  |
| CUSTO_ABERTURA_SIVA | VARCHAR2 | 175 |  |  | Y |  |  |
| CUSTO_ABERTURA_CIVA | VARCHAR2 | 175 |  |  | Y |  |  |
| VALOR_PREM_CAP | VARCHAR2 | 175 |  |  | Y |  |  |
| PRAZO_VAL_GAR | VARCHAR2 | 400 |  |  | Y |  |  |
| SWAUTOMAN | VARCHAR2 | 1 |  |  | Y |  |  |
| TCONCDIT | VARCHAR2 | 30 |  |  | Y |  |  |
| CODIGOENT | NUMBER | 22 | 5 | 0 | Y |  |  |
| REFMB | NUMBER | 22 | 9 | 0 | Y |  |  |
| VALOR | NUMBER | 22 | 15 | 2 | Y |  |  |
| DTLIMITE | DATE | 7 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| ID_CARTA_PK | P | ID | 1 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| ID_CARTA_PK | UNIQUE | ID | 1 |

