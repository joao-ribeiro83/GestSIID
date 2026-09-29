# SVR_DOCUMENTOS_EDOC

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DOCUMENTO_ID | NUMBER | 22 |  |  | N |  |  |
| MODELO_ID | VARCHAR2 | 10 |  |  | Y |  |  |
| DESCRICAO | VARCHAR2 | 255 |  |  | Y |  |  |
| TIPO_PARAMETRO | CHAR | 1 |  |  | N |  |  |
| NOME_PARAMETRO | VARCHAR2 | 20 |  |  | N |  |  |
| ORDEM_PARAMETRO | NUMBER | 22 | 3 | 0 | N |  |  |
| VALOR_ATRIBUTO | VARCHAR2 | 255 |  |  | Y |  |  |
| NOME_FICHEIRO | VARCHAR2 | 240 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT /*+ ordered USE_NL(B C)*/
	B.ID DOCUMENTO_ID
	,B.modelo_id MODELO_ID
	,C.DESCRICAO
	,C.TIPO_PARAMETRO
	,C.NOME_PARAMETRO
	,C.ORDEM_PARAMETRO
	,CASE C.N_ATRIBUTO
		WHEN 0
			THEN C.VALOR_OMISSAO
		WHEN 1
			THEN B.atributo1
		WHEN 2
			THEN B.atributo2
		WHEN 3
			THEN B.atributo3
		WHEN 4
			THEN B.atributo4
		WHEN 5
			THEN B.atributo5
		WHEN 6
			THEN B.atributo6
		WHEN 7
			THEN B.atributo7
		WHEN 8
			THEN B.atributo8
		WHEN 9
			THEN B.atributo9
		WHEN 10
			THEN B.atributo10
		WHEN 11
			THEN B.atributo11
		WHEN 12
			THEN B.atributo12
		WHEN 13
			THEN B.atributo13
		WHEN 14
			THEN B.atributo14
		WHEN 15
			THEN B.atributo15
		WHEN 16
			THEN B.atributo16
		WHEN 17
			THEN B.atributo17
		WHEN 18
			THEN B.atributo18
		WHEN 19
			THEN B.atributo19
		WHEN 20
			THEN B.atributo20
		WHEN 21
			THEN B.atributo21
		WHEN 22
			THEN B.atributo22
		WHEN 23
			THEN B.atributo23
		WHEN 24
			THEN B.atributo24
		WHEN 25
			THEN B.atributo25
		ELSE NULL
		END VALOR_ATRIBUTO
	,B.nome_output NOME_FICHEIRO
FROM SVR_DOCUMENTOS B
	,DOC_ATRIBUTOS_EDOC C
WHERE 1 = 1
	AND B.MODELO_ID = C.MODELO_ID
	AND B.EDOC_ID = C.EDOC_ID
	AND B.data_pedido BETWEEN C.data_inicio
		AND C.data_fim
```
