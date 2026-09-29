# GD_NOVAS_PASSWORDS_CN_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IDREG | RAW | 16 |  |  | N |  |  |
| CDIDUSR | VARCHAR2 | 30 |  |  | N |  |  |
| CDUNIECO | VARCHAR2 | 1 |  |  | Y |  |  |
| DSNEWPWD | VARCHAR2 | 32 |  |  | N |  |  |
| CDPERFIL | VARCHAR2 | 40 |  |  | N |  |  |
| DSNOMBRE | VARCHAR2 | 160 |  |  | N |  |  |
| DSUSUARIO | VARCHAR2 | 40 |  |  | N |  |  |
| FEPROCES | DATE | 7 |  |  | N |  |  |
| HHPROCES | VARCHAR2 | 8 |  |  | N |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT /*+ ordered */
	p.idreg
	,p.cdidusr
	,u.CDUNIECO
	,p.dsnewpwd
	,mp.dsperfil cdperfil
	,p.dsnombre
	,u.DSUSUARIO
	,p.feproces
	,p.hhproces
FROM co_tnewpwd p
	,M_USUARIOS u
	,m_perfiles mp
WHERE 1 = 1
	AND p.CDIDUSR = u.CDIDUSR
	AND p.cdperfil = mp.cdperfil
	AND p.feproces = (
		SELECT max(feproces)
		FROM co_tnewpwd x
		WHERE x.cdIDUSR = p.cdIDUSR
		)
	AND NOT EXISTS (
		SELECT 1
		FROM GD_NOVAS_PASSWORDS_CN x
		WHERE x.pedido_id = p.idreg
		)
ORDER BY feproces
```
