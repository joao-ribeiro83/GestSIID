# GD_MVS_CARREGADAS_VW

Owner: `SIID_TESTES` &nbsp; Type: `VIEW`

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| NOME | VARCHAR2 | 128 |  |  | N |  |  |
| LAST_REFRESH | DATE | 7 |  |  | Y |  |  |
| NUMERO_ERROS | NUMBER | 22 |  |  | Y |  |  |
| PROXIMO_REFRESCAMENTO | DATE | 7 |  |  | Y |  |  |
| CALCULA_PROXIMO_REFRESCAMENTO | VARCHAR2 | 200 |  |  | Y |  |  |
| STATUS | VARCHAR2 | 7 |  |  | Y |  |  |
| CONTINUE_AFTER_BREAK | VARCHAR2 | 1 |  |  | Y |  |  |
| ID | NUMBER | 22 |  |  | N |  |  |
| JOB_DESCRIPTION | VARCHAR2 | 4000 |  |  | Y |  |  |
| PROXIMA_DATA | DATE | 7 |  |  | N |  |  |
| DATA_INICIO | DATE | 7 |  |  | Y |  |  |
| DATA_FIM | DATE | 7 |  |  | Y |  |  |
| TEMPO_DECORRIDO | NUMBER | 22 |  |  | Y |  |  |
| SEG_DECORRIDOS | NUMBER | 22 |  |  | Y |  |  |
| MIN_DECORRIDOS | NUMBER | 22 |  |  | Y |  |  |
| HOR_DECORRIDOS | NUMBER | 22 |  |  | Y |  |  |
| DIA_DECORRIDOS | NUMBER | 22 |  |  | Y |  |  |
| NUM_FALHAS | NUMBER | 22 |  |  | Y |  |  |
| BROKEN | VARCHAR2 | 1 |  |  | Y |  |  |


## Primary / unique keys

_(none)_


## Foreign keys

_(none)_


## Indexes

_(none)_


## View SQL text

```sql
select   
snp.name                             nome   
, snp.last_refresh                     last_refresh   
, snp.error                            numero_erros   
, snp.start_with                       proximo_refrescamento   
, snp.next                             calcula_proximo_refrescamento   
, snp.status                           status   
, rfr.refresh_after_errors             continue_after_break   
, J.JOB                                ID   
, J.WHAT                               JOB_DESCRIPTION   
, J.NEXT_DATE                          PROXIMA_DATA   
, J.LAST_date                          DATA_INICIO   
, J.LAST_date + J.TOTAL_time/(3600*24) DATA_FIM   
, J.TOTAL_time                         TEMPO_DECORRIDO   
, MOD(J.TOTAL_time, 60)                SEG_DECORRIDOS   
, TRUNC(MOD(J.TOTAL_time/60,60))       MIN_DECORRIDOS   
, TRUNC(MOD(J.TOTAL_time/3600,24))     HOR_DECORRIDOS   
, TRUNC(J.TOTAL_time/(3600*24))        DIA_DECORRIDOS   
, J.FAILURES                           NUM_FALHAS   
, J.BROKEN   
from   
USER_JOBS      J   
, user_snapshots snp   
, user_refresh   rfr   
where   
snp.refresh_group = rfr.refgroup   
and   
rfr.job = j.job

```
