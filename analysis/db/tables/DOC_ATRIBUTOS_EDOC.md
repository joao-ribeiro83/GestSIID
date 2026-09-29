# DOC_ATRIBUTOS_EDOC

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **1630**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EDOC_ID | NUMBER | 22 | 5 | 0 | N |  |  |
| MODELO_ID | VARCHAR2 | 10 |  |  | N |  |  |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| CDRAMO | VARCHAR2 | 10 |  |  | N |  |  |
| N_ATRIBUTO | NUMBER | 22 | 3 | 0 | N |  |  |
| DESCRICAO | VARCHAR2 | 255 |  |  | Y |  |  |
| TIPO_PARAMETRO | CHAR | 1 |  |  | N |  | Tipo Parametro EDOC (D - Documento/R - Registo/E - Entidade/A - Adicional/P - Pesquisa/C - Certificado) |
| NOME_PARAMETRO | VARCHAR2 | 20 |  |  | N |  | Nome do Parametro EDOC  a utilizar |
| ORDEM_PARAMETRO | NUMBER | 22 | 3 | 0 | N |  |  |
| VALOR_OMISSAO | VARCHAR2 | 255 |  |  | Y |  |  |
| DATA_INICIO | DATE | 7 |  |  | N |  |  |
| DATA_FIM | DATE | 7 |  |  | Y |  |  |
| CRIADO_POR | VARCHAR2 | 30 |  |  | N |  |  |
| DATA_CRIACAO | DATE | 7 |  |  | Y |  |  |
| ACTUALIZADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_ACTUALIZACAO | DATE | 7 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| DOC_ATRIBUTOS_EDOC_PK | P | EDOC_ID | 1 |
| DOC_ATRIBUTOS_EDOC_PK | P | MODELO_ID | 2 |
| DOC_ATRIBUTOS_EDOC_PK | P | CDUNIECO | 3 |
| DOC_ATRIBUTOS_EDOC_PK | P | CDRAMO | 4 |
| DOC_ATRIBUTOS_EDOC_PK | P | N_ATRIBUTO | 5 |
| DOC_ATRIBUTOS_EDOC_PK | P | DATA_INICIO | 6 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| DOC_ATRIBUTOS_EDOC_PK | UNIQUE | EDOC_ID | 1 |
| DOC_ATRIBUTOS_EDOC_PK | UNIQUE | MODELO_ID | 2 |
| DOC_ATRIBUTOS_EDOC_PK | UNIQUE | CDUNIECO | 3 |
| DOC_ATRIBUTOS_EDOC_PK | UNIQUE | CDRAMO | 4 |
| DOC_ATRIBUTOS_EDOC_PK | UNIQUE | N_ATRIBUTO | 5 |
| DOC_ATRIBUTOS_EDOC_PK | UNIQUE | DATA_INICIO | 6 |
| DOC_ATRIB_EDOC_IDX1 | NONUNIQUE | EDOC_ID | 1 |
| DOC_ATRIB_EDOC_IDX1 | NONUNIQUE | MODELO_ID | 2 |
| DOC_ATRIB_EDOC_IDX1 | NONUNIQUE | CDUNIECO | 3 |
| DOC_ATRIB_EDOC_IDX1 | NONUNIQUE | DATA_INICIO | 4 |
| DOC_ATRIB_EDOC_IDX1 | NONUNIQUE | DATA_FIM | 5 |

