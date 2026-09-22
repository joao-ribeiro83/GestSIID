# GD_PAGAMENTOS_SINISTRO_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDUNIECO | NUMBER | 22 | 3 | 0 | N |  |  |
| CDRAMO | NUMBER | 22 | 3 | 0 | N |  |  |
| AAAPERTU | NUMBER | 22 | 4 | 0 | N |  |  |
| NMSINIES | NUMBER | 22 | 6 | 0 | N |  |  |
| CDESTADO | VARCHAR2 | 1 |  |  | N |  |  |
| DT_ESTADO | DATE | 7 |  |  | N |  |  |
| NMPOLIZA | NUMBER | 22 | 10 | 0 | N |  |  |
| DT_OCORRENCIA | DATE | 7 |  |  | N |  |  |
| DT_SINISTRO | DATE | 7 |  |  | N |  |  |
| CDPAIS | VARCHAR2 | 3 |  |  | Y |  |  |
| INICIAL | NUMBER | 22 |  |  | Y |  |  |
| REAJUSTES | NUMBER | 22 |  |  | Y |  |  |
| PTCAMBIO | NUMBER | 22 | 17 | 10 | N |  |  |
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
select  
  SINISTRO.cdunieco										CDUNIECO 
, SINISTRO.cdramo										CDRAMO 
, SINISTRO.aaapertu										AAAPERTU 
, SINISTRO.nmsinies										NMSINIES 
, SINISTRO.cdestado										CDESTADO 
, SINISTRO.feultest										DT_ESTADO 
, SINISTRO.nmpoliza										NMPOLIZA 
, SINISTRO.feocurre										DT_OCORRENCIA 
, SINISTRO.feapertu										DT_SINISTRO 
, TOMADOR.cdpais										CDPAIS 
, 0 INICIAL 
, 0 REAJUSTES 
, CAMBIO.PTCAMBIO 
, sum(decode(PAGAMENTOS.cdtipmov, '1', decode(VALORES_SINISTRO.cdtipimp, 'I', DETALHES_PAG.imprefer 
                                                   , '8', DETALHES_PAG.imprefer 
                                                   , 0) 
                              , 0)*NVL(APOLICES_PARTICIP.porcpart,1))				INDMN_JUROS_PAGOS 
, sum(decode(PAGAMENTOS.cdtipmov, '1', decode(VALORES_SINISTRO.cdtipimp, '1', DETALHES_PAG.imprefer 
                                                   , '2', DETALHES_PAG.imprefer 
                                                   , 0) 
                              , 0)*NVL(APOLICES_PARTICIP.porcpart,1))				HON_DESP_PAGOS 
, sum(decode(PAGAMENTOS.cdtipmov, '2', decode(VALORES_SINISTRO.cdtipimp, 'I', DETALHES_PAG.imprefer 
                                                   , '8', DETALHES_PAG.imprefer 
                                                   , 0) 
                              , 0)*NVL(APOLICES_PARTICIP.porcpart,1))				INDMN_JUROS_RECOBRO 
, sum(decode(PAGAMENTOS.cdtipmov, '2', decode(VALORES_SINISTRO.cdtipimp, '1', DETALHES_PAG.imprefer 
                                                   , '2', DETALHES_PAG.imprefer 
                                                   , 0) 
                              , 0)*NVL(APOLICES_PARTICIP.porcpart,1))				HON_DESP_RECOBRO 
, NVL(PARTICIPACAO.nmproame,0)									PARTICIPA 
from 
  MPARAPRO      CODROLTOM 
, MIMPSIN 	VALORES_SINISTRO 
, TCAMBIOS 	CAMBIO 
, MPOLICOA 	APOLICES_PARTICIP 
, co_parsi 	PARTICIPACAO 
, MPAGOSIN 	PAGAMENTOS 
, msiniest 	SINISTRO 
, MDSPASIN 	DETALHES_PAG 
, MPOLIPER 	TOMAPOL 
, MPERSONA 	TOMADOR 
where 
    TOMAPOL.cdunieco                  = SINISTRO.cdunieco 
and TOMAPOL.cdramo                    = SINISTRO.cdramo 
and TOMAPOL.estado                    = SINISTRO.status 
and TOMAPOL.nmpoliza                  = SINISTRO.nmpoliza 
and TOMAPOL.nmsituac                  = 0 
AND CODROLTOM.CDRAMO                  = SINISTRO.cdramo 
and TOMAPOL.cdrol                     = CODROLTOM.cdroltom  
and TOMAPOL.nmsuplem                  = ( 
                                          select  
                                            max(X.nmsuplem) 
                                          from  
                                            mpoliper X 
                                          where  
                                              X.cdunieco  = TOMAPOL.cdunieco 
                                          and X.cdramo    = TOMAPOL.cdramo 
                                          and X.estado    = TOMAPOL.estado 
                                          and X.nmpoliza  = TOMAPOL.nmpoliza 
                                          and X.nmsituac  = TOMAPOL.nmsituac 
                                          and X.cdrol     = TOMAPOL.cdrol 
                                          and X.cdperson  = TOMAPOL.cdperson 
                                          and X.nmsuplem <= SINISTRO.nmsuplem 
                                        ) 
and TOMADOR.cdperson                  = TOMAPOL.cdperson 
and PAGAMENTOS.cdunieco               = SINISTRO.cdunieco 
and PAGAMENTOS.cdramo                 = SINISTRO.cdramo 
and PAGAMENTOS.aaapertu               = SINISTRO.aaapertu 
and PAGAMENTOS.status                 = SINISTRO.status 
and PAGAMENTOS.nmsinies               = SINISTRO.nmsinies 
and DETALHES_PAG.cdunieco             = PAGAMENTOS.cdunieco 
and DETALHES_PAG.cdramo               = PAGAMENTOS.cdramo 
and DETALHES_PAG.aaapertu             = PAGAMENTOS.aaapertu 
and DETALHES_PAG.status               = PAGAMENTOS.status 
and DETALHES_PAG.nmsinies             = PAGAMENTOS.nmsinies 
and DETALHES_PAG.nmordpag             = PAGAMENTOS.nmordpag 
and DETALHES_PAG.cdimpues             = VALORES_SINISTRO.cdimpues 
and APOLICES_PARTICIP.cdunieco (+)    = SINISTRO.cdunieco 
and APOLICES_PARTICIP.cdramo   (+)    = SINISTRO.cdramo 
and APOLICES_PARTICIP.estado   (+)    = SINISTRO.status 
and APOLICES_PARTICIP.nmpoliza (+)    = SINISTRO.nmpoliza 
and APOLICES_PARTICIP.swabrido (+)    = 'S' 
and APOLICES_PARTICIP.status   (+)    = 'V' 
and APOLICES_PARTICIP.cdtipcoa (+)    = 'C' 
and nvl(APOLICES_PARTICIP.nmsuplem,0) = ( 
                                          select  
                                            NVL(max(X.nmsuplem),0) 
                                          from  
                                            mpolicoa X 
                                          where 
                                              X.cdunieco  = APOLICES_PARTICIP.cdunieco 
                                          and X.cdramo    = APOLICES_PARTICIP.cdramo 
                                          and X.estado    = APOLICES_PARTICIP.estado 
                                          and X.nmpoliza  = APOLICES_PARTICIP.nmpoliza 
                                          and X.cdcia     = APOLICES_PARTICIP.cdcia 
                                          and X.cdtipcoa  = APOLICES_PARTICIP.cdtipcoa 
                                          and X.nmsuplem <= SINISTRO.nmsuplem  
                                        ) 
and CAMBIO.cdmoneda                   = ( 
                                          select  
                                            tk.cdeuro 
                                          from  
                                            tkrnlpar tk 
                                        ) 
and CAMBIO.cdmonbas                   = PAGAMENTOS.cdmoneda 
and CAMBIO.fevalor                    = ( 
                                          select  
                                            max(X.fevalor)						   	 
                                          from  
                                            tcambios X 
                                          where  
                                              X.cdmoneda=CAMBIO.cdmoneda 
                                          and X.cdmonbas=CAMBIO.cdmonbas 
                                          and X.fevalor<=LAST_DAY(ADD_MONTHS(SYSDATE,-1)) 
                                        ) 
and PARTICIPACAO.cdunieco(+) = SINISTRO.cdunieco 
and PARTICIPACAO.cdtipora(+) = SINISTRO.cdtipora 
and PARTICIPACAO.nmproame(+) = SINISTRO.nmproame 
and PARTICIPACAO.nmcomame(+) = SINISTRO.nmcomame 
and decode(PAGAMENTOS.cdtipmov, '1', 'S' 
                              , '2', 'S' 
                              , 'N') = 'S' 
and decode(PAGAMENTOS.swestado, '2', 'S' 
                              , '3', 'S' 
                              , 'N')= 'S' 
and decode(VALORES_SINISTRO.cdtipimp, 'I', 'S' 
                                    , '1', 'S' 
                                    , '2', 'S' 
                                    , '8', 'S' 
                                    , 'N') = 'S' 
AND  SINISTRO.status       = 'M' 
group by 
  SINISTRO.cdunieco 
, SINISTRO.cdramo 
, SINISTRO.aaapertu 
, SINISTRO.nmsinies 
, SINISTRO.cdestado 
, SINISTRO.nmpoliza 
, SINISTRO.feocurre 
, SINISTRO.feapertu 
, SINISTRO.feultest 
, TOMADOR.cdpais 
, CAMBIO.PTCAMBIO 
, NVL(PARTICIPACAO.nmproame,0)

```
