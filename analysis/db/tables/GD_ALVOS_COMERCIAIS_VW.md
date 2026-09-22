# GD_ALVOS_COMERCIAIS_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| NUC | NUMBER | 22 | 9 | 0 | N |  |  |
| NIPC | VARCHAR2 | 20 |  |  | N |  |  |
| NOME_EMPRESA | VARCHAR2 | 160 |  |  | N |  |  |
| WEBSITE | VARCHAR2 | 60 |  |  | Y |  |  |
| EMAIL | VARCHAR2 | 70 |  |  | Y |  |  |
| CAE | VARCHAR2 | 5 |  |  | Y |  |  |
| SECTORACTIVIDADE | VARCHAR2 | 215 |  |  | N |  |  |
| MORADA | VARCHAR2 | 240 |  |  | Y |  |  |
| CDPOSTAL | VARCHAR2 | 9 |  |  | Y |  |  |
| LOCALIDADE | VARCHAR2 | 50 |  |  | Y |  |  |
| TELEFONE | VARCHAR2 | 18 |  |  | Y |  |  |
| FAX | VARCHAR2 | 18 |  |  | Y |  |  |
| CONCELHO | VARCHAR2 | 40 |  |  | Y |  |  |
| DISTRITO | VARCHAR2 | 30 |  |  | Y |  |  |
| EMPREGADOS | NUMBER | 22 | 6 | 0 | Y |  |  |
| GESTORES | VARCHAR2 | 4000 |  |  | Y |  |  |
| IMP_EXP | VARCHAR2 | 4000 |  |  | Y |  |  |
| MARCAS | VARCHAR2 | 4000 |  |  | Y |  |  |
| VOL_NEG | NUMBER | 22 |  |  | Y |  |  |
| DSGRUENT | VARCHAR2 | 30 |  |  | Y |  |  |
| DOMINANTE | VARCHAR2 | 1 |  |  | Y |  |  |
| DOMINADA | VARCHAR2 | 1 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
Select 
 Entidade.cdperson                        NUC 
,Entidade.cdideper                        NIPC 
,Entidade.dsnombre                        Nome_Empresa 
,Entidade.pag_web                         WebSite 
,Entidade.e_mail                          Email 
,CoEntidade.cdcae                         CAE 
,CodCaes.dsport                           SectorActividade                       
,DomicilioEntidade.dsdomici               Morada 
,DomicilioEntidade.cdpostal               cdpostal 
,DomicilioEntidade.otpiso                 Localidade 
,DomicilioEntidade.nmtelefo               TELEFONE 
,DomicilioEntidade.nmfax                  FAX 
,Concelho.dsconcej                        Concelho 
,Distrito.DSPROVIN                        Distrito 
,EntidadeComercial.nmtotal                Empregados 
,PKG_FORMULAS_COSEC.GET_GESTOR_ENTIDADE(Entidade.cdperson) GESTORES 
,PKG_FORMULAS_COSEC.GET_PAISES_IMPEXP(Entidade.cdperson,'ALL') IMP_EXP 
,PKG_FORMULAS_COSEC.GET_MARCAS(Entidade.cdperson,'ALL')        MARCAS 
,PKG_FORMULAS_COSEC.GET_VOL_NEG(Entidade.cdperson)        VOL_NEG 
,GrupoEntidade.dsgruent 
,Decode(ENTIREL.swdomina,'S','S',' ') DOMINANTE 
,Decode(ENTIREL.swdomina,'N','S',' ') DOMINADA 
from 
 Dual 
 ,TPROVIN    Distrito 
 ,co_concejo Concelho 
 ,mpersona   Entidade 
 ,mdomicil   DomicilioEntidade 
 ,co_enticom EntidadeComercial 
 ,co_entidad CoEntidade 
 ,co_caes    CodCaes 
 ,co_entirel ENTIREL 
 ,CO_GRUPENT GrupoEntidade 
where 
1=1 
and GrupoEntidade.cdgruent (+)= ENTIREL.cdgruent 
and ENTIREL.cdperfil (+)= Entidade.cdperson 
and EntidadeComercial.cdperson = Entidade.cdperson 
and EntidadeComercial.datacom = ( 
                                Select 
								Max(X.DataCOM) 
								From 
                                  co_enticom X 
								where 
								1=1 
								and X.cdperson=EntidadeComercial.cdperson							 
								) 
and Distrito.cdprovin (+)= DomicilioEntidade.cdprovin 
and Distrito.cdpais   (+)= DomicilioEntidade.cdpais 
and Concelho.cdprovin (+)= DomicilioEntidade.cdprovin 
and Concelho.cdconcej (+)= DomicilioEntidade.cdconcej 
and Concelho.cdpais   (+)= DomicilioEntidade.cdpais 
and DomicilioEntidade.cdperson = Entidade.cdperson 
and DomicilioEntidade.nmorddom = ( 
								 Select 
                                   Max(X.nmorddom) 
								 From 
								   mdomicil X 
								 Where 
								 1=1 
								 and X.cdperson = DomicilioEntidade.cdperson  
								 and X.cdtipdom='01' 
--								 and X.cdtipdom in ('01','06') 
                                 ) 
and CodCaes.cdcae       = CoEntidade.cdcae 
AND CoEntidade.cdcae not between 52200 and 52740 
AND CoEntidade.cdcae not between 55100 and 55520 
AND CoEntidade.cdcae not between 60100 and 67200 
AND CoEntidade.cdcae not between 75100 and 99000 
and CoEntidade.cdperson = Entidade.cdperson 
and Decode(PKG_FORMULAS_COSEC.GET_VOL_NEG(Entidade.cdperson),0,Decode(Sign(EntidadeComercial.nmtotal-20),-1,0,1500001),PKG_FORMULAS_COSEC.GET_VOL_NEG(Entidade.cdperson))>=1500000 
--and Entidade.cdperson   = 90002911

```
