# DOC_XML_TEMPLATE

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **10**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| XML_ID | NUMBER | 22 | 5 | 0 | N |  |  |
| MODELO_ID | VARCHAR2 | 10 |  |  | N |  |  |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| CDRAMO | VARCHAR2 | 10 |  |  | N |  |  |
| XML_TEMPLATE | CLOB | 4000 |  |  | Y |  |  |
| DATA_INICIO | DATE | 7 |  |  | N |  |  |
| DATA_FIM | DATE | 7 |  |  | N |  |  |
| CRIADO_POR | VARCHAR2 | 30 |  |  | N |  |  |
| DATA_CRIACAO | DATE | 7 |  |  | N |  |  |
| ACTUALIZADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |
| DATA_ACTUALIZACAO | DATE | 7 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| DOC_XML_TEMPLATE_PK | UNIQUE | XML_ID | 1 |
| DOC_XML_TEMPL_IDX1 | NONUNIQUE | XML_ID | 1 |
| DOC_XML_TEMPL_IDX1 | NONUNIQUE | MODELO_ID | 2 |
| DOC_XML_TEMPL_IDX1 | NONUNIQUE | CDUNIECO | 3 |
| DOC_XML_TEMPL_IDX1 | NONUNIQUE | DATA_INICIO | 4 |
| DOC_XML_TEMPL_IDX1 | NONUNIQUE | DATA_FIM | 5 |

