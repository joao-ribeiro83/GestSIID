# DOC_XML_ATRIBUTOS

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **60**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| XML_ID | NUMBER | 22 | 5 | 0 | N |  |  |
| MODELO_ID | VARCHAR2 | 10 |  |  | N |  |  |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| CDRAMO | VARCHAR2 | 10 |  |  | N |  |  |
| N_ATRIBUTO | NUMBER | 22 | 3 | 0 | N |  |  |
| NOME_ATRIBUTO | VARCHAR2 | 20 |  |  | N |  | nome da coluna de atributo da svr_documentos a mapear |
| SUBS_ATRIBUTO | VARCHAR2 | 50 |  |  | N |  | texto no xml a ser substituido pelo valor da coluna da svr_documentos |
| VALOR_OMISSAO | VARCHAR2 | 255 |  |  | Y |  |  |
| TIPO_ATRIBUTO | VARCHAR2 | 1 |  |  | N | 'S'  | tipo de atributo: S - Simples / M - Multiplo |
| SEPARADOR | VARCHAR2 | 5 |  |  | Y |  | Caractere(s) separador entre valores na mesma string |
| SEPARADOR_XML | VARCHAR2 | 255 |  |  | Y |  | Texto XML que vai ser inserido entre os valores do atributo para definir os vários elementos XML |
| DESCRICAO_ATRIBUTO | VARCHAR2 | 255 |  |  | Y |  | descrição do atributo a ser substituido no xml template |
| DATA_INICIO | DATE | 7 |  |  | N |  |  |
| DATA_FIM | DATE | 7 |  |  | N |  |  |
| CRIADO_POR | VARCHAR2 | 30 |  |  | N |  |  |
| DATA_CRIACAO | DATE | 7 |  |  | Y |  |  |
| ACTUALIZADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_ACTUALIZACAO | DATE | 7 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| DOC_XML_ATRIBUTOS_INDEX1 | UNIQUE | XML_ID | 1 |
| DOC_XML_ATRIBUTOS_INDEX1 | UNIQUE | MODELO_ID | 2 |
| DOC_XML_ATRIBUTOS_INDEX1 | UNIQUE | CDUNIECO | 3 |
| DOC_XML_ATRIBUTOS_INDEX1 | UNIQUE | CDRAMO | 4 |
| DOC_XML_ATRIBUTOS_INDEX1 | UNIQUE | N_ATRIBUTO | 5 |

