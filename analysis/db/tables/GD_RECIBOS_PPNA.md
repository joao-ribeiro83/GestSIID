# GD_RECIBOS_PPNA

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **230266**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 |  |  | N |  |  |
| NMRECIBO | NUMBER | 22 |  |  | N |  |  |
| CDRAMO | NUMBER | 22 |  |  | Y |  |  |
| ESTADO | VARCHAR2 | 10 |  |  | Y |  |  |
| NMPOLIZA | NUMBER | 22 |  |  | Y |  |  |
| DT_INI_VIGAPOL | DATE | 7 |  |  | Y |  |  |
| DT_FIM_VIGAPOL | DATE | 7 |  |  | Y |  |  |
| DIRECCAO_COMERCIAL | VARCHAR2 | 30 |  |  | Y |  |  |
| GESTOR_COMERCIAL | VARCHAR2 | 30 |  |  | Y |  |  |
| GESTOR_CONTRATUAL | VARCHAR2 | 30 |  |  | Y |  |  |
| MERCADO_ID | VARCHAR2 | 2 |  |  | Y |  |  |
| TIPO_APOLICE_ID | VARCHAR2 | 1 |  |  | Y |  |  |
| COSEGURO_ID | VARCHAR2 | 1 |  |  | Y |  |  |
| TARIFACAO_ID | VARCHAR2 | 2 |  |  | Y |  |  |
| PAGAPOL_ID | NUMBER | 22 |  |  | Y |  |  |
| PRAZOMAX_PAG | NUMBER | 22 |  |  | Y |  |  |
| TIPORECI | NUMBER | 22 |  |  | Y |  |  |
| TIPOAVISO_ID | VARCHAR2 | 5 |  |  | Y |  |  |
| NMRECINUE | NUMBER | 22 |  |  | Y |  |  |
| TOMADOR_ID | NUMBER | 22 |  |  | Y |  |  |
| CDAGRUPA | NUMBER | 22 |  |  | Y |  |  |
| AGRUPADOR_ID | NUMBER | 22 |  |  | Y |  |  |
| DOMAGRUP_ID | NUMBER | 22 |  |  | Y |  |  |
| CDBANCO | VARCHAR2 | 20 |  |  | Y |  |  |
| CDSUCURS | VARCHAR2 | 20 |  |  | Y |  |  |
| ESTADOREC_ID | NUMBER | 22 |  |  | Y |  |  |
| DT_EMISSAO | DATE | 7 |  |  | Y |  |  |
| DT_INICIO | DATE | 7 |  |  | Y |  |  |
| DT_FINAL | DATE | 7 |  |  | Y |  |  |
| DT_PRODUCAO | DATE | 7 |  |  | Y |  |  |
| DT_VENCIMENTO | DATE | 7 |  |  | Y |  |  |
| DT_PRIMEIRAFRAC | DATE | 7 |  |  | Y |  |  |
| DT_ULTIMAFRAC | DATE | 7 |  |  | Y |  |  |
| CDMONEDA | VARCHAR2 | 3 |  |  | Y |  |  |
| TOTALRECIBO | NUMBER | 22 |  |  | Y |  |  |
| TOTALPREMIO | NUMBER | 22 |  |  | Y |  |  |
| N_MESESRISCO | NUMBER | 22 |  |  | Y |  |  |
| N_FRACCOES | NUMBER | 22 |  |  | Y |  |  |
| DATA_CRIACAO | DATE | 7 |  |  | Y | SYSDATE |  |
| CRIADO_POR | VARCHAR2 | 30 |  |  | Y | USER |  |
| DATA_ACTUALIZACAO | DATE | 7 |  |  | Y |  |  |
| ACTUALIZADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| PK_CHAVE_GPPNAR | P | CDUNIECO | 1 |
| PK_CHAVE_GPPNAR | P | NMRECIBO | 2 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| IDX_PRIMEIRAFRAC_GPPNAR | NONUNIQUE | DT_PRIMEIRAFRAC | 1 |
| IDX_PRIMEIRAFRAC_GPPNAR | NONUNIQUE | DT_PRODUCAO | 2 |
| IDX_PRIMEIRAFRAC_GPPNAR | NONUNIQUE | ESTADOREC_ID | 3 |
| IDX_ULTIMAFRAC_GPPNAR | NONUNIQUE | DT_ULTIMAFRAC | 1 |
| IDX_ULTIMAFRAC_GPPNAR | NONUNIQUE | DT_PRODUCAO | 2 |
| IDX_ULTIMAFRAC_GPPNAR | NONUNIQUE | ESTADOREC_ID | 3 |
| PK_CHAVE_GPPNAR | UNIQUE | CDUNIECO | 1 |
| PK_CHAVE_GPPNAR | UNIQUE | NMRECIBO | 2 |

