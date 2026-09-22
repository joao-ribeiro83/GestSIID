# GD_O2_OD66

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| CDRAMO | NUMBER | 22 | 3 | 0 | N |  |  |
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
,Apolice.cdramo  
,Apolice.nmpoliza  
,Apolice.feefecto  
,Apolice.fevencim  
,Apolice.estado  
,Apolice.cdmoneda  
,Ramo.dsramo  
,TomApol.cdperson  
,Tomador.dsnombre  
from  
mpersona Tomador  
,mparapro Roles  
,mpoliper TomApol  
,tramos Ramo  
,mpolizas Apolice  
where  
-- Calculo do Nome do Tomador  
Tomador.cdperson=TomApol.cdperson  
-- Calculo de cdperson do Tomador  
and TomApol.nmpoliza    = Apolice.nmpoliza  
and TomApol.estado      = Apolice.estado  
and TomApol.cdunieco    = Apolice.cdunieco  
and TomApol.cdramo      = Apolice.cdramo  
and	TomApol.nmsuplem = (  
select  
MAX (tomapolA.nmsuplem) from mpoliper tomapolA  
where  
tomapolA.cdrol    = tomapol.cdrol  
and tomapolA.nmsuplem <= TO_CHAR(sysdate,'J')||'99999999999'  
and tomapolA.nmpoliza = TomApol.nmpoliza  
and tomapolA.estado   = TomApol.estado  
and tomapolA.cdramo   = TomApol.cdramo  
and tomapolA.cdunieco = TomApol.cdunieco  
)  
AND tomapol.status      = 'V'  
and	TomApol.cdrol    = Roles.cdrolTOM  
-- Calculo do Roles associados ao Produto  
and Roles.cdramo     = Apolice.cdramo  
-- Calculo do Ramo da Apolice  
and Ramo.cdramo=Apolice.cdramo  
-- Calculo da Proposta Associada  
and Apolice.estado        = 'M'  
and Apolice.status        = 'V'  
and nvl(Apolice.nmsuplem,0)= (  
select  
nvl(Max(ApoliceA.nmsuplem),0)  
from  
mpolizas ApoliceA  
where  
ApoliceA.estado        = Apolice.estado  
and ApoliceA.cdramo        = Apolice.cdramo  
and ApoliceA.cdunieco      = Apolice.cdunieco  
and ApoliceA.nmpoliza      = Apolice.nmpoliza  
)

```
