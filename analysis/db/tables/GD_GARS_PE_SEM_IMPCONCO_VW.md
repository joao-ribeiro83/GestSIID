# GD_GARS_PE_SEM_IMPCONCO_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DEPARTAMENTO | VARCHAR2 | 3 |  |  | Y |  |  |
| UTILIZADOR | VARCHAR2 | 30 |  |  | Y |  |  |
| NUMERO_SPOOL | NUMBER | 22 |  |  | N |  |  |
| N_REFERENCIA | VARCHAR2 | 60 |  |  | Y |  |  |
| DESTINATARIO | VARCHAR2 | 240 |  |  | Y |  |  |
| MODELO_ID | VARCHAR2 | 10 |  |  | Y |  |  |
| DATA_PEDIDO | DATE | 7 |  |  | Y |  |  |
| DATA_IMPRESSAO | DATE | 7 |  |  | Y |  |  |
| IMPRESSORA | VARCHAR2 | 240 |  |  | Y |  |  |
| CDUNIECO | VARCHAR2 | 2000 |  |  | Y |  |  |
| CDRAMO | VARCHAR2 | 2000 |  |  | Y |  |  |
| NMPOLIZA | VARCHAR2 | 2000 |  |  | Y |  |  |
| NMGARANT | VARCHAR2 | 2000 |  |  | Y |  |  |
| CDPERSON | VARCHAR2 | 2000 |  |  | Y |  |  |
| LISTA_GARANTIAS | VARCHAR2 | 2002 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
select "DEPARTAMENTO","UTILIZADOR","NUMERO_SPOOL","N_REFERENCIA","DESTINATARIO","MODELO_ID","DATA_PEDIDO","DATA_IMPRESSAO","IMPRESSORA","CDUNIECO","CDRAMO","NMPOLIZA","NMGARANT","CDPERSON","LISTA_GARANTIAS" from gd_garantias_executadas_vw g  
where  
exists (  
select 1 from co_progar x, mpolizas p  
where  
X.IMPCONCO IS NULL  
AND decode(X.SWESTADO, 'PE', 'S', 'PP', 'S', 'N') = 'S'  
AND  x.nmgarant = g.nmgarant  
and x.nmpropue = p.nmsolici  
and x.cdramo = p.cdramo  
and x.cdunieco = p.cdunieco  
and p.nmpoliza = g.nmpoliza  
and p.estado  = 'M'  
AND P.CDRAMO = G.CDRAMO  
AND P.CDUNIECO = G.CDUNIECO)  
AND DECODE(G.MODELO_ID,'R3.D25','S','R3.D25R','S', 'N')='S'  
order by data_pedido desc

```
