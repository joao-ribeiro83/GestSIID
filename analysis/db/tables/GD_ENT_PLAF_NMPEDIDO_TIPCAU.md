# GD_ENT_PLAF_NMPEDIDO_TIPCAU

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| NMPEDIDO | VARCHAR2 | 10 |  |  | Y |  |  |
| NMEVENTO | NUMBER | 22 |  |  | Y |  |  |
| CDPERSON | NUMBER | 22 |  |  | Y |  |  |
| PROPDCM | NUMBER | 22 |  |  | Y |  |  |
| DECFINAL | NUMBER | 22 |  |  | Y |  |  |
| CDTIPCAU | NUMBER | 22 | 3 | 0 | Y |  |  |
| CDEVENTO | VARCHAR2 | 2 |  |  | N |  |  |
| CDESTADO | VARCHAR2 | 2 |  |  | N |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT /*+ ordered */
	a.nmpedido
	,a.nmevento
	,a.cdperson
	,a.propdcm
	,a.DECFINAL
	,a.cdtipcau
	,b.CDEVENTO
	,b.CDESTADO
FROM (
	SELECT NVL(sub.nmpedido, plaf.nmpedido) nmpedido
		,NVL(sub.nmevento, plaf.nmevento) nmevento
		,NVL(sub.cdperson, plaf.cdperson) cdperson
		,NVL(sub.propdcm, plaf.ptplasol) propdcm
		,NVL(sub.DECFINAL, plaf.PTPLACAUP) DECFINAL
		,sub.cdtipcau
	FROM (
		SELECT nmpedido
			,nmevento
			,cdperson
			,propdcm
			,DECFINAL
			,cdtipcau
		FROM CO_SUBPCDET
		WHERE propdcm IS NOT NULL
		) sub
	FULL OUTER JOIN (
		SELECT plaf.nmpedido
			,plaf.nmevento
			,ped.cdperson
			,plaf.ptplasol
			,plaf.PTPLACAUP
		FROM co_plafanr plaf
			,CO_PEDIANR ped
		WHERE 1 = 1
			AND plaf.ptplasol IS NOT NULL
			AND ped.NMPEDIDO = plaf.NMPEDIDO
		) plaf ON sub.nmpedido = plaf.nmpedido
		AND sub.nmevento = plaf.nmevento
		AND sub.cdperson = plaf.cdperson
	) a
	, CO_DETAANR b
where 1=1
	AND a.NMPEDIDO = b.NMPEDIDO
	AND a.NMEVENTO = b.NMEVENTO
```
