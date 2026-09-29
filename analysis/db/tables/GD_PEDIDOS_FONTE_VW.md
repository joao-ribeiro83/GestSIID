# GD_PEDIDOS_FONTE_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDFONTE | VARCHAR2 | 4 |  |  | N |  |  |
| NOME_CONGENERE | VARCHAR2 | 60 |  |  | N |  |  |
| CDPAIS | VARCHAR2 | 3 |  |  | N |  |  |
| NOME_PAIS | VARCHAR2 | 80 |  |  | N |  |  |
| ANO | VARCHAR2 | 4 |  |  | Y |  |  |
| MES | VARCHAR2 | 2 |  |  | Y |  |  |
| N_RELATORIOS | NUMBER | 22 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
SELECT /*+ LEADING( FONTE) */   
  PEDIDOS.cdfOnte	  				CDFONTE   
, fonte.dsfuente					    NOME_CONGENERE   
, fonte.cdpais						    CDPAIS   
, pais.descripl 					    NOME_PAIS	   
, TO_CHAR(RESPOSTAS.FERESP,'YYYY')		ANO   
, TO_CHAR(RESPOSTAS.FERESP, 'MM')		MES   
, COUNT(RESPOSTAS.feRESP)       		N_RELATORIOS   
FROM   
  co_fuentes		fonte   
, tmanteni			pais   
, co_pedircc		Pedidos   
, co_resprcc		Respostas   
WHERE   
    pais.cdtabla        = 'TPAISES'   
AND pais.codigo         = fonte.cdpais    
and respostas.nmpedido  = pedidos.nmpedido       
and pedidos.cdfonte     = fonte.cdfuente   
GROUP BY   
  PEDIDOS.cdFOnte   
, fonte.dsfuente	   
, fonte.cdpais		   
, pais.descripl 	   
, TO_CHAR(RESPOSTAS.FERESP,'YYYY')   
, TO_CHAR(RESPOSTAS.FERESP, 'MM')

```
