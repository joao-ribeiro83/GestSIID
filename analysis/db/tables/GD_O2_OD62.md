# GD_O2_OD62

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| CDRAMO | NUMBER | 22 | 3 | 0 | N |  |  |
| NMPROPUE | NUMBER | 22 | 10 | 0 | N |  |  |
| NMPOLIZA | NUMBER | 22 | 10 | 0 | N |  |  |
| FEEFECTO | DATE | 7 |  |  | N |  |  |
| FEVENCIM | DATE | 7 |  |  | Y |  |  |
| ESTADO | VARCHAR2 | 1 |  |  | N |  |  |
| CDMONEDA | VARCHAR2 | 3 |  |  | N |  |  |
| DSRAMO | VARCHAR2 | 30 |  |  | N |  |  |
| CDPERSON | NUMBER | 22 | 9 | 0 | N |  |  |
| DSNOMBRE | VARCHAR2 | 160 |  |  | N |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
select 
  Apolice.cdunieco 
, Apolice.cdramo 
, Proposta.nmpropue 
, Apolice.nmpoliza 
, Apolice.feefecto 
, Apolice.fevencim 
, Apolice.estado 
, Apolice.cdmoneda 
, Ramo.dsramo 
, TomApol.cdperson 
, Tomador.dsnombre 
from 
  mpersona Tomador 
, mpoliper TomApol 
, mparapro Roles 
, tramos Ramo 
, mpolizas Apolice 
, co_propol Proposta 
where 
-- Calculo do Nome do Tomador 
    Tomador.cdperson=TomApol.cdperson 
-- Calculo de cdperson do Tomador 
and tomapol.nmpoliza    = Apolice.nmpoliza 
and tomapol.estado      = Apolice.estado 
and tomapol.cdunieco    = Apolice.cdunieco 
and tomapol.cdramo      = Apolice.cdramo 
and TomApol.nmsuplem 	= ( 
                             select 
                               MAX (tomapolA.nmsuplem) from mpoliper tomapolA 
                             where 
                                 tomapolA.cdrol    = tomapol.cdrol 
                             and tomapolA.nmsuplem <= TO_CHAR(sysdate,'J')||'99999999999' 
                             and tomapolA.nmpoliza = tomapol.nmpoliza 
                             and tomapolA.estado   = tomapol.estado 
                             and tomapolA.cdramo   = tomapol.cdramo 
                             and tomapolA.cdunieco = tomapol.cdunieco 
                          ) 
AND tomapol.status      = 'V' 
and TomApol.cdrol    	= Roles.cdrolTOM 
-- 
-- Calculo do Roles associados ao Produto 
-- 
and Roles.cdramo     = Apolice.cdramo 
-- 
-- Calculo do Ramo da Apolice 
-- 
and Ramo.cdramo=Apolice.cdramo 
-- 
-- Calculo da Proposta Associada 
-- 
and Proposta.cdunieco = Apolice.cdunieco 
and Proposta.cdramo   = Apolice.cdramo 
and Proposta.nmpropue = Apolice.nmsolici 
and Proposta.swestado = Apolice.estado 
and Proposta.femodif  = ( 
                          select 
			    Max(PropostaA.femodif) 
			  from 
			    co_propol PropostaA 
			  where 
			      PropostaA.swestado = Proposta.swestado 
			  and PropostaA.femodif <= sysdate 
			  and PropostaA.cdramo   = Proposta.cdramo 
			  and PropostaA.cdunieco = Proposta.cdunieco 
			  and PropostaA.nmpropue = Proposta.nmpropue 
                        ) 
-- Calculo da Apolice 
and Apolice.cdunieco = 1 
and Apolice.cdramo like '1%' 
and Apolice.estado in ('W','E') 
and Apolice.status   = 'V' 
and Apolice.cdtipcoa = 'N' 
and Apolice.nmsuplem = ( 
                         select 
			   Max(ApoliceA.nmsuplem) 
			 from 
			   mpolizas ApoliceA 
			 where 
			     ApoliceA.estado    = Apolice.estado 
			 and ApoliceA.nmsuplem <= TO_CHAR(sysdate,'J')||'99999999999' 
			 and ApoliceA.cdramo    = Apolice.cdramo 
			 and ApoliceA.cdunieco  = Apolice.cdunieco 
			 and ApoliceA.nmpoliza  = Apolice.nmpoliza 
                       ) 
order by 
  Apolice.cdramo asc 
, Apolice.nmpoliza desc

```
