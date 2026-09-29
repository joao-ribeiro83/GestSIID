# GD_D5_B5_APOLICES

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| CDRAMO | NUMBER | 22 | 3 | 0 | N |  |  |
| NMPOLIZA | NUMBER | 22 | 10 | 0 | N |  |  |
| NMPROPUE | NUMBER | 22 | 10 | 0 | Y |  |  |
| INIVIG | DATE | 7 |  |  | N |  |  |
| FIMVIG | DATE | 7 |  |  | Y |  |  |
| DATAENVIO | VARCHAR2 | 175 |  |  | Y |  |  |
| TOMADOR | VARCHAR2 | 160 |  |  | N |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT APOLICE.CDUNIECO
	,APOLICE.CDRAMO
	,APOLICE.NMPOLIZA
	,APOLICE.NMSOLICI NMPROPUE
	,APOLICE.FEEFECTO INIVIG
	,APOLICE.FEPROREN FIMVIG
	,DATA_ENVIO.OTVALOR DATAENVIO
	,Tomador.DSNOMBRE TOMADOR
FROM mpolizas APOLICE
	,tvalopol DATA_ENVIO
	,mpoliper TomApolice
	,mpersona Tomador
	,tvalopol EST_PEDIDO
WHERE 1 = 1
	-- filtro ap??lices
	AND APOLICE.cdunieco = 2
	AND APOLICE.cdramo = 150
	AND APOLICE.estado = 'M'
	AND APOLICE.STATUS = 'V'
	AND APOLICE.OTTEMPOT = 'R'
	AND APOLICE.NMSUPLEM = (
		SELECT MAX(NMSUPLEM)
		FROM MPOLIZAS X
		WHERE X.NMPOLIZA = APOLICE.NMPOLIZA
			AND X.ESTADO = APOLICE.ESTADO
			AND X.CDRAMO = APOLICE.CDRAMO
			AND X.CDUNIECO = APOLICE.CDUNIECO
			AND x.STATUS = 'V'
		)
	-- Filtro do Estado do Pedido
	AND EST_PEDIDO.cdatribu = 24
	AND EST_PEDIDO.OTVALOR = '02'
	AND EST_PEDIDO.nmpoliza = APOLICE.nmpoliza
	AND EST_PEDIDO.cdunieco = APOLICE.cdunieco
	AND EST_PEDIDO.cdramo = APOLICE.cdramo
	AND EST_PEDIDO.estado = APOLICE.estado
	AND EST_PEDIDO.STATUS = APOLICE.STATUS
	AND EST_PEDIDO.nmsuplem = (
		SELECT NVL(MAX(DATA_ENVIOA.NMSUPLEM), 0)
		FROM TVALOPOL DATA_ENVIOA
		WHERE 1 = 1
			AND DATA_ENVIOA.cdatribu = EST_PEDIDO.cdatribu
			AND DATA_ENVIOA.NMSUPLEM <= TO_CHAR(SYSDATE, 'J') || '99999999999'
			AND DATA_ENVIOA.cdunieco = EST_PEDIDO.cdunieco
			AND DATA_ENVIOA.cdramo = EST_PEDIDO.cdramo
			AND DATA_ENVIOA.estado = EST_PEDIDO.estado
			AND DATA_ENVIOA.nmpoliza = EST_PEDIDO.nmpoliza
			--AND DATA_ENVIOA.STATUS = EST_PEDIDO.STATUS
		)
	-- Calculo da data_envio
	AND DATA_ENVIO.cdatribu = 25
	AND DATA_ENVIO.nmpoliza = APOLICE.nmpoliza
	AND DATA_ENVIO.cdunieco = APOLICE.cdunieco
	AND DATA_ENVIO.cdramo = APOLICE.cdramo
	AND DATA_ENVIO.estado = APOLICE.estado
	AND DATA_ENVIO.STATUS = APOLICE.STATUS
	AND DATA_ENVIO.nmsuplem = (
		SELECT NVL(MAX(DATA_ENVIOA.NMSUPLEM), 0)
		FROM TVALOPOL DATA_ENVIOA
		WHERE 1 = 1
			AND DATA_ENVIOA.cdatribu = DATA_ENVIO.cdatribu
			AND DATA_ENVIOA.NMSUPLEM <= TO_CHAR(SYSDATE, 'J') || '99999999999'
			AND DATA_ENVIOA.cdunieco = DATA_ENVIO.cdunieco
			AND DATA_ENVIOA.cdramo = DATA_ENVIO.cdramo
			AND DATA_ENVIOA.estado = DATA_ENVIO.estado
			AND DATA_ENVIOA.nmpoliza = DATA_ENVIO.nmpoliza
			--AND DATA_ENVIOA.STATUS = DATA_ENVIO.STATUS
		)
	-- Calculo de cdperson do Tomador
	AND TomApolice.cdramo = apolice.cdramo
	AND TomApolice.cdunieco = apolice.cdunieco
	AND TomApolice.nmpoliza = apolice.nmpoliza
	AND TomApolice.estado = apolice.estado
	AND TomApolice.STATUS = 'V'
	AND TomApolice.CDROL = 'TO'
	AND TomApolice.nmsuplem = (
		SELECT MAX(MPOLIPERA.NMSUPLEM)
		FROM MPOLIPER MPOLIPERA
		WHERE 1 = 1
			AND MPOLIPERA.CDROL = TomApolice.CDROL
			AND MPOLIPERA.NMSUPLEM <= TO_CHAR(APOLICE.FEEFECTO, 'J') || '99999999999'
			AND MPOLIPERA.NMPOLIZA = TomApolice.NMPOLIZA
			AND MPOLIPERA.ESTADO = TomApolice.ESTADO
			AND MPOLIPERA.CDRAMO = TomApolice.CDRAMO
			AND MPOLIPERA.CDUNIECO = TomApolice.CDUNIECO
		)
	-- Calculo do Nome do Tomador
	AND Tomador.cdperson = TomApolice.cdperson
	--APOLICE EM VIGOR
	AND PKG_FORMULAS_COSEC.IS_APOLICE_VALIDA(APOLICE.CDUNIECO, APOLICE.CDRAMO, APOLICE.ESTADO, APOLICE.NMPOLIZA) = 'S'
	--n?#o contemplar as anuladas (seja ou n?#o no futuro)
	AND PKG_FORMULAS_COSEC.GET_DT_ANULACAO_APOLICE(APOLICE.CDUNIECO, APOLICE.CDRAMO, APOLICE.NMPOLIZA) IS NULL
```
