# DOC_XLSX_TEMPLATE

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **1**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MODELO_ID | VARCHAR2 | 10 |  |  | N |  |  |
| SHEET | NUMBER | 22 |  |  | N |  |  |
| SHEET_NAME | VARCHAR2 | 30 |  |  | N |  |  |
| NIVEIS | NUMBER | 22 |  |  | N |  | Numero de niveis de separação de dados por tipo |
| COLUNAS | NUMBER | 22 |  |  | N |  | Numero de colunas a apresentar na folha excel |
| QUERY | CLOB | 4000 |  |  | Y |  | Query dos dados a fazer à bd para apresentar na folha excel. NOTA: pode conter variáveis de texto a substituir. |
| PARAMETROS | VARCHAR2 | 2000 |  |  | Y |  | Lista de parametros separados por uma virgula para substituir na query com o valor do parametro presente da criação do PDF. |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| DOC_XLSX_TEMPLATE_PK | P | MODELO_ID | 1 |
| DOC_XLSX_TEMPLATE_PK | P | SHEET | 2 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| DOC_XLSX_TEMPLATE_PK | UNIQUE | MODELO_ID | 1 |
| DOC_XLSX_TEMPLATE_PK | UNIQUE | SHEET | 2 |

