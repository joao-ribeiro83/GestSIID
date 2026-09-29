# SVR_DOCUMENTOS_XML

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DOCUMENTO_ID | NUMBER | 22 |  |  | N |  |  |
| MODELO_ID | VARCHAR2 | 10 |  |  | Y |  |  |
| DESCRICAO_ATRIBUTO | VARCHAR2 | 255 |  |  | Y |  |  |
| N_ATRIBUTO | NUMBER | 22 | 3 | 0 | N |  |  |
| NOME_ATRIBUTO | VARCHAR2 | 20 |  |  | N |  |  |
| SUBS_ATRIBUTO | VARCHAR2 | 50 |  |  | N |  |  |
| VALOR_ATRIBUTO | VARCHAR2 | 255 |  |  | Y |  |  |
| NOME_FICHEIRO | VARCHAR2 | 240 |  |  | Y |  |  |
| XML_TEMPLATE | CLOB | 4000 |  |  | Y |  |  |
| TIPO_ATRIBUTO | VARCHAR2 | 1 |  |  | N |  |  |
| SEPARADOR | VARCHAR2 | 5 |  |  | Y |  |  |
| SEPARADOR_XML | VARCHAR2 | 255 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT /*+ ordered USE_NL(B C D)*/
	B.ID DOCUMENTO_ID
	,B.modelo_id MODELO_ID
	,C.DESCRICAO_ATRIBUTO
	,C.N_ATRIBUTO
	,C.NOME_ATRIBUTO
	,C.SUBS_ATRIBUTO
	,CASE C.N_ATRIBUTO
		WHEN 0
			THEN B.N_REFERENCIA
		WHEN 1
			THEN E.xml1
		WHEN 2
			THEN E.xml2
		WHEN 3
			THEN E.xml3
		WHEN 4
			THEN E.xml4
		WHEN 5
			THEN E.xml5
		WHEN 6
			THEN E.xml6
		ELSE NULL
		END VALOR_ATRIBUTO
	,B.nome_output NOME_FICHEIRO
	,D.XML_TEMPLATE
	,C.TIPO_ATRIBUTO
	,C.SEPARADOR
	,C.SEPARADOR_XML
FROM SVR_DOCUMENTOS_XML_OLD E
	,SVR_DOCUMENTOS B
	,DOC_XML_ATRIBUTOS C
	,DOC_XML_TEMPLATE D
WHERE 1 = 1
	AND E.ID = B.ID
	AND B.MODELO_ID = C.MODELO_ID
	AND E.XML_ID = C.XML_ID
	AND E.XML_ID = D.XML_ID
	AND B.data_pedido BETWEEN C.data_inicio
		AND C.data_fim
```
