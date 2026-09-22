# GD_M_M82_PAGAMENTOS

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| CDRAMO | NUMBER | 22 | 3 | 0 | N |  |  |
| AAAPERTU | NUMBER | 22 | 4 | 0 | N |  |  |
| NMSINIES | NUMBER | 22 | 6 | 0 | N |  |  |
| CDESTADO | VARCHAR2 | 1 |  |  | N |  |  |
| NMPOLIZA | NUMBER | 22 | 10 | 0 | N |  |  |
| FEOCURRE | DATE | 7 |  |  | N |  |  |
| FEAPERTU | DATE | 7 |  |  | N |  |  |
| FEULTEST | DATE | 7 |  |  | N |  |  |
| CDPAIS | VARCHAR2 | 3 |  |  | Y |  |  |
| INICIAL | NUMBER | 22 |  |  | Y |  |  |
| REAJUSTES | NUMBER | 22 |  |  | Y |  |  |
| INDMN_JUROS_PAGOS | NUMBER | 22 |  |  | Y |  |  |
| HON_DESP_PAGOS | NUMBER | 22 |  |  | Y |  |  |
| INDMN_JUROS_RECOBRO | NUMBER | 22 |  |  | Y |  |  |
| HON_DESP_RECOBRO | NUMBER | 22 |  |  | Y |  |  |
| PARTICIPA | NUMBER | 22 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
select ms.cdunieco, ms.cdramo, ms.aaapertu, ms.nmsinies,ms.cdestado, ms.nmpoliza  
,ms.feocurre, ms.feapertu, ms.feultest,mper.cdpais  
,0 INICIAL  
,0 REAJUSTES  
,sum(decode(mpa.cdtipmov, '1',  
decode(mip.cdtipimp, 'I', mdp.imprefer  
, '8' , mdp.imprefer  
, null)  
, null)*tca.PTCAMBIO*NVL(mpc.porcpart,1))   INDMN_JUROS_PAGOS  
,sum(decode(mpa.cdtipmov, '1',  
decode(mip.cdtipimp, '1', mdp.imprefer  
, '2' , mdp.imprefer  
, null)  
, null)*tca.PTCAMBIO*NVL(mpc.porcpart,1))   HON_DESP_PAGOS  
,sum(decode(mpa.cdtipmov, '2',  
decode(mip.cdtipimp, 'I', mdp.imprefer  
, '8' , mdp.imprefer  
, null)  
, null)*tca.PTCAMBIO*NVL(mpc.porcpart,1))   INDMN_JUROS_RECOBRO  
,sum(decode(mpa.cdtipmov, '2',  
decode(mip.cdtipimp, '1', mdp.imprefer  
, '2' , mdp.imprefer  
, null)  
, null)*tca.PTCAMBIO*NVL(mpc.porcpart,1))   HON_DESP_RECOBRO  
,NVL(cp.nmproame,0) PARTICIPA  
from  
TCAMBIOS tca  
,msiniest ms  
,MPOLICOA MPC  
,MPAGOSIN mpa  
,MIMPSIN mip  
,MDSPASIN mdp  
,MPOLIPER mpp  
,MPERSONA mper  
,co_parsi cp  
where  
ms.status     = 'M'  
and mpp.cdunieco  = ms.cdunieco  
and mpp.cdramo    = ms.cdramo  
and mpp.estado    = ms.status  
and mpp.nmpoliza  = ms.nmpoliza  
and mpp.nmsituac  = 0  
and mpp.cdrol     = (select cdroltom  
from   MPARAPRO  
where  cdramo = ms.cdramo)  
and mpp.nmsuplem  = (select max(mpp1.nmsuplem)  
from mpoliper mpp1  
where  
mpp1.cdunieco  = mpp.cdunieco  
and mpp1.cdramo    = mpp.cdramo  
and mpp1.estado    = mpp.estado  
and mpp1.nmpoliza  = mpp.nmpoliza  
and mpp1.nmsituac  = mpp.nmsituac  
and mpp1.cdrol     = mpp.cdrol  
and mpp1.cdperson  = mpp.cdperson  
and mpp1.nmsuplem <= ms.nmsuplem)  
and mper.cdperson = mpp.cdperson  
and mpa.cdunieco  = ms.cdunieco  
and mpa.cdramo    = ms.cdramo  
and mpa.aaapertu  = ms.aaapertu  
and mpa.status    = ms.status  
and mpa.nmsinies  = ms.nmsinies  
and decode(mpa.cdtipmov,'1','S','2','S','N')= 'S'  
and decode(mpa.swestado,'2','S','3','S','N')= 'S'  
and mdp.cdunieco  = mpa.cdunieco  
and mdp.cdramo    = mpa.cdramo  
and mdp.aaapertu  = mpa.aaapertu  
and mdp.status    = mpa.status  
and mdp.nmsinies  = mpa.nmsinies  
and mdp.nmordpag  = mpa.nmordpag  
and mdp.cdimpues  = mip.cdimpues  
and decode(mip.cdtipimp,'I','S','1','S','2','S','8','S','N')= 'S'  
and mpc.cdunieco(+) = ms.cdunieco  
and mpc.cdramo(+)   = ms.cdramo  
and mpc.estado(+)   = ms.status  
and mpc.nmpoliza(+) = ms.nmpoliza  
and mpc.swabrido(+) = 'S'  
and mpc.status(+)   = 'V'  
and mpc.cdtipcoa(+) = 'C'  
and nvl(mpc.nmsuplem,0) = (select NVL(max(mpc1.nmsuplem),0)  
from mpolicoa mpc1  
where  
mpc1.cdunieco  = mpc.cdunieco  
and mpc1.cdramo    = mpc.cdramo  
and mpc1.estado    = mpc.estado  
and mpc1.nmpoliza  = mpc.nmpoliza  
and mpc1.cdcia     = mpc.cdcia  
and mpc1.cdtipcoa  = mpc.cdtipcoa  
and mpc1.nmsuplem <= ms.nmsuplem )  
and tca.cdmoneda = (select tk.cdeuro  
from tkrnlpar tk)  
and tca.cdmonbas = mpa.cdmoneda  
and tca.fevalor  = (select max(tca1.fevalor)  
from tcambios tca1  
where  
tca1.cdmoneda=tca.cdmoneda  
and tca1.cdmonbas=tca.cdmonbas  
and tca1.fevalor<=LAST_DAY(ADD_MONTHS(SYSDATE,-1)))  
and cp.cdunieco(+) = ms.cdunieco  
and cp.cdtipora(+) = MS.cdtipora  
and cp.nmproame(+) = ms.nmproame  
and cp.nmcomame(+) = ms.nmcomame  
group by  
ms.cdunieco, ms.cdramo, ms.aaapertu, ms.nmsinies, ms.cdestado, ms.nmpoliza  
,ms.feocurre, ms.feapertu, ms.feultest, mper.cdpais, NVL(cp.nmproame,0)

```
