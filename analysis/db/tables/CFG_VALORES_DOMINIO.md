# CFG_VALORES_DOMINIO

Owner: `SIID_TESTES` &nbsp; Type: `TABLE`

Row count: **230**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DOMINIO_ID | VARCHAR2 | 60 |  |  | N |  |  |
| CHAVE | VARCHAR2 | 30 |  |  | N |  |  |
| DESIGNACAO | VARCHAR2 | 60 |  |  | Y |  |  |
| DESCRICAO | VARCHAR2 | 200 |  |  | Y |  |  |
| DATA_INICIO | DATE | 7 |  |  | Y | SYSDATE |  |
| DATA_FIM | DATE | 7 |  |  | Y |  |  |
| PRIORIDADE | NUMBER | 22 |  |  | Y | 0 |  |
| VERSAO | NUMBER | 22 |  |  | Y | 0.0 |  |
| DATA_REGISTO | DATE | 7 |  |  | Y | SYSDATE |  |
| REGISTADO_POR | VARCHAR2 | 30 |  |  | Y | USER |  |
| DATA_ACTUALIZACAO | DATE | 7 |  |  | Y |  |  |
| ACTUALIZADO_POR | VARCHAR2 | 30 |  |  | Y |  |  |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| PK_ID_CVD | P | DOMINIO_ID | 1 |
| PK_ID_CVD | P | CHAVE | 2 |


## Foreign keys

| CONSTRAINT_NAME | COLUMN_NAME | POSITION | R_OWNER | R_TABLE_NAME |
| --- | --- | --- | --- | --- |
| FK_DOMINIO_CVD | DOMINIO_ID | 1 | SIID_TESTES | CFG_DOMINIOS |


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| PK_ID_CVD | UNIQUE | DOMINIO_ID | 1 |
| PK_ID_CVD | UNIQUE | CHAVE | 2 |


## First 200 rows

| DOMINIO_ID | CHAVE | DESIGNACAO | DESCRICAO | DATA_INICIO | DATA_FIM | PRIORIDADE | VERSAO | DATA_REGISTO | REGISTADO_POR | DATA_ACTUALIZACAO | ACTUALIZADO_POR |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BINARIO | N | NAO | Não | Thu Dec 01 2005 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0.2 | Tue Dec 01 2009 00:00:00 GMT+0000 (Western European Standard Time) | ADMIN |  |  |
| BINARIO | S | SIM | Sim | Thu Dec 01 2005 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0.2 | Tue Dec 01 2009 00:00:00 GMT+0000 (Western European Standard Time) | ADMIN |  |  |
| CODIGOS BARRAS | AZTEC | AZTEC | AZTEC | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | CODE_128 | CODE_128 | CODE_128 | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | CODE_128_C | CODE_128_C | CODE_128_COMPACT | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | CODE_39 | CODE_39 | CODE_39 | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | CODE_93 | CODE_93 | CODE_93 | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | DATA_MATRIX | DATA_MATRIX | DATA_MATRIX | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | DATA_MATRIX_C | DATA_MATRIX_C | DATA_MATRIX_COMPACT | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | DATA_MATRIX_RECTANGLE | DATA_MATRIX_RECTANGLE | DATA_MATRIX_RECTANGLE | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | DATA_MATRIX_RECTANGLE_C | DATA_MATRIX_RECTANGLE_COMPACT | DATA_MATRIX_RECTANGLE_C | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | DATA_MATRIX_SQUARE | DATA_MATRIX_SQUARE | DATA_MATRIX_SQUARE | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | DATA_MATRIX_SQUARE_C | DATA_MATRIX_SQUARE_COMPACT | DATA_MATRIX_SQUARE_C | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | PDF417_0 | PDF417 EC-0 | PDF417-ERROR_CORRECTION=0 | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | PDF417_0_C | PDF417 EC-0 COMP | PDF417-ERROR_CORRECTION=0-COMPACT | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | PDF417_1 | PDF417 EC-1 | PDF417-ERROR_CORRECTION=1 | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | PDF417_1_C | PDF417 EC-1 COMP | PDF417-ERROR_CORRECTION=1-COMPACT | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | PDF417_2 | PDF417 EC-2 | PDF417-ERROR_CORRECTION=2 | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | PDF417_2_C | PDF417 EC-2 COMP | PDF417-ERROR_CORRECTION=2-COMPACT | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | PDF417_3 | PDF417 EC-3 | PDF417-ERROR_CORRECTION=3 | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | PDF417_3_C | PDF417 EC-3 COMP | PDF417-ERROR_CORRECTION=3-COMPACT | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | PDF417_4 | PDF417 EC-4 | PDF417-ERROR_CORRECTION=4 | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | PDF417_4_C | PDF417 EC-4 COMP | PDF417-ERROR_CORRECTION=4-COMPACT | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | PDF417_5 | PDF417 EC-5 | PDF417-ERROR_CORRECTION=5 | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | PDF417_5_C | PDF417 EC-5 COMP | PDF417-ERROR_CORRECTION=5-COMPACT | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | PDF417_6 | PDF417 EC-6 | PDF417-ERROR_CORRECTION=6 | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | PDF417_6_C | PDF417 EC-6 COMP | PDF417-ERROR_CORRECTION=6-COMPACT | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | PDF417_7 | PDF417 EC-7 | PDF417-ERROR_CORRECTION=7 | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | PDF417_7_C | PDF417 EC-7 COMP | PDF417-ERROR_CORRECTION=7-COMPACT | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | PDF417_8 | PDF417 EC-8 | PDF417-ERROR_CORRECTION=8 | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | PDF417_8_C | PDF417 EC-8 COMP | PDF417-ERROR_CORRECTION=8-COMPACT | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | QRCODE_H | QRCODE EC=H | QRCODE ERROR_CORRECTION=H | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | QRCODE_L | QRCODE EC=L | QRCODE ERROR_CORRECTION=L | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | QRCODE_M | QRCODE EC=M | QRCODE ERROR_CORRECTION=M | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| CODIGOS BARRAS | QRCODE_Q | QRCODE EC=Q | QRCODE ERROR_CORRECTION=Q | Sun Oct 01 2023 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 1 | Mon Oct 16 2023 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| DISPONIVEL | ANU | ANULADO | Documento Anulado | Fri Jan 01 2010 00:00:00 GMT+0000 (Western European Standard Time) |  | 2 | 0 | Fri Jan 22 2010 00:00:00 GMT+0000 (Western European Standard Time) | DISCOSECFOR |  |  |
| DISPONIVEL | OFF | OFFLINE | Documento Arquivado | Fri Jan 01 2010 00:00:00 GMT+0000 (Western European Standard Time) |  | 1 | 0 | Fri Jan 22 2010 00:00:00 GMT+0000 (Western European Standard Time) | DISCOSECFOR |  |  |
| DISPONIVEL | ONL | ONLINE | Documento Disponível | Fri Jan 01 2010 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 22 2010 00:00:00 GMT+0000 (Western European Standard Time) | DISCOSECFOR |  |  |
| DIVISA | EURO | Euro | Tipo de divisa Euro | Wed Nov 30 2005 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0.2 | Tue Dec 01 2009 00:00:00 GMT+0000 (Western European Standard Time) | ADMIN |  |  |
| ENTIDADES IMPORTANTES | DGTF | 95302123 | DIRECÇÃO-GERAL DO TESOURO E FINANÇAS | Wed Nov 07 2018 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Wed Nov 07 2018 00:00:00 GMT+0000 (Western European Standard Time) | DISCOSEC |  |  |
| ESTADO_PERIODO | ABERTO | Aberto | Estado de documento Aberto | Tue Aug 05 2008 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 0.1 | Tue Dec 01 2009 00:00:00 GMT+0000 (Western European Standard Time) | ADMIN |  |  |
| ESTADO_PERIODO | FACTURADO | Facturado | Estado de documento Facturado | Tue Aug 05 2008 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 0.1 | Tue Dec 01 2009 00:00:00 GMT+0000 (Western European Standard Time) | ADMIN |  |  |
| ESTADO_REGISTO | A | ANULADO | Registo Anulado | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 22 2010 00:00:00 GMT+0000 (Western European Standard Time) | DISCOSECFOR |  |  |
| ESTADO_REGISTO | N | Novo | Registo novo | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0.2 | Tue Dec 01 2009 00:00:00 GMT+0000 (Western European Standard Time) | ADMIN |  |  |
| EXCLUSAO_RISCO | 2 | 2 | unidade económica 2 | Fri Jul 06 2012 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 0 | Fri Jul 06 2012 00:00:00 GMT+0100 (Western European Summer Time) | SIID_TESTES |  |  |
| FORMATACAO_STRING | M | MAIUSCULO | Formato maiúsculo | Wed Nov 30 2005 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0.3 | Tue Dec 01 2009 00:00:00 GMT+0000 (Western European Standard Time) | ADMIN |  |  |
| FORMATACAO_STRING | N | MINUSCULO | Formato minúsculo | Wed Nov 30 2005 00:00:00 GMT+0000 (Western European Standard Time) |  | 20 | 0.3 | Tue Dec 01 2009 00:00:00 GMT+0000 (Western European Standard Time) | ADMIN |  |  |
| FORMATACAO_STRING | X | MISTO | Formato misto | Wed Nov 30 2005 00:00:00 GMT+0000 (Western European Standard Time) |  | 10 | 0.3 | Tue Dec 01 2009 00:00:00 GMT+0000 (Western European Standard Time) | ADMIN |  |  |
| FORMA_CONTROLO | C | CONTROLADO | Documento controlado mas não único ou Versionado | Sat Jan 23 2010 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Sat Jan 23 2010 00:00:00 GMT+0000 (Western European Standard Time) | COSEC |  |  |
| FORMA_CONTROLO | U | UNICO | Documento único sem versionamento | Sat Jan 23 2010 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Sat Jan 23 2010 00:00:00 GMT+0000 (Western European Standard Time) | COSEC |  |  |
| FORMA_CONTROLO | UV | UNICOVERSIONADO | Documento único e versionado | Sat Jan 23 2010 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Sat Jan 23 2010 00:00:00 GMT+0000 (Western European Standard Time) | COSEC |  |  |
| FORMA_CONTROLO | V | VERSIONADO | Documento Versionado | Sat Jan 23 2010 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Sat Jan 23 2010 00:00:00 GMT+0000 (Western European Standard Time) | COSEC |  |  |
| GEN_LOG | ERRO | Erro | Género de log de erro | Wed Nov 30 2005 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0.2 | Tue Dec 01 2009 00:00:00 GMT+0000 (Western European Standard Time) | ADMIN |  |  |
| GEN_MEDIDA | DIGITAL | DIGITAL | Medição de Ficheiros DIGITAIS | Mon Feb 15 2010 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Mon Feb 15 2010 00:00:00 GMT+0000 (Western European Standard Time) | DISCOSECFOR |  |  |
| GEN_MEDIDA | DISTANCIA | DISTÂNCIA | Medição de Distâncias | Mon Feb 15 2010 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Mon Feb 15 2010 00:00:00 GMT+0000 (Western European Standard Time) | DISCOSECFOR |  |  |
| GEN_MEDIDA | PESO | PESO | Medição de Peso | Mon Feb 15 2010 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Mon Feb 15 2010 00:00:00 GMT+0000 (Western European Standard Time) | DISCOSECFOR |  |  |
| GEN_MENSAGEMSISTEMA | ERRO | Mensagem de erro | Género mensagem de erro | Wed Nov 30 2005 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0.2 | Tue Dec 01 2009 00:00:00 GMT+0000 (Western European Standard Time) | ADMIN |  |  |
| GEN_MENSAGEMSISTEMA | LOG | Mensagem de notifica¿¿o | Género mensagem de notificação | Wed Nov 30 2005 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0.2 | Tue Dec 01 2009 00:00:00 GMT+0000 (Western European Standard Time) | ADMIN |  |  |
| GEN_PARAMCONTEXTO | VALOR | Por valor | Género de parametrização por valor | Wed Nov 30 2005 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0.2 | Tue Dec 01 2009 00:00:00 GMT+0000 (Western European Standard Time) | ADMIN |  |  |
| GSDEVICES | ATX23 | ATX-23 LABEL PRINTER | Practical Automation ATX-23 label printer | Thu Jul 15 2010 00:00:00 GMT+0100 (Western European Summer Time) |  | 100 | 0 | Thu Jul 15 2010 00:00:00 GMT+0100 (Western European Summer Time) | DISCOSECSEMA |  |  |
| GSDEVICES | ATX24 | ATX-24 LABEL PRINTER | Practical Automation ATX-24 label printer | Thu Jul 15 2010 00:00:00 GMT+0100 (Western European Summer Time) |  | 110 | 0 | Thu Jul 15 2010 00:00:00 GMT+0100 (Western European Summer Time) | DISCOSECSEMA |  |  |
| GSDEVICES | ATX38 | ATX-38 LABEL PRINTER | Practical Automation ATX-38 label printer | Thu Jul 15 2010 00:00:00 GMT+0100 (Western European Summer Time) |  | 120 | 0 | Thu Jul 15 2010 00:00:00 GMT+0100 (Western European Summer Time) | DISCOSECSEMA |  |  |
| GSDEVICES | DESKJET | HP DESKJET AND DESKJET PLUS | HP DeskJet and DeskJet Plus | Thu Jul 15 2010 00:00:00 GMT+0100 (Western European Summer Time) |  | 70 | 0 | Thu Jul 15 2010 00:00:00 GMT+0100 (Western European Summer Time) | DISCOSECSEMA |  |  |
| GSDEVICES | FS600 | KYOCERA FS-600 (600 DPI) | Kyocera FS-600 (600 dpi) | Thu Jul 15 2010 00:00:00 GMT+0100 (Western European Summer Time) |  | 80 | 0 | Thu Jul 15 2010 00:00:00 GMT+0100 (Western European Summer Time) | DISCOSECSEMA |  |  |
| GSDEVICES | LASERJET | HP LASERJET | HP LaserJet | Thu Jul 15 2010 00:00:00 GMT+0100 (Western European Summer Time) |  | 60 | 0 | Thu Jul 15 2010 00:00:00 GMT+0100 (Western European Summer Time) | DISCOSECSEMA |  |  |
| GSDEVICES | LJ5MONO | HP LASERJET 5 & 6 FAMILY (PCL XL), BITMAP | HP LaserJet 5 & 6 family (PCL XL), bitmap: | Thu Jul 15 2010 00:00:00 GMT+0100 (Western European Summer Time) |  | 50 | 0 | Thu Jul 15 2010 00:00:00 GMT+0100 (Western European Summer Time) | DISCOSECSEMA |  |  |
| GSDEVICES | LJET4 | HP LASERJET 4 | HP LaserJet 4 (defaults to 600 dpi) | Thu Jul 15 2010 00:00:00 GMT+0100 (Western European Summer Time) |  | 30 | 0 | Thu Jul 15 2010 00:00:00 GMT+0100 (Western European Summer Time) | DISCOSECSEMA |  |  |
| GSDEVICES | LJET4D | HP LASERJET 4  WITH DUPLEX | HP LaserJet 4 (defaults to 600 dpi) with duplex | Thu Jul 15 2010 00:00:00 GMT+0100 (Western European Summer Time) |  | 40 | 0 | Thu Jul 15 2010 00:00:00 GMT+0100 (Western European Summer Time) | DISCOSECSEMA |  |  |
| GSDEVICES | OCE9050 | OCE 9050 PRINTER | OCE 9050 printer | Thu Jul 15 2010 00:00:00 GMT+0100 (Western European Summer Time) |  | 90 | 0 | Thu Jul 15 2010 00:00:00 GMT+0100 (Western European Summer Time) | DISCOSECSEMA |  |  |
| GSDEVICES | PDF | SEM DEVICE | Sem device (PDF enviado directamente para impressora) | Thu Jul 15 2010 00:00:00 GMT+0100 (Western European Summer Time) |  | 20 | 0 | Thu Jul 15 2010 00:00:00 GMT+0100 (Western European Summer Time) | DISCOSECSEMA |  |  |
| GSDEVICES | PSWRITE | POSTSCRIPT OUTPUT (LIKE POSTSCRIPT DISTILLERY) | POSTSCRIPT OUTPUT (LIKE POSTSCRIPT DISTILLERY) | Thu Jul 15 2010 00:00:00 GMT+0100 (Western European Summer Time) |  | 120 | 0 | Fri Jul 16 2010 00:00:00 GMT+0100 (Western European Summer Time) | DISCOSECSEMA |  |  |
| GSDEVICES | PXLCOLOR | HP COLOR PCL XL PRINTERS | HP color PCL XL printers (e.g. Color LaserJet 4500) | Thu Jul 15 2010 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 0 | Thu Jul 15 2010 00:00:00 GMT+0100 (Western European Summer Time) | DISCOSECSEMA |  |  |
| GSDEVICES | PXLMONO | HP BLACK-AND-WHITE PCL XL PRINTERS (LASERJET 5 AND 6 FAMILY | H-P black-and-white PCL XL printers (LaserJet 5 and 6 family) | Thu Jul 15 2010 00:00:00 GMT+0100 (Western European Summer Time) |  | 10 | 0 | Thu Jul 15 2010 00:00:00 GMT+0100 (Western European Summer Time) | DISCOSECSEMA |  |  |
| IMPRESSORAS_AUDITADAS | 2 | TESTES | Testes | Fri Nov 09 2018 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Nov 09 2018 00:00:00 GMT+0000 (Western European Standard Time) | SIID_TESTES |  |  |
| IMPRESSORAS_AUDITADAS | 95 | 2PAMD | Impressora de Outsourcing | Thu Nov 08 2018 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Thu Nov 08 2018 00:00:00 GMT+0000 (Western European Standard Time) | DISCOSEC |  |  |
| LIMITE_IMPRESSAO | E.E1 | 0 | Tempo de ocultação para impressão do documento E1 | Tue Apr 07 2020 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 0 | Tue Apr 07 2020 00:00:00 GMT+0100 (Western European Summer Time) | SIID_TESTES |  |  |
| LIMITE_IMPRESSAO | E.E10.1 | 0 | Tempo de ocultação para impressão do documento E10.1 | Tue Apr 07 2020 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 0 | Tue Apr 07 2020 00:00:00 GMT+0100 (Western European Summer Time) | DISCOSEC |  |  |
| LIMITE_IMPRESSAO | E.E10.6 | 0 | Tempo de ocultação para impressão do documento E10.6 | Fri Jun 30 2017 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 0 | Fri Jun 30 2017 00:00:00 GMT+0100 (Western European Summer Time) | DISCOSEC |  |  |
| LIMITE_IMPRESSAO | E.E10.6D | 1 | Tempo de ocultação para impressão do documento E10.6D | Fri Jun 30 2017 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 0 | Fri Jun 30 2017 00:00:00 GMT+0100 (Western European Summer Time) | DISCOSEC |  |  |
| LIMITE_IMPRESSAO | E.E15 | 0 | Tempo de ocultação para impressão do documento E15 | Tue Apr 07 2020 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 0 | Tue Apr 07 2020 00:00:00 GMT+0100 (Western European Summer Time) | DISCOSEC |  |  |
| LIMITE_IMPRESSAO | E.E4 | 0 | Tempo de ocultação para impressão do documento E4 | Tue Apr 07 2020 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 0 | Tue Apr 07 2020 00:00:00 GMT+0100 (Western European Summer Time) | DISCOSEC |  |  |
| LIMITE_IMPRESSAO | E.E7 | 0 | Tempo de ocultação para impressão do documento E7 | Tue Apr 07 2020 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 0 | Tue Apr 07 2020 00:00:00 GMT+0100 (Western European Summer Time) | DISCOSEC |  |  |
| LIMITE_IMPRESSAO | E.E8 | 0 | Tempo de ocultação para impressão do documento E8 | Fri Jun 30 2017 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 0 | Fri Jun 30 2017 00:00:00 GMT+0100 (Western European Summer Time) | DISCOSEC |  |  |
| LIMITE_IMPRESSAO | E.E9.1 | 0 | Tempo de ocultação para impressão do documento E9.1 | Fri Jun 30 2017 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 0 | Fri Jun 30 2017 00:00:00 GMT+0100 (Western European Summer Time) | DISCOSEC |  |  |
| LIMITE_IMPRESSAO | E.E9.2 | 0 | Tempo de ocultação para impressão do documento E9.2 | Tue Apr 07 2020 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 0 | Tue Apr 07 2020 00:00:00 GMT+0100 (Western European Summer Time) | DISCOSEC |  |  |
| MODO_CERTIFICADO | 0 | ISENTO | Documento não assinado nem certificado | Sat Jan 23 2010 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Sat Jan 23 2010 00:00:00 GMT+0000 (Western European Standard Time) | COSEC |  |  |
| MODO_CERTIFICADO | 1 | ASSINADO | Documento Assinado mas não Selado | Sat Jan 23 2010 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Sat Jan 23 2010 00:00:00 GMT+0000 (Western European Standard Time) | COSEC |  |  |
| MODO_CERTIFICADO | 2 | SELADO | Documento Assinado e Selado | Sat Jan 23 2010 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Sat Jan 23 2010 00:00:00 GMT+0000 (Western European Standard Time) | COSEC |  |  |
| MODO_EXPEDICAO | A | VIA EDOCLINK - ALTERAÇÃO | Documento expedido via edoclink - ALTERAÇÃO | Thu Oct 10 2013 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 0 | Thu Oct 10 2013 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| MODO_EXPEDICAO | E | EMAIL | Documento expedido por email | Sat Jan 23 2010 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Sat Jan 23 2010 00:00:00 GMT+0000 (Western European Standard Time) | COSEC |  |  |
| MODO_EXPEDICAO | G | VIA EDOCLINK - GARANTIA | Documento expedido via edoclink - GARANTIA | Thu Oct 10 2013 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 0 | Thu Oct 10 2013 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| MODO_EXPEDICAO | I | IMPRESSO | Documento expedido para impressora | Sat Jan 23 2010 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Sat Jan 23 2010 00:00:00 GMT+0000 (Western European Standard Time) | COSEC |  |  |
| MODO_EXPEDICAO | M | IMPRESSO E EMAIL | Documento expedido para impressora e por email | Wed Mar 10 2010 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Wed Mar 10 2010 00:00:00 GMT+0000 (Western European Standard Time) | DISCOSECFOR |  |  |
| MODO_EXPEDICAO | W | VIA EDOC-API | Documento expedido via edoc API | Mon Jun 04 2018 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 0 | Mon Jun 04 2018 00:00:00 GMT+0100 (Western European Summer Time) | COSEC |  |  |
| MODO_PROTECAO | 0 | Sem Proteção | Documentos são guardados sem marca de água | Wed Nov 01 2017 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Wed Nov 01 2017 00:00:00 GMT+0000 (Western European Standard Time) | ADMIN |  |  |
| MODO_PROTECAO | 1 | Marca de água nos Docs guardados | Documentos são guardados com marca de água | Wed Nov 01 2017 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Wed Nov 01 2017 00:00:00 GMT+0000 (Western European Standard Time) | ADMIN |  |  |
| TIPO_AMBIENTE | COSEC | COSEC | COSEC - Ambiente de Produção | Mon Mar 08 2010 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Mon Mar 08 2010 00:00:00 GMT+0000 (Western European Standard Time) | DISCOSECFOR |  |  |
| TIPO_AMBIENTE | COSECFOR | COSECFOR | COSECFOR - Ambiente de Desenvolvimento | Mon Mar 08 2010 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Mon Mar 08 2010 00:00:00 GMT+0000 (Western European Standard Time) | DISCOSECFOR |  |  |
| TIPO_AMBIENTE | COSECSEMA | COSECSEMA | COSECSEMA - Ambiente de Testes | Mon Mar 08 2010 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Mon Mar 08 2010 00:00:00 GMT+0000 (Western European Standard Time) | DISCOSECFOR |  |  |
| TIPO_ANEXAGEM | 1 | NORMAL | Normal de testes | Fri Jul 16 2010 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 0 | Fri Jul 16 2010 00:00:00 GMT+0100 (Western European Summer Time) | DISCOSEC |  |  |
| TIPO_CONTEUDO | TEXTO | TEXTO | Conte¿do de tipo texto | Thu Dec 15 2005 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0.3 | Tue Dec 01 2009 00:00:00 GMT+0000 (Western European Standard Time) | ADMIN |  |  |
| TIPO_CONTEUDO | VALOR | VALOR | Conte¿do de tipo valor | Tue Apr 04 2006 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 0.3 | Tue Dec 01 2009 00:00:00 GMT+0000 (Western European Standard Time) | ADMIN |  |  |
| TIPO_DOCUMENTO | D1 | Cartas de Acompanhamento | Documentos Contratuais | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_DOCUMENTO | D10 | Cartas a acusar receção | Cartas a acusar receção | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Mon Jan 28 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO_INTERFACE |  |  |
| TIPO_DOCUMENTO | D11 | Cartas/Fax a Entidades de Risco | Entidades de Risco | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_DOCUMENTO | D12 | ???? | ???? | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Mon Jan 28 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO_INTERFACE |  |  |
| TIPO_DOCUMENTO | D15 | Cartas de Diligências de Cobrança | Diligências de Cobrança | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_DOCUMENTO | D16 | Cartas de Liquidação | Cartas de Liquidação | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Mon Jan 28 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO_INTERFACE |  |  |
| TIPO_DOCUMENTO | D18 | Contas Técnicas | Contas Técnicas | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Mon Jan 28 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO_INTERFACE |  |  |
| TIPO_DOCUMENTO | D19 | Cartas Novas Passwords | Cartas Novas Passwords | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Thu Mar 07 2019 00:00:00 GMT+0000 (Western European Standard Time) | SIID_TESTES |  |  |
| TIPO_DOCUMENTO | D3 | Cartas de Acompanhamento | Documentos Diversos | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_DOCUMENTO | D5 | Cartas de Encerramento | de proposta/processo | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_DOCUMENTO | D6 | Cartas de Pedido de Elementos | Pedido de Elementos | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_DOCUMENTO | D7 | ???? | ???? | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Mon Jan 28 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO_INTERFACE |  |  |
| TIPO_DOCUMENTO | D9 | Cartas de Advogados | Advogados | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Wed Jan 02 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_DOCUMENTO | E | Documentos Contabilísticos | Documentos Contabilísticos | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_DOCUMENTO | I1 | Informação Contabilística em Português | Documentos Internos | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_DOCUMENTO | LOTE | Lote de Documentos | Lote de Documentos | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_DOCUMENTO | M | Mapas DGR | Mapas DGR | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Wed Apr 24 2002 00:00:00 GMT+0100 (Western European Summer Time) | DISCPRED |  |  |
| TIPO_DOCUMENTO | O2 | Outros Documentos | Outros Documentos | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_DOCUMENTO | R2 | Atas adicionais | Atas adicionais | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Thu Mar 07 2019 00:00:00 GMT+0000 (Western European Standard Time) | SIID_TESTES |  |  |
| TIPO_DOCUMENTO | R3 | Garantias e Títulos de Cessão | Documentos Contratuais | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_DOCUMENTO | R4 | Relatórios de Crédito | Documentos Contratuais | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_DOCUMENTO | R5 | Balanços | Balanços | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Mon Jan 28 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO_INTERFACE |  |  |
| TIPO_DOCUMENTO | R6 | Documentos Resseguro | Documentos Resseguro | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Mon Feb 21 2005 00:00:00 GMT+0000 (Western European Standard Time) | DISCOSECSEMA |  |  |
| TIPO_DOMINIO | I | INTERVALO VALORES | Dom¿nio de intervalo de valores | Thu Dec 01 2005 00:00:00 GMT+0000 (Western European Standard Time) |  | 10 | 0.4 | Tue Dec 01 2009 00:00:00 GMT+0000 (Western European Standard Time) | ADMIN |  |  |
| TIPO_DOMINIO | L | LISTA VALORES | Dom¿nio de lista de valores | Thu Dec 01 2005 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0.3 | Tue Dec 01 2009 00:00:00 GMT+0000 (Western European Standard Time) | ADMIN |  |  |
| TIPO_INFORMACAO | DATA | DATA | Tipo de dados data | Wed Nov 30 2005 00:00:00 GMT+0000 (Western European Standard Time) |  | 20 | 0.4 | Tue Dec 01 2009 00:00:00 GMT+0000 (Western European Standard Time) | ADMIN |  |  |
| TIPO_INFORMACAO | NUMBER | NUMÉRICO | Tipo de dados num¿rico | Wed Nov 30 2005 00:00:00 GMT+0000 (Western European Standard Time) |  | 10 | 0.4 | Tue Dec 01 2009 00:00:00 GMT+0000 (Western European Standard Time) | ADMIN |  |  |
| TIPO_INFORMACAO | STRING | STRING | Tipo de dados string | Wed Nov 30 2005 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0.3 | Tue Dec 01 2009 00:00:00 GMT+0000 (Western European Standard Time) | ADMIN |  |  |
| TIPO_LOTE | 1 | ORDENACAO P/ CÓDIGO POSTAL | ORDENACAO P/ CÓDIGO POSTAL | Fri Jul 16 2010 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 0 | Fri Jul 16 2010 00:00:00 GMT+0100 (Western European Summer Time) | DISCOSEC |  |  |
| TIPO_PARAMETRO | 1 | PARAMETROS DESTINADOS AO REPORT | PARAMETROS DESTINADOS AO REPORT | Fri Jul 16 2010 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 0 | Fri Jul 16 2010 00:00:00 GMT+0100 (Western European Summer Time) | DISCOSEC |  |  |
| TIPO_PARAMETRO | 2 | PARAMETROS DESTINADOS AO SIID | PARAMETROS DESTINADOS AO SIID | Fri Jul 16 2010 00:00:00 GMT+0100 (Western European Summer Time) |  | 10 | 0 | Fri Jul 16 2010 00:00:00 GMT+0100 (Western European Summer Time) | DISCOSEC |  |  |
| TIPO_PARAMETRO | 3 | PARAMETROS PASSADOS POR BD | PARAMETROS PASSADOS POR BD | Fri Jul 16 2010 00:00:00 GMT+0100 (Western European Summer Time) |  | 20 | 0 | Fri Jul 16 2010 00:00:00 GMT+0100 (Western European Summer Time) | DISCOSEC |  |  |
| TIPO_PERMISSAO | 0 | GERAR DOCUMENTO | Permite Gerar Documentos | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 22 2010 00:00:00 GMT+0000 (Western European Standard Time) | DISCOSECFOR |  |  |
| TIPO_PERMISSAO | 1 | IMPRIMIR DOCUMENTO | Permite Imprimir Documentos | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 22 2010 00:00:00 GMT+0000 (Western European Standard Time) | DISCOSECFOR |  |  |
| TIPO_PERMISSAO | 2 | IMPRIMIR CÓPIA | Permite Imprimir Cópias de Documentos | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 22 2010 00:00:00 GMT+0000 (Western European Standard Time) | DISCOSECFOR |  |  |
| TIPO_PERMISSAO | 3 | IMPRIMIR 2ª VIA | Permite Imprimir 2ªs Vias de Documentos | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 22 2010 00:00:00 GMT+0000 (Western European Standard Time) | DISCOSECFOR |  |  |
| TIPO_PERMISSAO | 4 | VISUALIZAR | Permite Visualizar Documentos | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 22 2010 00:00:00 GMT+0000 (Western European Standard Time) | DISCOSECFOR |  |  |
| TIPO_PERMISSAO | 5 | ENVIAR POR MAIL | Permite Enviar Documentos por Email | Fri Jan 22 2010 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 22 2010 00:00:00 GMT+0000 (Western European Standard Time) | DISCOSECFOR |  |  |
| TIPO_PERMISSAO | 6 | IMPRIMIR PDF | Permite visualizar sem marca de água e imprimir o PDF | Mon Oct 26 2015 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Mon Oct 26 2015 00:00:00 GMT+0000 (Western European Standard Time) | SIID_TESTES |  |  |
| TIPO_PERMISSAO | 7 | GUARDAR PDF | Permite Guardar o PDF sem a Marca de Água | Fri Nov 17 2017 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Nov 17 2017 00:00:00 GMT+0000 (Western European Standard Time) | SIID_TESTES |  |  |
| TIPO_PERMISSAO | 8 | GUARDAR 2ªs Vias | Permite Guardar o PDF com a marca de água 2ª Via | Fri Jan 18 2019 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 18 2019 00:00:00 GMT+0000 (Western European Standard Time) | DISCOSEC |  |  |
| TIPO_SECCAO | AGRD | AGRADECIMENTOS | Secção de Agradecimentos do Documento | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | ASSN | ASSINATURAS | Secção reservada a Assinatura | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | ASSU | ASSUNTO | Seccção reservada ao Assunto | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | CAB | CABECALHO | Cabeçalho do Documento | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | DEST | DESTINATÁRIO | Secção reservada ao Destinatário | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | INF | INFORMAÇÃO | Secção reservada a Informação Variada | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | LOGO | LOGOTIPO | Secção reservada ao Logotipo | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | PUBL | PUBLICIDADE | Secção reservada a publicidade | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | QDR01 | QUADRO DE VALORES 1 | Lista de valores disposta em Quadro | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | QDR02 | QUADRO DE VALORES 2 | Lista de valores disposta em Quadro | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Thu Apr 18 2002 00:00:00 GMT+0100 (Western European Summer Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | QDR03 | QUADRO DE VALORES 3 | Lista de valores disposta em Quadro | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Thu Apr 18 2002 00:00:00 GMT+0100 (Western European Summer Time) | DISCPRED |  |  |
| TIPO_SECCAO | QDR04 | QUADRO DE VALORES 4 | Lista de valores disposta em Quadro | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Thu Apr 18 2002 00:00:00 GMT+0100 (Western European Summer Time) | DISCPRED |  |  |
| TIPO_SECCAO | QDR05 | QUADRO DE VALORES 5 | Lista de valores disposta em Quadro | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Thu Apr 18 2002 00:00:00 GMT+0100 (Western European Summer Time) | DISCPRED |  |  |
| TIPO_SECCAO | QDR06 | QUADRO DE VALORES 6 | Lista de valores disposta em Quadro | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Thu Apr 18 2002 00:00:00 GMT+0100 (Western European Summer Time) | DISCPRED |  |  |
| TIPO_SECCAO | QDR07 | QUADRO DE VALORES 7 | Lista de valores disposta em Quadro | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Thu Apr 18 2002 00:00:00 GMT+0100 (Western European Summer Time) | DISCPRED |  |  |
| TIPO_SECCAO | QDR08 | QUADRO DE VALORES 8 | Lista de valores disposta em Quadro | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Thu Apr 18 2002 00:00:00 GMT+0100 (Western European Summer Time) | DISCPRED |  |  |
| TIPO_SECCAO | QDR09 | QUADRO DE VALORES 9 | Lista de valores disposta em Quadro | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Thu Apr 18 2002 00:00:00 GMT+0100 (Western European Summer Time) | DISCPRED |  |  |
| TIPO_SECCAO | QDR10 | QUADRO DE VALORES 10 | Lista de valores disposta em Quadro | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Thu Apr 18 2002 00:00:00 GMT+0100 (Western European Summer Time) | DISCPRED |  |  |
| TIPO_SECCAO | QDR11 | QUADRO DE VALORES 11 | Lista de valores disposta em Quadro | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Thu Apr 18 2002 00:00:00 GMT+0100 (Western European Summer Time) | DISCPRED |  |  |
| TIPO_SECCAO | QDR12 | QUADRO DE VALORES 12 | Lista de valores disposta em Quadro | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Thu Apr 18 2002 00:00:00 GMT+0100 (Western European Summer Time) | DISCPRED |  |  |
| TIPO_SECCAO | QDR13 | QUADRO DE VALORES 13 | Lista de valores disposta em Quadro | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Thu Apr 18 2002 00:00:00 GMT+0100 (Western European Summer Time) | DISCPRED |  |  |
| TIPO_SECCAO | QDR14 | QUADRO DE VALORES 14 | Lista de valores disposta em Quadro | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Thu Apr 18 2002 00:00:00 GMT+0100 (Western European Summer Time) | DISCPRED |  |  |
| TIPO_SECCAO | QDR15 | QUADRO DE VALORES 15 | Lista de valores disposta em Quadro | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Thu Apr 18 2002 00:00:00 GMT+0100 (Western European Summer Time) | DISCPRED |  |  |
| TIPO_SECCAO | QDR16 | QUADRO DE VALORES 16 | Lista de valores disposta em Quadro | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Thu Apr 18 2002 00:00:00 GMT+0100 (Western European Summer Time) | DISCPRED |  |  |
| TIPO_SECCAO | QDR17 | QUADRO DE VALORES 17 | Lista de valores disposta em Quadro | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Thu Apr 18 2002 00:00:00 GMT+0100 (Western European Summer Time) | DISCPRED |  |  |
| TIPO_SECCAO | QDR18 | QUADRO DE VALORES 18 | Lista de valores disposta em Quadro | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Thu Apr 18 2002 00:00:00 GMT+0100 (Western European Summer Time) | DISCPRED |  |  |
| TIPO_SECCAO | QDRMB | QUADRO MultiBanco | Tabela de Referências Multibanco | Mon Aug 01 2022 00:00:00 GMT+0100 (Western European Summer Time) |  | 0 | 0 | Mon Sep 26 2022 00:00:00 GMT+0100 (Western European Summer Time) | DISCOSEC |  |  |
| TIPO_SECCAO | REM | REMETENTE | Secção reservada ao Remetente do documento | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | RODP | RODAPÉ | Rodapé do Documento | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | RODP_DIR | RODAPÉ À DIREITA | Divisória de rodapé direita | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Tue Sep 23 2003 00:00:00 GMT+0100 (Western European Summer Time) | DISCOSECSEMA |  |  |
| TIPO_SECCAO | SEC0 | SECÇÃO 0 | Secção genérica do documento | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | SEC1 | SECÇÃO 1 | Secção genérica do documento | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | SEC10 | SECÇÃO 10 | Secção genérica do documento | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | SEC11 | SECÇÃO 11 | Secção genérica do documento | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | SEC12 | SECÇÃO 12 | Secção genérica do documento | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | SEC13 | SECÇÃO 13 | Secção genérica do documento | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | SEC14 | SECÇÃO 14 | Secção genérica do documento | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | SEC15 | SECÇÃO 15 | Secção genérica do documento | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | SEC16 | SECÇÃO 16 | Secção genérica do documento | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | SEC17 | SECÇÃO 17 | Secção genérica do documento | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | SEC18 | SECÇÃO 18 | Secção genérica do documento | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | SEC19 | SECÇÃO 19 | Secção genérica do documento | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | SEC2 | SECÇÃO 2 | Secção genérica do documento | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | SEC20 | SECÇÃO 20 | Secção genérica do documento | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | SEC3 | SECÇÃO 3 | Secção genérica do documento | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | SEC4 | SECÇÃO 4 | Secção genérica do documento | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | SEC5 | SECÇÃO 5 | Secção genérica do documento | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | SEC6 | SECÇÃO 6 | Secção genérica do documento | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | SEC7 | SECÇÃO 7 | Secção genérica do documento | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | SEC8 | SECÇÃO 8 | Secção genérica do documento | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | SEC9 | SECÇÃO 9 | Secção genérica do documento | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Jan 04 2002 00:00:00 GMT+0000 (Western European Standard Time) | IMPRESSAO |  |  |
| TIPO_SECCAO | TIT | TITULO | Secção reservada ao Título do documento | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Fri Apr 19 2002 00:00:00 GMT+0100 (Western European Summer Time) | DISCPRED |  |  |
| TIPO_SECCAO | VERSAO | INDICADOR DA VERSÃO DO DOCUMENTO | Secção para indicar versão do documento | Sat Jan 01 2000 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Tue Feb 22 2005 00:00:00 GMT+0000 (Western European Standard Time) | DISCOSECSEMA |  |  |
| TIPO_STRING | A | ALFANUMÉRICA | Tipo de string de alfanumérica | Wed Nov 30 2005 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0.3 | Tue Dec 01 2009 00:00:00 GMT+0000 (Western European Standard Time) | ADMIN |  |  |
| TIPO_STRING | C | CARACTERES | Tipo de string de caracteres | Wed Nov 30 2005 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0.3 | Tue Dec 01 2009 00:00:00 GMT+0000 (Western European Standard Time) | ADMIN |  |  |
| TIPO_STRING | N | NUMÉRICA | Tipo de string numérica | Wed Nov 30 2005 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0.3 | Tue Dec 01 2009 00:00:00 GMT+0000 (Western European Standard Time) | ADMIN |  |  |
| TIPO_UTILIZADOR | ADM | ADMINISTRADOR | Administrador do Sistema | Mon Mar 08 2010 00:00:00 GMT+0000 (Western European Standard Time) |  | 0 | 0 | Mon Mar 08 2010 00:00:00 GMT+0000 (Western European Standard Time) | DISCOSECFOR |  |  |

