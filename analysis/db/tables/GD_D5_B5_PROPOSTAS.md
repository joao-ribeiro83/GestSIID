# GD_D5_B5_PROPOSTAS

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| CDRAMO | NUMBER | 22 | 3 | 0 | N |  |  |
| NMPOLIZA | NUMBER | 22 | 10 | 0 | Y |  |  |
| NMPROPUE | NUMBER | 22 | 10 | 0 | N |  |  |
| INIVIG | VARCHAR2 | 0 |  |  | Y |  |  |
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
select
  PROPOSTA.CDUNIECO
, PROPOSTA.CDRAMO
, PROPOSTA.NMPOLIZA
, Proposta.NMPROPUE
, NULL INIVIG
, FEBAJA FIMVIG
, DATA_ENVIO.OTVALOR DATAENVIO
, Tomador.DSNOMBRE TOMADOR
from
 co_tvalopro DATA_ENVIO
 ,mpersona Tomador
 ,co_prorol TomProp
 ,co_propol Proposta
where 1=1
   -- Calculo da data_envio
and DATA_ENVIO.cdatribu    = 5
and DATA_ENVIO.nmpropue    = Proposta.nmpropue
and DATA_ENVIO.cdunieco    = Proposta.cdunieco
and DATA_ENVIO.cdramo      = Proposta.cdramo
and DATA_ENVIO.femodif  = (
			select
						  Max(DATA_ENVIOA.femodif)
						from
						  co_tvalopro DATA_ENVIOA
						where
							  DATA_ENVIOA.cdramo   = DATA_ENVIO.cdramo
						  and DATA_ENVIOA.cdunieco = DATA_ENVIO.cdunieco
						  and DATA_ENVIOA.nmpropue = DATA_ENVIO.nmpropue
						  and DATA_ENVIOA.cdatribu = DATA_ENVIO.cdatribu
					   )
-- Calculo do Nome do Tomador
and Tomador.cdperson=TomProp.cdperson
-- Calculo de cdperson do Tomador
and TomProp.cdramo   = Proposta.cdramo
and TomProp.cdunieco = Proposta.cdunieco
and TomProp.nmpropue = Proposta.nmpropue
and TomProp.status   = 'V'
and TomProp.CDROL='TO'
and TomProp.nmordina = (
						select
						  Max(TomPropA.nmordina)
						from
						  co_prorol TomPropA
						where
							  TomPropA.cdramo   = TomProp.cdramo
						  and TomPropA.cdunieco = TomProp.cdunieco
						  and TomPropA.status   = TomProp.status
						  and TomPropA.nmpropue = TomProp.nmpropue
						  and TomPropA.cdrol    = TomProp.cdrol
					   )
AND NVL(PROPOSTA.FEBAJA,SYSDATE) = (SELECT NVL(MAX(FEBAJA),SYSDATE)
					   FROM CO_PROPOL PROP
					   WHERE 1=1
						AND PROP.CDUNIECO = PROPOSTA.CDUNIECO
						AND PROP.CDRAMO= PROPOSTA.CDRAMO
						AND PROP.NMPROPUE = PROPOSTA.NMPROPUE
					  )
and Proposta.femodif  = (
						select
						  Max(PropostaA.femodif)
						from
						  co_propol PropostaA
						where
							  PropostaA.cdramo   = Proposta.cdramo
						  and PropostaA.cdunieco = Proposta.cdunieco
						  and PropostaA.nmpropue = Proposta.nmpropue
					   )
AND PROPOSTA.NMPOLIZA IS NULL
AND PROPOSTA.SWESTADO != 'A' /*retirar as anuladas*/
and Proposta.cdunieco = 2
and Proposta.cdramo   = 150 
```
