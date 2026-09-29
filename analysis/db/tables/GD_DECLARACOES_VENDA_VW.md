# GD_DECLARACOES_VENDA_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| CDRAMO | NUMBER | 22 | 3 | 0 | N |  |  |
| NMPOLIZA | NUMBER | 22 | 10 | 0 | N |  |  |
| CDPERSON | NUMBER | 22 | 9 | 0 | N |  |  |
| NMORDEN | NUMBER | 22 | 3 | 0 | N |  |  |
| FEPERDEC | VARCHAR2 | 7 |  |  | N |  |  |
| FEDECLAR | DATE | 7 |  |  | Y |  |  |
| CDORIGEN | VARCHAR2 | 1 |  |  | Y |  |  |
| IMDECOME | NUMBER | 22 | 17 | 5 | Y |  |  |
| IMDEPOLI | NUMBER | 22 | 17 | 5 | Y |  |  |
| IMPREAL | NUMBER | 22 | 17 | 5 | Y |  |  |
| IMEMITIR | NUMBER | 22 | 17 | 5 | Y |  |  |
| NMRECIBO | NUMBER | 22 | 10 | 0 | Y |  |  |
| INDREEMI | VARCHAR2 | 1 |  |  | Y |  |  |
| INDECCOM | VARCHAR2 | 1 |  |  | Y |  |  |
| IMDECOMI | NUMBER | 22 | 17 | 5 | Y |  |  |
| IMMIPRPA | NUMBER | 22 | 17 | 5 | Y |  |  |
| IMMINOSE | NUMBER | 22 | 17 | 5 | Y |  |  |
| IMMIEASO | NUMBER | 22 | 17 | 5 | Y |  |  |
| IMMIMENA | NUMBER | 22 | 17 | 5 | Y |  |  |
| IMMICLNA | NUMBER | 22 | 17 | 5 | Y |  |  |
| IMMIOTEX | NUMBER | 22 | 17 | 5 | Y |  |  |
| IMMIALCR | NUMBER | 22 | 17 | 5 | Y |  |  |
| IMMEPRPA | NUMBER | 22 | 17 | 5 | Y |  |  |
| IMMENOSE | NUMBER | 22 | 17 | 5 | Y |  |  |
| IMMEEASO | NUMBER | 22 | 17 | 5 | Y |  |  |
| IMMEMENA | NUMBER | 22 | 17 | 5 | Y |  |  |
| IMMECLNA | NUMBER | 22 | 17 | 5 | Y |  |  |
| IMMEOTEX | NUMBER | 22 | 17 | 5 | Y |  |  |
| IMMEALCR | NUMBER | 22 | 17 | 5 | Y |  |  |
| IMPOPRPA | NUMBER | 22 | 17 | 5 | Y |  |  |
| IMPONOSE | NUMBER | 22 | 17 | 5 | Y |  |  |
| IMPOEASO | NUMBER | 22 | 17 | 5 | Y |  |  |
| IMPOMENA | NUMBER | 22 | 17 | 5 | Y |  |  |
| IMPOCLNA | NUMBER | 22 | 17 | 5 | Y |  |  |
| IMPOOTEX | NUMBER | 22 | 17 | 5 | Y |  |  |
| IMPOALCR | NUMBER | 22 | 17 | 5 | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT vendas.CDUNIECO
	,vendas.CDRAMO
	,vendas.NMPOLIZA
	,vendas.CDPERSON
	,vendas.NMORDEN
	,vendas.FEPERDEC
	,vendas.FEDECLAR
	,vendas.CDORIGEN
	,vendas.IMDECOME
	,vendas.IMDEPOLI
	,vendas.IMPREAL
	,vendas.IMEMITIR
	,vendas.NMRECIBO
	,vendas.INDREEMI
	,vendas.INDECCOM
	,vendas.IMDECOMI
	,naodec.IMMIPRPA
	,naodec.IMMINOSE
	,naodec.IMMIEASO
	,naodec.IMMIMENA
	,naodec.IMMICLNA
	,naodec.IMMIOTEX
	,naodec.IMMIALCR
	,naodec.IMMEPRPA
	,naodec.IMMENOSE
	,naodec.IMMEEASO
	,naodec.IMMEMENA
	,naodec.IMMECLNA
	,naodec.IMMEOTEX
	,naodec.IMMEALCR
	,naodec.IMPOPRPA
	,naodec.IMPONOSE
	,naodec.IMPOEASO
	,naodec.IMPOMENA
	,naodec.IMPOCLNA
	,naodec.IMPOOTEX
	,naodec.IMPOALCR
FROM co_decven vendas
	,co_decvennc naodec
WHERE vendas.feperdec = naodec.feperdec(+)
	AND vendas.nmorden = naodec.nmorden(+)
	AND vendas.cdperson = naodec.cdperson(+)
	AND vendas.nmpoliza = naodec.nmpoliza(+)
	AND vendas.cdramo = naodec.cdramo(+)
	AND vendas.cdunieco = naodec.cdunieco(+)
```
