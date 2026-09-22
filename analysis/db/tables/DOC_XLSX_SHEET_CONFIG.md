# DOC_XLSX_SHEET_CONFIG

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **31**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MODELO_ID | VARCHAR2 | 10 |  |  | N |  |  |
| SHEET | NUMBER | 22 |  |  | N |  |  |
| NIVEL | NUMBER | 22 |  |  | N |  |  |
| LINHA | NUMBER | 22 |  |  | N |  |  |
| COLUMN_NUMBER | NUMBER | 22 |  |  | N |  |  |
| COLUMN_NAME | VARCHAR2 | 20 |  |  | N |  |  |
| COLUMN_TYPE | VARCHAR2 | 20 |  |  | N |  |  |
| COLUMN_TITLE | VARCHAR2 | 100 |  |  | Y |  |  |
| TIPO_LINHA | VARCHAR2 | 1 |  |  | Y |  |  |
| HORIZONTALALIGNMENT | VARCHAR2 | 20 |  |  | Y |  |  |
| VERTICALALIGNMENT | VARCHAR2 | 20 |  |  | Y |  |  |
| BORDER | VARCHAR2 | 20 |  |  | Y |  |  |
| BACKGROUNDCOLOR | VARCHAR2 | 20 |  |  | Y |  |  |
| BACKGROUNDPATTERN | VARCHAR2 | 20 |  |  | Y |  |  |
| FONTNAME | VARCHAR2 | 20 |  |  | Y |  |  |
| FONTSIZE | NUMBER | 22 |  |  | Y |  |  |
| FONTSTYLE | VARCHAR2 | 20 |  |  | Y |  |  |
| WRAPTEXT | VARCHAR2 | 1 |  |  | Y |  |  |
| READ_ORDER | NUMBER | 22 | 10 | 0 | N |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| DOC_XLSX_SHEET_CONFIG_PK | P | MODELO_ID | 1 |
| DOC_XLSX_SHEET_CONFIG_PK | P | SHEET | 2 |
| DOC_XLSX_SHEET_CONFIG_PK | P | NIVEL | 3 |
| DOC_XLSX_SHEET_CONFIG_PK | P | LINHA | 4 |
| DOC_XLSX_SHEET_CONFIG_PK | P | COLUMN_NUMBER | 5 |


## Foreign keys

_(none)_


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| DOC_XLSX_SHEET_CONFIG_PK | UNIQUE | MODELO_ID | 1 |
| DOC_XLSX_SHEET_CONFIG_PK | UNIQUE | SHEET | 2 |
| DOC_XLSX_SHEET_CONFIG_PK | UNIQUE | NIVEL | 3 |
| DOC_XLSX_SHEET_CONFIG_PK | UNIQUE | LINHA | 4 |
| DOC_XLSX_SHEET_CONFIG_PK | UNIQUE | COLUMN_NUMBER | 5 |

